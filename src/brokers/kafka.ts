import { Kafka, Consumer, Producer, KafkaConfig as KafkaJSConfig } from 'kafkajs';
import { IBroker, MessageHandler, PublishOptions, SubscribeOptions } from '../types';
import { KafkaConfig } from '../config';

import { EventEmitter } from 'events';

export class KafkaBroker extends EventEmitter implements IBroker {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private connected = false;
  private producerConnected = false;
  private consumerConnected = false;
  private consumerRunning = false;
  private subscribedTopics = new Set<string>();
  private messageHandler: MessageHandler | undefined;

  constructor(config: KafkaConfig) {
    super();
    
    const kafkaConfig: KafkaJSConfig = {
      clientId: config.clientId,
      brokers: config.brokers,
      // Optionally, you can set logLevel here for debugging
      // logLevel: logLevel.INFO,
    };

    if (config.ssl) {
      kafkaConfig.ssl = config.ssl;
    }

    if (config.sasl) {
      if (config.sasl.mechanism === 'plain') {
        kafkaConfig.sasl = {
          mechanism: 'plain',
          username: config.sasl.username,
          password: config.sasl.password,
        };
      } else if (config.sasl.mechanism === 'scram-sha-256') {
        kafkaConfig.sasl = {
          mechanism: 'scram-sha-256',
          username: config.sasl.username,
          password: config.sasl.password,
        };
      } else if (config.sasl.mechanism === 'scram-sha-512') {
        kafkaConfig.sasl = {
          mechanism: 'scram-sha-512',
          username: config.sasl.username,
          password: config.sasl.password,
        };
      }
    }

    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: config.groupId });
  }

  async connect(): Promise<void> {
    try {
      // Connect producer
      if (!this.producerConnected) {
        await this.producer.connect();
        this.producerConnected = true;
      }

      // Connect consumer
      if (!this.consumerConnected) {
        await this.consumer.connect();
        this.consumerConnected = true;
      }

      this.connected = true;
      this.emit('connect');
    } catch (error) {
      this.connected = false;
      this.producerConnected = false;
      this.consumerConnected = false;
      this.emit('error', error);
      throw new Error(`Failed to connect to Kafka: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async publish(topic: string, message: string | Buffer, options?: PublishOptions): Promise<void> {
    try {
      if (!this.connected) {
        throw new Error('Kafka broker is not connected. Call connect() first.');
      }

      const messageObj: any = {
        value: typeof message === 'string' ? Buffer.from(message) : message,
      };

      if (options?.key) {
        messageObj.key = options.key;
      }
      if (options?.headers) {
        messageObj.headers = options.headers;
      }
      if (options?.timestamp) {
        messageObj.timestamp = options.timestamp.getTime().toString();
      }
      if (options?.partition !== undefined) {
        messageObj.partition = options.partition;
      }

      await this.producer.send({
        topic,
        messages: [messageObj],
      });
    } catch (error) {
      // Check if it's a connection-related error
      if (error instanceof Error && (
        error.message.includes('ECONNRESET') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('Connection closed')
      )) {
        this.connected = false;
        this.producerConnected = false;
        this.consumerConnected = false;
        this.consumerRunning = false;
        this.emit('disconnect');
      }
      this.emit('error', error);
      throw new Error(`Failed to publish message to topic ${topic}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async subscribe(topics: string[], handler: MessageHandler, options?: SubscribeOptions): Promise<void> {
    try {
      if (!this.connected) {
        throw new Error('Kafka broker is not connected. Call connect() first.');
      }

      // Store the message handler
      this.messageHandler = handler;

      // Subscribe to new topics
      const newTopics = topics.filter(topic => !this.subscribedTopics.has(topic));
      
      for (const topic of newTopics) {
        await this.consumer.subscribe({ 
          topic, 
          fromBeginning: options?.fromBeginning ?? true 
        });
        this.subscribedTopics.add(topic);
      }

      // Start the consumer if it's not already running
      if (!this.consumerRunning) {
        await this.consumer.run({
          eachMessage: async ({ topic, message }) => {
            try {
              if (this.messageHandler) {
                await this.messageHandler(topic, message.value!);
              }
            } catch (error) {
              console.error(`Error handling message from topic ${topic}:`, error);
              this.emit('error', error);
            }
          },
          eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
            try {
              for (const message of batch.messages) {
                if (!isRunning() || isStale()) break;
                
                if (this.messageHandler) {
                  await this.messageHandler(batch.topic, message.value!);
                }
                resolveOffset(message.offset);
              }
              await heartbeat();
            } catch (error) {
              console.error(`Error handling batch from topic ${batch.topic}:`, error);
              this.emit('error', error);
            }
          },
        });
        this.consumerRunning = true;
      }
    } catch (error) {
      // Check if it's a connection-related error
      if (error instanceof Error && (
        error.message.includes('ECONNRESET') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('Connection closed')
      )) {
        this.connected = false;
        this.producerConnected = false;
        this.consumerConnected = false;
        this.consumerRunning = false;
        this.emit('disconnect');
      }
      this.emit('error', error);
      throw new Error(`Failed to subscribe to topics ${topics.join(', ')}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        await this.consumer.disconnect();
        await this.producer.disconnect();
        this.connected = false;
        this.producerConnected = false;
        this.consumerConnected = false;
        this.consumerRunning = false;
        this.subscribedTopics.clear();
        this.messageHandler = undefined;
        this.emit('disconnect');
      }
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}