import { Kafka, Consumer, Producer, KafkaConfig as KafkaJSConfig } from 'kafkajs';
import { IBroker, MessageHandler, PublishOptions, SubscribeOptions } from '../types';
import { KafkaConfig } from '../config';

export class KafkaBroker implements IBroker {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private connected = false;

  constructor(config: KafkaConfig) {
    
    const kafkaConfig: KafkaJSConfig = {
      clientId: config.clientId,
      brokers: config.brokers,
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

  async publish(topic: string, message: string | Buffer, options?: PublishOptions): Promise<void> {
    try {
      if (!this.connected) {
        await this.producer.connect();
        this.connected = true;
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
      throw new Error(`Failed to publish message to topic ${topic}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async subscribe(topics: string[], handler: MessageHandler, options?: SubscribeOptions): Promise<void> {
    try {
      if (!this.connected) {
        await this.consumer.connect();
        this.connected = true;
      }

      for (const topic of topics) {
        await this.consumer.subscribe({ 
          topic, 
          fromBeginning: options?.fromBeginning ?? true 
        });
      }

      await this.consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            await handler(topic, message.value!);
          } catch (error) {
            console.error(`Error handling message from topic ${topic}:`, error);
          }
        },
      });
    } catch (error) {
      throw new Error(`Failed to subscribe to topics ${topics.join(', ')}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        await this.consumer.disconnect();
        await this.producer.disconnect();
        this.connected = false;
      }
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}