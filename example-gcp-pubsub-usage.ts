import { 
  SubscriptionManager, 
  createSubscriptionManagerFromEnv,
  TopicHandlerMapping 
} from './src/index';

// Example 1: Using environment variables (recommended for production)
async function exampleWithEnvVars() {
  console.log('🔧 Example 1: GCP Pub/Sub with environment variables');

  // Set up environment variables
  const env = {
    BROKER_TYPE: 'GCP_PUBSUB',
    GCP_PROJECT_ID: 'your-project-id',
    GCP_KEY_FILENAME: '/path/to/service-account-key.json', // Optional
    BROKER_CLIENT_ID: 'my-gcp-app'
  };

  const subscriptionManager = createSubscriptionManagerFromEnv(env);

  try {
    await subscriptionManager.connect();
    console.log('✅ Connected to GCP Pub/Sub');

    // Subscribe to a single topic
    await subscriptionManager.subscribe(
      { topic: 'projects/your-project-id/topics/my-topic' },
      (message) => {
        console.log('📨 Received message:', message);
      }
    );

    // Publish a message
    await subscriptionManager.publish(
      'projects/your-project-id/topics/my-topic',
      { data: 'Hello from GCP Pub/Sub!' }
    );

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await subscriptionManager.disconnect();
  }
}

// Example 2: Direct configuration
async function exampleWithDirectConfig() {
  console.log('\n🔧 Example 2: GCP Pub/Sub with direct configuration');

  const subscriptionManager = new SubscriptionManager({
    brokerType: 'GCP_PUBSUB',
    gcp: {
      projectId: 'your-project-id',
      keyFilename: '/path/to/service-account-key.json', // Optional
    }
  });

  try {
    await subscriptionManager.connect();
    console.log('✅ Connected to GCP Pub/Sub');

    // Subscribe to multiple topics with different handlers
    const topicHandlers: TopicHandlerMapping[] = [
      {
        topic: 'projects/your-project-id/topics/orders',
        handler: (message) => {
          console.log('🛒 Order received:', message);
          // Process order
        }
      },
      {
        topic: 'projects/your-project-id/topics/notifications',
        handler: (message) => {
          console.log('🔔 Notification received:', message);
          // Send notification
        }
      },
      {
        topic: 'projects/your-project-id/topics/logs',
        handler: (message) => {
          console.log('📝 Log entry:', message);
          // Store log
        }
      }
    ];

    await subscriptionManager.subscribeMultiple(topicHandlers);
    console.log('✅ Subscribed to multiple topics');

    // Publish messages to different topics
    await subscriptionManager.publish(
      'projects/your-project-id/topics/orders',
      { orderId: '12345', amount: 99.99, customer: 'john@example.com' }
    );

    await subscriptionManager.publish(
      'projects/your-project-id/topics/notifications',
      { type: 'email', to: 'user@example.com', subject: 'Order confirmed' }
    );

    await subscriptionManager.publish(
      'projects/your-project-id/topics/logs',
      { level: 'info', message: 'User logged in', timestamp: new Date().toISOString() }
    );

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await subscriptionManager.disconnect();
  }
}

// Example 3: Production-ready application
class GCPPubSubApp {
  private subscriptionManager: SubscriptionManager;
  private isRunning = false;

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

    this.subscriptionManager.on('disconnect', () => {
      console.log('❌ Disconnected from GCP Pub/Sub');
    });

