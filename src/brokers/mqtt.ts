import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { IBroker, MessageHandler, PublishOptions, SubscribeOptions } from '../types';
import { MqttConfig } from '../config';
import { EventEmitter } from 'events';

export class MqttBroker extends EventEmitter implements IBroker {
  private client: MqttClient;
  private connected = false;

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
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('MQTT connection timeout'));
      }, 30000);

      this.client.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client.once('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`MQTT connection failed: ${error.message}`));
      });
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

      this.client.on('message', async (topic, message) => {
        try {
          await handler(topic, message);
        } catch (error) {
          console.error(`Error handling message from topic ${topic}:`, error);
        }
      });

      const subscribeOptions = {
        qos: (options?.qos ?? 0) as 0 | 1 | 2,
      };

      this.client.subscribe(topics, subscribeOptions, (error) => {
        if (error) {
          reject(new Error(`Failed to subscribe to topics ${topics.join(', ')}: ${error.message}`));
        } else {
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