import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { IBroker, MessageHandler, PublishOptions, SubscribeOptions } from '../types';
import { MqttConfig } from '../config';
import { EventEmitter } from 'events';

export class MqttBroker extends EventEmitter implements IBroker {
  private client: MqttClient;
  private connected = false;
  private messageHandler?: MessageHandler;
  private subscribedTopics = new Set<string>();

  constructor(config: MqttConfig) {
    super();
    
    const options: IClientOptions = {
      clean: config.clean ?? true,
      reconnectPeriod: config.reconnectPeriod ?? 1000,
      connectTimeout: config.connectTimeout ?? 30000,
      rejectUnauthorized: config.rejectUnauthorized ?? true,
    };

    if (config.username) {
      options.username = config.username;
    }
    if (config.password) {
      options.password = config.password;
    }
    if (config.clientId) {
      options.clientId = config.clientId;
    }

    this.client = mqtt.connect(config.url, options);

    // Increase max listeners to prevent warnings
    this.client.setMaxListeners(20);

    this.client.on('connect', () => {
      this.connected = true;
      this.emit('connect');
    });

    this.client.on('error', (error) => {
      this.connected = false;
      // Don't emit error for connection-related issues that will be handled by reconnection
      if (!this.isConnectionError(error)) {
        this.emit('error', error);
      }
    });

    this.client.on('close', () => {
      this.connected = false;
      this.emit('disconnect');
    });

    this.client.on('reconnect', () => {
      this.emit('reconnect');
    });

    // Set up a single message handler that uses the stored messageHandler
    this.client.on('message', async (topic, message) => {
      if (this.messageHandler) {
        try {
          await this.messageHandler(topic, message);
        } catch (error) {
          console.error(`Error handling message from topic ${topic}:`, error);
          this.emit('error', error);
        }
      }
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        // Clean up listeners on timeout
        this.client.removeAllListeners('connect');
        this.client.removeAllListeners('error');
        reject(new Error('MQTT connection timeout'));
      }, 30000);

      const connectHandler = () => {
        clearTimeout(timeout);
        // Clean up listeners on successful connection
        this.client.removeListener('connect', connectHandler);
        this.client.removeListener('error', errorHandler);
        resolve();
      };

      const errorHandler = (error: any) => {
        clearTimeout(timeout);
        // Clean up listeners on error
        this.client.removeListener('connect', connectHandler);
        this.client.removeListener('error', errorHandler);
        reject(new Error(`MQTT connection failed: ${error.message}`));
      };

      this.client.once('connect', connectHandler);
      this.client.once('error', errorHandler);
    });
  }

  async publish(topic: string, message: string | Buffer, options?: PublishOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('MQTT broker is not connected. Call connect() first.'));
        return;
      }

      const publishOptions = {
        qos: (options?.qos ?? 0) as 0 | 1 | 2,
        retain: options?.retain ?? false,
      };

      this.client.publish(topic, message, publishOptions, (error) => {
        if (error) {
          reject(new Error(`Failed to publish message to topic ${topic}: ${error.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async subscribe(topics: string[], handler: MessageHandler, options?: SubscribeOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('MQTT broker is not connected. Call connect() first.'));
        return;
      }

      // Store the message handler
      this.messageHandler = handler;

      // Subscribe to new topics only
      const newTopics = topics.filter(topic => !this.subscribedTopics.has(topic));
      
      if (newTopics.length === 0) {
        // All topics are already subscribed, just update the handler
        resolve();
        return;
      }

      const subscribeOptions = {
        qos: (options?.qos ?? 0) as 0 | 1 | 2,
      };

      this.client.subscribe(newTopics, subscribeOptions, (error) => {
        if (error) {
          reject(new Error(`Failed to subscribe to topics ${newTopics.join(', ')}: ${error.message}`));
        } else {
          // Add new topics to the subscribed set
          for (const topic of newTopics) {
            this.subscribedTopics.add(topic);
          }
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        this.client.end(true, {}, (error) => {
          if (error) {
            reject(new Error(`Failed to disconnect: ${error.message}`));
          } else {
            this.connected = false;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  isConnected(): boolean {
    return this.connected;
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
}