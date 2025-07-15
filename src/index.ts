import { BrokerConfig, BrokerType } from './config';
import { IBroker, MessageHandler, PublishOptions, SubscribeOptions } from './types';
import { KafkaBroker } from './brokers/kafka';
import { MqttBroker } from './brokers/mqtt';
import { GCPPubSubBroker } from './brokers/gcpPubSub';
import { EventEmitter } from 'events';

interface ReconnectionConfig {
  enabled: boolean;
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// New interface for simplified subscription
export interface SubscriptionOptions {
  topic: string;
  fromBeginning?: boolean;
  qos?: number;
  autoAck?: boolean;
}

export interface SubscriptionCallback {
  (message: any): void;
}

// New interface for topic-handler mapping
export interface TopicHandlerMapping {
  topic: string;
  handler: SubscriptionCallback;
  options?: Omit<SubscriptionOptions, 'topic'>;
}

// Environment configuration interface
export interface BrokerEnvConfig {
  BROKER_TYPE?: string;
  BROKER_CLIENT_ID?: string;
  MQTT_URL?: string;
  KAFKA_BROKERS?: string;
  KAFKA_GROUP_ID?: string;
  GCP_PROJECT_ID?: string;
  GCP_KEY_FILENAME?: string;
  [key: string]: string | undefined;
}

// Factory function to create broker configuration from environment variables
export function createBrokerConfigFromEnv(
  env: BrokerEnvConfig,
  defaultClientId: string = 'broker-lib-app'
): BrokerConfig {
  const brokerType = (env.BROKER_TYPE || 'KAFKA') as BrokerType;
  const clientId = env.BROKER_CLIENT_ID || defaultClientId;

  switch (brokerType) {
    case 'MQTT':
      return {
        brokerType: 'MQTT',
        mqtt: {
          url: env.MQTT_URL || 'mqtt://localhost:1883',
          clientId,
          clean: true,
          reconnectPeriod: 1000,
          connectTimeout: 30000,
        },
      };

    case 'KAFKA':
      return {
        brokerType: 'KAFKA',
        kafka: {
          clientId,
          brokers: (env.KAFKA_BROKERS || 'localhost:9092').split(',').map(b => b.trim()),
          groupId: env.KAFKA_GROUP_ID || `${clientId}-group`,
        },
      };

    case 'GCP_PUBSUB':
      const gcpConfig: any = {
        projectId: env.GCP_PROJECT_ID || 'your-project-id',
      };
      
      if (env.GCP_KEY_FILENAME) {
        gcpConfig.keyFilename = env.GCP_KEY_FILENAME;
      }
      
      return {
        brokerType: 'GCP_PUBSUB',
        gcp: gcpConfig,
      };

    default:
      // Default to Kafka
      return {
        brokerType: 'KAFKA',
        kafka: {
          clientId,
          brokers: (env.KAFKA_BROKERS || 'localhost:9092').split(',').map(b => b.trim()),
          groupId: env.KAFKA_GROUP_ID || `${clientId}-group`,
        },
      };
  }
}

// Factory function to create SubscriptionManager from environment variables
export function createSubscriptionManagerFromEnv(
  env: BrokerEnvConfig,
  defaultClientId: string = 'broker-lib-app',
  logger: Console = console
): SubscriptionManager {
  const config = createBrokerConfigFromEnv(env, defaultClientId);
  return new SubscriptionManager(config, logger);
}

// Factory function to create BrokerManager from environment variables
export function createBrokerManagerFromEnv(
  env: BrokerEnvConfig,
  defaultClientId: string = 'broker-lib-app'
): BrokerManager {
  const config = createBrokerConfigFromEnv(env, defaultClientId);
  return new BrokerManager(config);
}

// New SubscriptionManager class for simplified subscription interface
export class SubscriptionManager extends EventEmitter {
  private brokerManager: BrokerManager;
  private logger: Console;
  private topicHandlers: Map<string, SubscriptionCallback> = new Map();

  constructor(brokerConfig: BrokerConfig, logger: Console = console) {
    super();
    this.brokerManager = new BrokerManager(brokerConfig);
    this.logger = logger;

    // Forward broker events
    this.brokerManager.on('connect', () => this.emit('connect'));
    this.brokerManager.on('disconnect', () => this.emit('disconnect'));
    this.brokerManager.on('error', (error) => this.emit('error', error));
    this.brokerManager.on('connecting', () => this.emit('connecting'));
    this.brokerManager.on('reconnect', () => this.emit('reconnect'));
    this.brokerManager.on('reconnect_failed', (error) => this.emit('reconnect_failed', error));
  }

