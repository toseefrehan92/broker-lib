import { 
  SubscriptionManager, 
  createSubscriptionManagerFromEnv,
  TopicHandlerMapping 
} from './src/index';

// Example 1: Basic Polling for GCP Pub/Sub
async function exampleBasicPolling() {
  console.log('🔧 Example 1: Basic GCP Pub/Sub Polling');

  const subscriptionManager = createSubscriptionManagerFromEnv({
    BROKER_TYPE: 'GCP_PUBSUB',
    GCP_PROJECT_ID: 'your-project-id',
    BROKER_CLIENT_ID: 'polling-example'
  });

  try {
    await subscriptionManager.connect();
    console.log('✅ Connected to GCP Pub/Sub');

    // Set up handlers for topics
    const topicHandlers: TopicHandlerMapping[] = [
      {
        topic: 'projects/your-project-id/topics/orders',
        handler: (message) => {
          console.log('🛒 Order received via polling:', message);
        }
      },
      {
        topic: 'projects/your-project-id/topics/notifications',
        handler: (message) => {
          console.log('🔔 Notification received via polling:', message);
        }
      }
    ];

    // Register handlers
    await subscriptionManager.subscribeMultiple(topicHandlers);

    // Start polling every 10 seconds
    const topics = topicHandlers.map(th => th.topic);
    await subscriptionManager.startPolling(topics, 10000);

    console.log('⏳ Polling started. Press Ctrl+C to stop...');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping polling...');
      await subscriptionManager.stopPolling();
      await subscriptionManager.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 2: Advanced Polling with Real GCP Pub/Sub API
class GCPPollingManager {
  private subscriptionManager: SubscriptionManager;
  private pollingInterval?: NodeJS.Timeout;
  private isPolling = false;

  constructor(projectId: string, keyFilename?: string) {
    this.subscriptionManager = new SubscriptionManager({
      brokerType: 'GCP_PUBSUB',
      gcp: {
        projectId,
        keyFilename,
      }
    });

    // Set up event listeners
    this.subscriptionManager.on('connect', () => {
      console.log('✅ Connected to GCP Pub/Sub');
    });

    this.subscriptionManager.on('error', (error) => {
      console.error('❌ GCP Pub/Sub error:', error);
    });
  }

  async start() {
    await this.subscriptionManager.connect();
    console.log('🚀 GCP Polling Manager started');
  }

  async setupPolling(topics: string[], intervalMs: number = 5000) {
    if (this.isPolling) {
      console.log('⚠️ Polling is already active');
      return;
    }

    console.log(`📡 Setting up polling for topics: ${topics.join(', ')}`);

    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      await this.pollMessages(topics);
    }, intervalMs);

    console.log(`✅ Polling started with interval: ${intervalMs}ms`);
  }

  private async pollMessages(topics: string[]) {
    for (const topic of topics) {
      try {
        // In a real implementation, you would:
        // 1. Call GCP Pub/Sub API to pull messages
        // 2. Process each message
        // 3. Acknowledge messages
        
        console.log(`🔍 Polling topic: ${topic}`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Simulate receiving messages
        const messages = await this.simulatePullMessages(topic);
        
                 for (const message of messages) {
           const handler = this.subscriptionManager.getHandler(topic);
           if (handler) {
             try {
               handler(message as any);
               console.log(`✅ Processed message from ${topic}:`, message.messageId);
             } catch (error) {
               console.error(`❌ Error processing message from ${topic}:`, error);
             }
           }
         }
        
      } catch (error) {
        console.error(`❌ Error polling topic ${topic}:`, error);
      }
    }
  }

  private async simulatePullMessages(topic: string): Promise<any[]> {
    // This simulates the GCP Pub/Sub API call
    // In real implementation, you would use:
    // const {PubSub} = require('@google-cloud/pubsub');
    // const pubsub = new PubSub();
    // const subscription = pubsub.subscription('your-subscription-name');
    // const [messages] = await subscription.pull({maxMessages: 10});
    
    const now = new Date();
    const messages = [];
    
    // Simulate some messages occasionally
    if (Math.random() > 0.7) { // 30% chance of having messages
      const messageCount = Math.floor(Math.random() * 3) + 1; // 1-3 messages
      
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          messageId: `msg_${Date.now()}_${i}`,
          topic,
          timestamp: now.toISOString(),
          data: {
            type: 'simulated_message',
            content: `Message ${i + 1} from ${topic}`,
            source: 'polling_simulation'
          },
          attributes: {
            source: 'polling',
            timestamp: now.getTime().toString()
          }
        });
      }
    }
    
    return messages;
  }

  async stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
      this.isPolling = false;
      console.log('🛑 Polling stopped');
    }
  }

  async stop() {
    await this.stopPolling();
    await this.subscriptionManager.disconnect();
    console.log('🛑 GCP Polling Manager stopped');
  }

  isPollingActive(): boolean {
    return this.isPolling;
  }

  getSubscriptionManager(): SubscriptionManager {
    return this.subscriptionManager;
  }
}

