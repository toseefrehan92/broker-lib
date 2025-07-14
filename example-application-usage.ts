import { SubscriptionManager } from './dist';

// Example 1: Basic MQTT Application Usage
async function basicMQTTExample() {
  console.log('=== Basic MQTT Application Example ===');
  
  const subscriptionManager = new SubscriptionManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'my-app-' + Date.now(),
    },
  });

  // Set up event listeners for monitoring
  subscriptionManager.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
  });

  subscriptionManager.on('disconnect', () => {
    console.log('❌ Disconnected from MQTT broker');
  });

  subscriptionManager.on('error', (error) => {
    console.log('⚠️ MQTT error:', error?.message);
  });

  try {
    // Connect to the broker
    await subscriptionManager.connect();

    // Subscribe to a topic with options
    await subscriptionManager.subscribe(
      { 
        topic: 'sensor/temperature',
        qos: 1 
      },
      (message) => {
        console.log('🌡️ Temperature reading:', message);
      }
    );

    // Subscribe to another topic
    await subscriptionManager.subscribe(
      { 
        topic: 'sensor/humidity',
        qos: 1 
      },
      (message) => {
        console.log('💧 Humidity reading:', message);
      }
    );

    // Publish some messages
    await subscriptionManager.publish('sensor/temperature', {
      sensorId: 'temp-001',
      value: 23.5,
      unit: 'celsius',
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('sensor/humidity', {
      sensorId: 'hum-001',
      value: 65.2,
      unit: 'percent',
      timestamp: new Date().toISOString()
    });

    // Keep running for a while to receive messages
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ MQTT example failed:', error);
  } finally {
    await subscriptionManager.disconnect();
  }
}

// Example 2: Kafka Application Usage
async function kafkaExample() {
  console.log('=== Kafka Application Example ===');
  
  const subscriptionManager = new SubscriptionManager({
    brokerType: 'KAFKA',
    kafka: {
      clientId: 'my-kafka-app',
      brokers: ['localhost:9092'],
      groupId: 'my-consumer-group',
    },
  });

  // Set up event listeners
  subscriptionManager.on('connect', () => {
    console.log('✅ Connected to Kafka');
  });

  subscriptionManager.on('disconnect', () => {
    console.log('❌ Disconnected from Kafka');
  });

  subscriptionManager.on('error', (error) => {
    console.log('⚠️ Kafka error:', error?.message);
  });

  try {
    await subscriptionManager.connect();

    // Subscribe to user events
    await subscriptionManager.subscribe(
      { 
        topic: 'user-events',
        fromBeginning: true 
      },
      (message) => {
        console.log('👤 User event:', message);
      }
    );

    // Subscribe to order events
    await subscriptionManager.subscribe(
      { 
        topic: 'order-events',
        fromBeginning: true 
      },
      (message) => {
        console.log('🛒 Order event:', message);
      }
    );

    // Publish user events
    await subscriptionManager.publish('user-events', {
      userId: 'user-123',
      event: 'login',
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('user-events', {
      userId: 'user-123',
      event: 'purchase',
      productId: 'prod-456',
      timestamp: new Date().toISOString()
    });

    // Publish order events
    await subscriptionManager.publish('order-events', {
      orderId: 'order-789',
      status: 'created',
      amount: 99.99,
      timestamp: new Date().toISOString()
    });

    // Keep running for a while
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Kafka example failed:', error);
  } finally {
    await subscriptionManager.disconnect();
  }
}

// Example 3: GCP Pub/Sub Application Usage
async function gcpPubSubExample() {
  console.log('=== GCP Pub/Sub Application Example ===');
  
  const subscriptionManager = new SubscriptionManager({
    brokerType: 'GCP_PUBSUB',
    gcp: {
      projectId: 'your-project-id',
      keyFilename: '/path/to/service-account-key.json',
    },
  });

  // Set up event listeners
  subscriptionManager.on('connect', () => {
    console.log('✅ Connected to GCP Pub/Sub');
  });

  subscriptionManager.on('disconnect', () => {
    console.log('❌ Disconnected from GCP Pub/Sub');
  });

  subscriptionManager.on('error', (error) => {
    console.log('⚠️ GCP Pub/Sub error:', error?.message);
  });

  try {
    await subscriptionManager.connect();

    // Subscribe to notifications
    await subscriptionManager.subscribe(
      { 
        topic: 'notifications',
        autoAck: true 
      },
      (message) => {
        console.log('🔔 Notification:', message);
      }
    );

    // Subscribe to analytics events
    await subscriptionManager.subscribe(
      { 
        topic: 'analytics',
        autoAck: true 
      },
      (message) => {
        console.log('📊 Analytics event:', message);
      }
    );

    // Publish notifications
    await subscriptionManager.publish('notifications', {
      userId: 'user-123',
      type: 'email',
      subject: 'Welcome!',
      body: 'Welcome to our platform',
      timestamp: new Date().toISOString()
    });

    // Publish analytics
    await subscriptionManager.publish('analytics', {
      event: 'page_view',
      page: '/home',
      userId: 'user-123',
      sessionId: 'session-456',
      timestamp: new Date().toISOString()
    });

    // Keep running for a while
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ GCP Pub/Sub example failed:', error);
  } finally {
    await subscriptionManager.disconnect();
  }
}

// Example 4: Real-world Application with Error Handling
async function realWorldExample() {
  console.log('=== Real-world Application Example ===');
  
  const subscriptionManager = new SubscriptionManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'production-app-' + Date.now(),
    },
  });

  // Configure reconnection for production
  subscriptionManager.setReconnectionConfig({
    enabled: true,
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  });

  // Comprehensive event handling
  subscriptionManager.on('connect', () => {
    console.log('✅ Connected to broker');
  });

  subscriptionManager.on('disconnect', () => {
    console.log('❌ Disconnected from broker');
  });

  subscriptionManager.on('error', (error) => {
    console.log('⚠️ Broker error:', error?.message);
  });

  subscriptionManager.on('connecting', () => {
    console.log('🔄 Connecting to broker...');
  });

  subscriptionManager.on('reconnect', () => {
    console.log('🔄 Reconnected successfully');
  });

  subscriptionManager.on('reconnect_failed', (error) => {
    console.log('💥 Reconnection failed:', error?.message);
  });

  try {
    await subscriptionManager.connect();

    // Subscribe to multiple topics with different handlers
    const subscriptions = [
      {
        topic: 'device/+/status',
        handler: (message: any) => {
          console.log('📱 Device status:', message);
        }
      },
      {
        topic: 'device/+/data',
        handler: (message: any) => {
          console.log('📊 Device data:', message);
        }
      },
      {
        topic: 'system/alerts',
        handler: (message: any) => {
          console.log('🚨 System alert:', message);
        }
      }
    ];

    // Subscribe to all topics
    for (const subscription of subscriptions) {
      await subscriptionManager.subscribe(
        { topic: subscription.topic, qos: 1 },
        subscription.handler
      );
    }

    // Publish some test messages
    await subscriptionManager.publish('device/phone-001/status', {
      deviceId: 'phone-001',
      status: 'online',
      battery: 85,
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('device/phone-001/data', {
      deviceId: 'phone-001',
      data: {
        temperature: 25.5,
        humidity: 60.2,
        pressure: 1013.25
      },
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('system/alerts', {
      level: 'warning',
      message: 'High CPU usage detected',
      system: 'server-001',
      timestamp: new Date().toISOString()
    });

    // Keep the application running
    console.log('🔄 Application running... Press Ctrl+C to stop');
    await new Promise(() => {}); // Keep running indefinitely

  } catch (error) {
    console.error('❌ Application failed:', error);
  } finally {
    await subscriptionManager.disconnect();
  }
}

// Example 5: Class-based Application Usage
class MessageProcessor {
  private subscriptionManager: SubscriptionManager;

  constructor(brokerConfig: any) {
    this.subscriptionManager = new SubscriptionManager(brokerConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.subscriptionManager.on('connect', () => {
      console.log('✅ Message processor connected');
    });

    this.subscriptionManager.on('disconnect', () => {
      console.log('❌ Message processor disconnected');
    });

    this.subscriptionManager.on('error', (error) => {
      console.log('⚠️ Message processor error:', error?.message);
    });
  }

  async start() {
    try {
      await this.subscriptionManager.connect();

      // Subscribe to different message types
      await this.subscriptionManager.subscribe(
        { topic: 'messages/email', qos: 1 },
        this.handleEmailMessage.bind(this)
      );

      await this.subscriptionManager.subscribe(
        { topic: 'messages/sms', qos: 1 },
        this.handleSMSMessage.bind(this)
      );

      await this.subscriptionManager.subscribe(
        { topic: 'messages/push', qos: 1 },
        this.handlePushMessage.bind(this)
      );

      console.log('✅ Message processor started');
    } catch (error) {
      console.error('❌ Failed to start message processor:', error);
      throw error;
    }
  }

  private handleEmailMessage(message: any) {
    console.log('📧 Processing email:', message);
    // Process email message
  }

  private handleSMSMessage(message: any) {
    console.log('📱 Processing SMS:', message);
    // Process SMS message
  }

  private handlePushMessage(message: any) {
    console.log('🔔 Processing push notification:', message);
    // Process push notification
  }

  async publishMessage(topic: string, message: any) {
    await this.subscriptionManager.publish(topic, message);
  }

  async stop() {
    await this.subscriptionManager.disconnect();
    console.log('✅ Message processor stopped');
  }
}

// Usage of the class-based approach
async function classBasedExample() {
  console.log('=== Class-based Application Example ===');
  
  const messageProcessor = new MessageProcessor({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'message-processor-' + Date.now(),
    },
  });

  try {
    await messageProcessor.start();

    // Publish some test messages
    await messageProcessor.publishMessage('messages/email', {
      to: 'user@example.com',
      subject: 'Welcome!',
      body: 'Welcome to our platform',
      timestamp: new Date().toISOString()
    });

    await messageProcessor.publishMessage('messages/sms', {
      to: '+1234567890',
      message: 'Your verification code is 123456',
      timestamp: new Date().toISOString()
    });

    await messageProcessor.publishMessage('messages/push', {
      userId: 'user-123',
      title: 'New Message',
      body: 'You have a new message',
      timestamp: new Date().toISOString()
    });

    // Keep running for a while
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Class-based example failed:', error);
  } finally {
    await messageProcessor.stop();
  }
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 Starting Application Usage Examples...\n');
  
  try {
    await basicMQTTExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await kafkaExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await gcpPubSubExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await classBasedExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Uncomment to run the real-world example (runs indefinitely)
    // await realWorldExample();
    
  } catch (error) {
    console.error('❌ Examples failed:', error);
  }
}

// Run the examples
runAllExamples().catch(console.error); 