  async connect(): Promise<void> {
    await this.brokerManager.connect();
  }

  async disconnect(): Promise<void> {
    await this.brokerManager.disconnect();
  }

  // Single topic subscription (existing method)
  async subscribe(options: SubscriptionOptions, callback: SubscriptionCallback): Promise<void> {
    try {
      await this.ensureConnection();

      // Store the handler for this topic
      this.topicHandlers.set(options.topic, callback);

      // Use the subscribe method with options
      const subscribeOptions: SubscribeOptions = {
        qos: options.qos ?? 1, // Default QoS for MQTT compatibility
        autoAck: options.autoAck ?? true, // Default auto-ack for GCP PubSub compatibility
      };
      
      if (options.fromBeginning !== undefined) {
        subscribeOptions.fromBeginning = options.fromBeginning;
      }

      // Create the message handler that routes to the appropriate callback
      const messageHandler = (topic: string, message: Buffer) => {
        this.logger.log(`Received message on topic ${topic}: ${message.toString()}`);
        
        const handler = this.topicHandlers.get(topic);
        if (handler) {
          try {
            const parsedMessage = JSON.parse(message.toString());
            handler(parsedMessage);
          } catch (parseError) {
            this.logger.warn('Failed to parse message as JSON, passing raw message');
            handler(message.toString());
          }
        } else {
          this.logger.warn(`No handler found for topic: ${topic}`);
        }
      };

      await this.brokerManager.subscribe([options.topic], messageHandler, subscribeOptions);
      this.logger.log(`Subscribed to topic: ${options.topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic: ${options.topic}`, error);

      // Handle Kafka-specific subscription error
      if (error instanceof Error && error.message.includes('Cannot subscribe to topic while consumer is running')) {
        this.logger.warn(`Consumer is already running. Topic ${options.topic} may already be subscribed.`);
        // For Kafka, we can't subscribe to additional topics after consumer is running
        // The topic should already be subscribed if it was added in a previous call
        return;
      }

      throw error;
    }
  }

  // New method for multiple topic subscriptions with different handlers
  async subscribeMultiple(mappings: TopicHandlerMapping[]): Promise<void> {
    try {
      await this.ensureConnection();

      // Store all handlers
      for (const mapping of mappings) {
        this.topicHandlers.set(mapping.topic, mapping.handler);
      }

      // Subscribe to all topics
      const topics = mappings.map(m => m.topic);
      const defaultOptions: SubscribeOptions = {
        qos: 1,
        autoAck: true,
      };

      // Create the message handler that routes to the appropriate callback
      const messageHandler = (topic: string, message: Buffer) => {
        this.logger.log(`Received message on topic ${topic}: ${message.toString()}`);
        
        const handler = this.topicHandlers.get(topic);
        if (handler) {
          try {
            const parsedMessage = JSON.parse(message.toString());
            handler(parsedMessage);
          } catch (parseError) {
            this.logger.warn('Failed to parse message as JSON, passing raw message');
            handler(message.toString());
          }
        } else {
          this.logger.warn(`No handler found for topic: ${topic}`);
        }
      };

      await this.brokerManager.subscribe(topics, messageHandler, defaultOptions);
      
      this.logger.log(`Subscribed to ${topics.length} topics: ${topics.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topics: ${mappings.map(m => m.topic).join(', ')}`, error);

      // Handle Kafka-specific subscription error
      if (error instanceof Error && error.message.includes('Cannot subscribe to topic while consumer is running')) {
        this.logger.warn(`Consumer is already running. Some topics may already be subscribed.`);
        return;
      }

      throw error;
    }
  }

  // Alternative method for subscribing with a single handler for all topics
  async subscribeToTopics(topics: string[], callback: SubscriptionCallback, options?: Omit<SubscriptionOptions, 'topic'>): Promise<void> {
    const mappings: TopicHandlerMapping[] = topics.map(topic => {
      const mapping: TopicHandlerMapping = {
        topic,
        handler: callback,
      };
      
      if (options) {
        mapping.options = options;
      }
      
      return mapping;
    });

    await this.subscribeMultiple(mappings);
  }

  async publish(topic: string, message: any, options?: PublishOptions): Promise<void> {
    try {
      await this.ensureConnection();

      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      await this.brokerManager.publish(topic, messageString, options);
      this.logger.log(`Published message to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish message to topic: ${topic}`, error);
      throw error;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.brokerManager.isConnected()) {
      await this.brokerManager.connect();
    }
  }

  // Get all subscribed topics
  getSubscribedTopics(): string[] {
    return Array.from(this.topicHandlers.keys());
  }