// Example 3: Production-ready polling application
async function exampleProductionPolling() {
  console.log('\n🔧 Example 3: Production GCP Polling Application');

  const pollingManager = new GCPPollingManager('your-project-id');

  try {
    await pollingManager.start();

    // Set up handlers for different event types
    const topicHandlers: TopicHandlerMapping[] = [
      {
        topic: 'projects/your-project-id/topics/user-events',
        handler: (message) => {
          console.log('👤 User event via polling:', message);
          // Process user events
        }
      },
      {
        topic: 'projects/your-project-id/topics/payment-events',
        handler: (message) => {
          console.log('💳 Payment event via polling:', message);
          // Process payment events
        }
      },
      {
        topic: 'projects/your-project-id/topics/system-events',
        handler: (message) => {
          console.log('⚙️ System event via polling:', message);
          // Process system events
        }
      }
    ];

    // Register handlers
    await pollingManager.getSubscriptionManager().subscribeMultiple(topicHandlers);

    // Start polling every 5 seconds
    const topics = topicHandlers.map(th => th.topic);
    await pollingManager.setupPolling(topics, 5000);

    console.log('⏳ Production polling started. Press Ctrl+C to stop...');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping production polling...');
      await pollingManager.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Production polling error:', error);
  }
}

// Example 4: Hybrid approach (real-time + polling fallback)
class HybridGCPManager {
  private subscriptionManager: SubscriptionManager;
  private pollingManager: GCPPollingManager;
  private usePolling = false;

  constructor(projectId: string, keyFilename?: string) {
    this.subscriptionManager = new SubscriptionManager({
      brokerType: 'GCP_PUBSUB',
      gcp: { projectId, keyFilename }
    });

    this.pollingManager = new GCPPollingManager(projectId, keyFilename);
  }

  async start() {
    try {
      // Try real-time subscription first
      await this.subscriptionManager.connect();
      console.log('✅ Using real-time GCP Pub/Sub subscription');
      this.usePolling = false;
    } catch (error) {
      console.log('⚠️ Real-time subscription failed, falling back to polling');
      console.log('Error:', error.message);
      
      // Fall back to polling
      await this.pollingManager.start();
      this.usePolling = true;
    }
  }

  async subscribeMultiple(mappings: TopicHandlerMapping[]): Promise<void> {
    if (this.usePolling) {
      await this.pollingManager.getSubscriptionManager().subscribeMultiple(mappings);
      const topics = mappings.map(m => m.topic);
      await this.pollingManager.setupPolling(topics, 5000);
    } else {
      await this.subscriptionManager.subscribeMultiple(mappings);
    }
  }

  async publish(topic: string, message: any): Promise<void> {
    if (this.usePolling) {
      await this.pollingManager.getSubscriptionManager().publish(topic, message);
    } else {
      await this.subscriptionManager.publish(topic, message);
    }
  }

  async stop() {
    if (this.usePolling) {
      await this.pollingManager.stop();
    } else {
      await this.subscriptionManager.disconnect();
    }
  }
}

// Run examples
async function runExamples() {
  try {
    // Uncomment the example you want to run:
    
    // await exampleBasicPolling();
    await exampleProductionPolling();
    
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export { GCPPollingManager, HybridGCPManager }; 