    this.subscriptionManager.on('error', (error) => {
      console.error('❌ GCP Pub/Sub error:', error);
    });
  }

  async start() {
    if (this.isRunning) return;

    try {
      await this.subscriptionManager.connect();
      
      // Set up subscriptions
      await this.setupSubscriptions();
      
      this.isRunning = true;
      console.log('🚀 GCP Pub/Sub app started');
      
    } catch (error) {
      console.error('❌ Failed to start app:', error);
      throw error;
    }
  }

  private async setupSubscriptions() {
    // Subscribe to different types of events
    const subscriptions: TopicHandlerMapping[] = [
      {
        topic: 'projects/your-project-id/topics/user-events',
        handler: this.handleUserEvent.bind(this)
      },
      {
        topic: 'projects/your-project-id/topics/payment-events',
        handler: this.handlePaymentEvent.bind(this)
      },
      {
        topic: 'projects/your-project-id/topics/system-events',
        handler: this.handleSystemEvent.bind(this)
      }
    ];

    await this.subscriptionManager.subscribeMultiple(subscriptions);
    console.log('✅ All subscriptions set up');
  }

  private handleUserEvent(message: any) {
    console.log('👤 User event:', message);
    
    switch (message.type) {
      case 'user_registered':
        this.processUserRegistration(message);
        break;
      case 'user_login':
        this.processUserLogin(message);
        break;
      case 'user_logout':
        this.processUserLogout(message);
        break;
      default:
        console.log('Unknown user event type:', message.type);
    }
  }

  private handlePaymentEvent(message: any) {
    console.log('💳 Payment event:', message);
    
    switch (message.type) {
      case 'payment_successful':
        this.processPaymentSuccess(message);
        break;
      case 'payment_failed':
        this.processPaymentFailure(message);
        break;
      case 'refund_processed':
        this.processRefund(message);
        break;
      default:
        console.log('Unknown payment event type:', message.type);
    }
  }

  private handleSystemEvent(message: any) {
    console.log('⚙️ System event:', message);
    
    switch (message.type) {
      case 'backup_completed':
        this.processBackupComplete(message);
        break;
      case 'maintenance_scheduled':
        this.processMaintenanceScheduled(message);
        break;
      case 'error_occurred':
        this.processSystemError(message);
        break;
      default:
        console.log('Unknown system event type:', message.type);
    }
  }

  // Event processing methods
  private processUserRegistration(message: any) {
    console.log('📝 Processing user registration:', message.userId);
    // Send welcome email, create user profile, etc.
  }

  private processUserLogin(message: any) {
    console.log('🔐 Processing user login:', message.userId);
    // Update last login time, log activity, etc.
  }

  private processUserLogout(message: any) {
    console.log('🚪 Processing user logout:', message.userId);
    // Clean up session, log activity, etc.
  }

  private processPaymentSuccess(message: any) {
    console.log('✅ Processing successful payment:', message.paymentId);
    // Send confirmation email, update inventory, etc.
  }

  private processPaymentFailure(message: any) {
    console.log('❌ Processing failed payment:', message.paymentId);
    // Send failure notification, retry logic, etc.
  }

  private processRefund(message: any) {
    console.log('💰 Processing refund:', message.refundId);
    // Update accounting, notify customer, etc.
  }

  private processBackupComplete(message: any) {
    console.log('💾 Backup completed:', message.backupId);
    // Update backup status, notify admins, etc.
  }

  private processMaintenanceScheduled(message: any) {
    console.log('🔧 Maintenance scheduled:', message.maintenanceId);
    // Notify users, update status page, etc.
  }

  private processSystemError(message: any) {
    console.log('🚨 System error:', message.error);
    // Alert monitoring, create incident ticket, etc.
  }

  async publishUserEvent(type: string, userId: string, data: any = {}) {
    const message = {
      type,
      userId,
      timestamp: new Date().toISOString(),
      ...data
    };

    await this.subscriptionManager.publish(
      'projects/your-project-id/topics/user-events',
      message
    );
  }

  async publishPaymentEvent(type: string, paymentId: string, data: any = {}) {
    const message = {
      type,
      paymentId,
      timestamp: new Date().toISOString(),
      ...data
    };

    await this.subscriptionManager.publish(
      'projects/your-project-id/topics/payment-events',
      message
    );
  }

  async publishSystemEvent(type: string, data: any = {}) {
    const message = {
      type,
      timestamp: new Date().toISOString(),
      ...data
    };

    await this.subscriptionManager.publish(
      'projects/your-project-id/topics/system-events',
      message
    );
  }

  async stop() {
    if (!this.isRunning) return;

    try {
      await this.subscriptionManager.disconnect();
      this.isRunning = false;
      console.log('🛑 GCP Pub/Sub app stopped');
    } catch (error) {
      console.error('❌ Error stopping app:', error);
    }
  }

  isConnected(): boolean {
    return this.subscriptionManager.isConnected();
  }

  getConnectionState(): string {
    return this.subscriptionManager.getConnectionState();
  }
}

// Example 4: Usage of the production app
async function exampleProductionApp() {
  console.log('\n🔧 Example 4: Production GCP Pub/Sub app');

  const app = new GCPPubSubApp('your-project-id', '/path/to/service-account-key.json');

  try {
    await app.start();

    // Simulate some events
    await app.publishUserEvent('user_registered', 'user123', {
      email: 'john@example.com',
      name: 'John Doe'
    });

    await app.publishPaymentEvent('payment_successful', 'pay789', {
      amount: 99.99,
      currency: 'USD',
      method: 'credit_card'
    });

    await app.publishSystemEvent('backup_completed', {
      backupId: 'backup456',
      size: '2.5GB',
      duration: '15 minutes'
    });

    // Keep the app running for a while to receive messages
    console.log('⏳ App running for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ App error:', error);
  } finally {
    await app.stop();
  }
}

// Run examples
async function runExamples() {
  try {
    // Uncomment the example you want to run:
    
    // await exampleWithEnvVars();
    // await exampleWithDirectConfig();
    await exampleProductionApp();
    
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export { GCPPubSubApp }; 