  // Get handler for a specific topic
  getHandler(topic: string): SubscriptionCallback | undefined {
    return this.topicHandlers.get(topic);
  }

  // Remove handler for a specific topic
  removeHandler(topic: string): boolean {
    return this.topicHandlers.delete(topic);
  }

  // Clear all handlers
  clearHandlers(): void {
    this.topicHandlers.clear();
  }

  // Expose broker manager methods for advanced usage
  getBrokerManager(): BrokerManager {
    return this.brokerManager;
  }

  isConnected(): boolean {
    return this.brokerManager.isConnected();
  }

  getConnectionState(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    return this.brokerManager.getConnectionState();
  }

  getReconnectAttempts(): number {
    return this.brokerManager.getReconnectAttempts();
  }

  setReconnectionConfig(config: Partial<ReconnectionConfig>): void {
    this.brokerManager.setReconnectionConfig(config);
  }

  getBrokerType(): BrokerType {
    return this.brokerManager.getBrokerType();
  }

  // Polling support for GCP Pub/Sub (when real-time subscription is not available)
  async startPolling(topics: string[], intervalMs: number = 5000): Promise<void> {
    if (this.getBrokerType() !== 'GCP_PUBSUB') {
      throw new Error('Polling is only supported for GCP Pub/Sub');
    }

    this.logger.log(`Starting polling for topics: ${topics.join(', ')} with interval: ${intervalMs}ms`);

    const pollInterval = setInterval(async () => {
      try {
        for (const topic of topics) {
          const handler = this.topicHandlers.get(topic);
          if (handler) {
            // Simulate message polling - in real implementation, this would call GCP Pub/Sub API
            this.logger.log(`Polling topic: ${topic}`);
            
            // For demonstration, we'll simulate receiving a message
            // In a real implementation, you would:
            // 1. Call GCP Pub/Sub API to pull messages
            // 2. Process each message
            // 3. Acknowledge messages
            
            const mockMessage = {
              topic,
              timestamp: new Date().toISOString(),
              data: `Polled message from ${topic}`,
              messageId: `msg_${Date.now()}`
            };

            handler(mockMessage);
          }
        }
      } catch (error) {
        this.logger.error('Error during polling:', error);
      }
    }, intervalMs);

    // Store the interval ID for cleanup
    (this as any).pollInterval = pollInterval;
  }

  async stopPolling(): Promise<void> {
    if ((this as any).pollInterval) {
      clearInterval((this as any).pollInterval);
      (this as any).pollInterval = null;
      this.logger.log('Stopped polling');
    }
  }

  // Check if polling is active
  isPolling(): boolean {
    return !!(this as any).pollInterval;
  }
}

export class BrokerManager extends EventEmitter {
  private broker: IBroker;
  private config: BrokerConfig;
  private messageHandler?: MessageHandler;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private reconnectionConfig: ReconnectionConfig;
  private reconnectAttempts = 0;
  private reconnectTimeout?: NodeJS.Timeout;
  private isReconnecting = false;
  private pendingOperations: Array<() => Promise<void>> = [];

  constructor(config: BrokerConfig) {
    super();
    this.config = config;
    this.broker = this.createBroker(config);
    
    // Default reconnection configuration
    this.reconnectionConfig = {
      enabled: true,
      maxAttempts: 10,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    };
    
    // Set up event listeners for the broker
    if (this.broker instanceof EventEmitter) {
      this.broker.on('connect', () => {
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.emit('connect');
        this.processPendingOperations();
      });
      
      this.broker.on('disconnect', () => {
        this.connectionState = 'disconnected';
        this.emit('disconnect');
        this.handleDisconnection();
      });
      
      this.broker.on('error', (error) => {
        this.connectionState = 'error';
        this.emit('error', error);
        this.handleDisconnection();
      });
      
      this.broker.on('reconnect', () => {
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.emit('reconnect');
        this.processPendingOperations();
      });
      
      this.broker.on('reconnect_failed', (error) => {
        this.connectionState = 'error';
        this.emit('reconnect_failed', error);
        this.handleReconnectFailure(error);
      });
    }
  }

  private createBroker(config: BrokerConfig): IBroker {
    switch (config.brokerType) {
      case 'KAFKA':
        if (!config.kafka) {
          throw new Error('Kafka configuration is required for KAFKA broker type');
        }
        return new KafkaBroker(config.kafka);
      
      case 'MQTT':
        if (!config.mqtt) {
          throw new Error('MQTT configuration is required for MQTT broker type');
        }
        return new MqttBroker(config.mqtt);
      
      case 'GCP_PUBSUB':
        if (!config.gcp) {
          throw new Error('GCP PubSub configuration is required for GCP_PUBSUB broker type');
        }
        return new GCPPubSubBroker(config.gcp);
      
      default:
        throw new Error(`Invalid broker type: ${config.brokerType}`);
    }
  }

