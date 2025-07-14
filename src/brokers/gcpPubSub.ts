import { PubSub, Subscription } from '@google-cloud/pubsub';
import { IBroker, MessageHandler, PublishOptions, SubscribeOptions } from '../types';
import { GCPPubSubConfig } from '../config';

export class GCPPubSubBroker implements IBroker {
  private pubsub: PubSub;
  private subscriptions: Map<string, Subscription> = new Map();
  private connected = false;

  constructor(config: GCPPubSubConfig) {
    
    const pubsubConfig: any = {
      projectId: config.projectId,
    };

    if (config.keyFilename) {
      pubsubConfig.keyFilename = config.keyFilename;
    }

    if (config.credentials) {
      pubsubConfig.credentials = config.credentials;
    }

    if (config.apiEndpoint) {
      pubsubConfig.apiEndpoint = config.apiEndpoint;
    }

    this.pubsub = new PubSub(pubsubConfig);
    this.connected = true;
  }

  async publish(topic: string, message: string | Buffer, options?: PublishOptions): Promise<void> {
    try {
      const topicRef = this.pubsub.topic(topic);
      
      // Check if topic exists, create if it doesn't
      const [exists] = await topicRef.exists();
      if (!exists) {
        await topicRef.create();
      }

      const messageBuffer = typeof message === 'string' ? Buffer.from(message) : message;
      
      const messageData: any = {
        data: messageBuffer,
      };

      if (options?.key) {
        messageData.key = options.key;
      }
      if (options?.headers) {
        messageData.attributes = options.headers;
      }

      await topicRef.publishMessage(messageData);
    } catch (error) {
      throw new Error(`Failed to publish message to topic ${topic}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async subscribe(topics: string[], handler: MessageHandler, options?: SubscribeOptions): Promise<void> {
    try {
      for (const topicName of topics) {
        const subscriptionName = `${topicName}-sub-${Date.now()}`;
        const topicRef = this.pubsub.topic(topicName);
        
        // Check if topic exists, create if it doesn't
        const [topicExists] = await topicRef.exists();
        if (!topicExists) {
          await topicRef.create();
        }

        // Check if subscription exists
        const [subscriptions] = await this.pubsub.subscription(subscriptionName).exists();
        let subscription: Subscription;

        if (subscriptions) {
          subscription = this.pubsub.subscription(subscriptionName);
        } else {
          [subscription] = await topicRef.createSubscription(subscriptionName);
        }

        this.subscriptions.set(topicName, subscription);

        subscription.on('message', async (message) => {
          try {
            await handler(topicName, message.data);
            
            if (options?.autoAck !== false) {
              message.ack();
            }
          } catch (error) {
            console.error(`Error handling message from topic ${topicName}:`, error);
            if (options?.autoAck !== false) {
              message.nack();
            }
          }
        });

        subscription.on('error', (error) => {
          console.error(`Subscription error for topic ${topicName}:`, error);
        });
      }
    } catch (error) {
      throw new Error(`Failed to subscribe to topics ${topics.join(', ')}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Close all subscriptions
      for (const [, subscription] of this.subscriptions) {
        subscription.removeAllListeners();
        await subscription.close();
      }
      this.subscriptions.clear();
      this.connected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}