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
      this.reconnectAttempts = 0;
      this.emit('connect');
    } catch (error) {
      this.connectionState = 'error';
      this.emit('error', error);
      throw new Error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async publish(topic: string, message: string | Buffer, options?: PublishOptions): Promise<void> {
    return this.executeWithReconnection(async () => {
      await this.broker.publish(topic, message, options);
    });
  }

  async subscribe(topics: string[], handler?: MessageHandler, options?: SubscribeOptions): Promise<void> {
    return this.executeWithReconnection(async () => {
      const messageHandler = handler || this.messageHandler;
      if (!messageHandler) {
        throw new Error('Message handler is required for subscription');
      }
      
      await this.broker.subscribe(topics, messageHandler, options);
    });
  }

  async disconnect(): Promise<void> {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      this.isReconnecting = false;
      this.pendingOperations = [];
      
      await this.broker.disconnect();
      this.connectionState = 'disconnected';
      this.emit('disconnect');
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async reconnect(): Promise<void> {
    try {
      await this.disconnect();
      await this.connect();
    } catch (error) {
      throw new Error(`Failed to reconnect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  setReconnectionConfig(config: Partial<ReconnectionConfig>): void {
    this.reconnectionConfig = { ...this.reconnectionConfig, ...config };
  }

  isConnected(): boolean {
    return this.broker.isConnected() && this.connectionState === 'connected';
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

// Export types and classes for external use
export * from './types';
export * from './config';
export { KafkaBroker } from './brokers/kafka';
export { MqttBroker } from './brokers/mqtt';
export { GCPPubSubBroker } from './brokers/gcpPubSub';