  private handleDisconnection(): void {
    if (!this.reconnectionConfig.enabled || this.isReconnecting) {
      return;
    }

    if (this.reconnectAttempts < this.reconnectionConfig.maxAttempts) {
      this.scheduleReconnect();
    } else {
      this.emit('reconnect_failed', new Error('Max reconnection attempts reached'));
    }
  }

  private handleReconnectFailure(error: any): void {
    if (this.reconnectAttempts < this.reconnectionConfig.maxAttempts) {
      this.scheduleReconnect();
    } else {
      this.emit('reconnect_failed', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(
      this.reconnectionConfig.initialDelay * Math.pow(this.reconnectionConfig.backoffMultiplier, this.reconnectAttempts),
      this.reconnectionConfig.maxDelay
    );

    this.reconnectTimeout = setTimeout(() => {
      this.attemptReconnect();
    }, delay);
  }

  private async attemptReconnect(): Promise<void> {
    if (this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    this.connectionState = 'connecting';
    this.emit('connecting');

    try {
      await this.broker.connect();
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.emit('connect');
      this.processPendingOperations();
    } catch (error) {
      this.connectionState = 'error';
      this.isReconnecting = false;
      this.emit('error', error);
      
      if (this.reconnectAttempts < this.reconnectionConfig.maxAttempts) {
        this.scheduleReconnect();
      } else {
        this.emit('reconnect_failed', error);
      }
    }
  }

  private async processPendingOperations(): Promise<void> {
    const operations = [...this.pendingOperations];
    this.pendingOperations = [];
    
    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Failed to process pending operation:', error);
      }
    }
  }

  private async executeWithReconnection<T>(operation: () => Promise<T>): Promise<T> {
    try {
      if (!this.isConnected()) {
        // Queue the operation and attempt to reconnect
        return new Promise((resolve, reject) => {
          this.pendingOperations.push(async () => {
            try {
              const result = await operation();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
          
          if (!this.isReconnecting) {
            this.attemptReconnect();
          }
        });
      }
      
      return await operation();
    } catch (error) {
      // If the operation fails due to connection issues, queue it for retry
      if (this.isConnectionError(error)) {
        return new Promise((resolve, reject) => {
          this.pendingOperations.push(async () => {
            try {
              const result = await operation();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
          
          if (!this.isReconnecting) {
            this.attemptReconnect();
          }
        });
      }
      
      throw error;
    }
  }

  private isConnectionError(error: any): boolean {
    const errorMessage = error?.message || '';
    const connectionErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'connection lost',
      'connection closed',
      'network error',
      'socket error'
    ];
    
    return connectionErrors.some(connError => 
      errorMessage.toLowerCase().includes(connError.toLowerCase())
    );
  }

  async connect(): Promise<void> {
    try {
      this.connectionState = 'connecting';
      this.emit('connecting');
      
      await this.broker.connect();
      
      this.connectionState = 'connected';
      this.emit('connect');
    } catch (error) {
      this.connectionState = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  async publish(topic: string, message: string | Buffer, options?: PublishOptions): Promise<void> {
    return this.executeWithReconnection(async () => {
      await this.broker.publish(topic, message, options);
    });
  }

  async subscribe(topics: string[], handler?: MessageHandler, options?: SubscribeOptions): Promise<void> {
    return this.executeWithReconnection(async () => {
      if (handler) {
        this.messageHandler = handler;
      }
      await this.broker.subscribe(topics, this.messageHandler!, options);
    });
  }

  async disconnect(): Promise<void> {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      await this.broker.disconnect();
      
      this.connectionState = 'disconnected';
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.pendingOperations = [];
      
      this.emit('disconnect');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async reconnect(): Promise<void> {
    try {
      await this.disconnect();
      await this.connect();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  setReconnectionConfig(config: Partial<ReconnectionConfig>): void {
    this.reconnectionConfig = { ...this.reconnectionConfig, ...config };
  }

  isConnected(): boolean {
    return this.broker.isConnected();
  }

  getConnectionState(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    return this.connectionState;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  getBrokerType(): BrokerType {
    return this.config.brokerType;
  }

  setMessageHandler(handler: MessageHandler): void {
    this.messageHandler = handler;
  }
}

// Re-export types for convenience
export * from './types';
export * from './config';