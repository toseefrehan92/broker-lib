import { BrokerConfig, BrokerType } from './config';
import { IBroker, MessageHandler, PublishOptions, SubscribeOptions } from './types';
import { KafkaBroker } from './brokers/kafka';
import { MqttBroker } from './brokers/mqtt';
import { GCPPubSubBroker } from './brokers/gcpPubSub';
import { EventEmitter } from 'events';

export class BrokerManager extends EventEmitter {
  private broker: IBroker;
  private config: BrokerConfig;
  private messageHandler?: MessageHandler;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

  constructor(config: BrokerConfig) {
    super();
    this.config = config;
    this.broker = this.createBroker(config);
    
    // Set up event listeners for the broker
    if (this.broker instanceof EventEmitter) {
      this.broker.on('connect', () => {
        this.connectionState = 'connected';
        this.emit('connect');
      });
      
      this.broker.on('disconnect', () => {
        this.connectionState = 'disconnected';
        this.emit('disconnect');
      });
      
      this.broker.on('error', (error) => {
        this.connectionState = 'error';
        this.emit('error', error);
      });
      
      this.broker.on('reconnect', () => {
        this.connectionState = 'connected';
        this.emit('reconnect');
      });
      
      this.broker.on('reconnect_failed', (error) => {
        this.connectionState = 'error';
        this.emit('reconnect_failed', error);
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
      throw new Error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async publish(topic: string, message: string | Buffer, options?: PublishOptions): Promise<void> {
    try {
      // Ensure we're connected before publishing
      if (!this.isConnected()) {
        await this.connect();
      }
      
      await this.broker.publish(topic, message, options);
    } catch (error) {
      throw new Error(`Failed to publish message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async subscribe(topics: string[], handler?: MessageHandler, options?: SubscribeOptions): Promise<void> {
    try {
      // Ensure we're connected before subscribing
      if (!this.isConnected()) {
        await this.connect();
      }
      
      const messageHandler = handler || this.messageHandler;
      if (!messageHandler) {
        throw new Error('Message handler is required for subscription');
      }
      
      await this.broker.subscribe(topics, messageHandler, options);
    } catch (error) {
      throw new Error(`Failed to subscribe to topics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
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

  isConnected(): boolean {
    return this.broker.isConnected() && this.connectionState === 'connected';
  }

  getConnectionState(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    return this.connectionState;
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