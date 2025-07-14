import { 
  SubscriptionManager, 
  TopicHandlerMapping,
  createSubscriptionManagerFromEnv,
  BrokerEnvConfig 
} from './dist';

// Example 1: Multiple topics with different handlers
async function multipleTopicHandlers() {
  console.log('=== Multiple Topics with Different Handlers ===');
  
  const subscriptionManager = new SubscriptionManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'multi-handler-app-' + Date.now(),
    },
  });

  // Set up event listeners
  subscriptionManager.on('connect', () => {
    console.log('✅ Connected to broker');
  });

  subscriptionManager.on('disconnect', () => {
    console.log('❌ Disconnected from broker');
  });

  subscriptionManager.on('error', (error) => {
    console.log('⚠️ Broker error:', error?.message);
  });

  try {
    await subscriptionManager.connect();

    // Define topic-handler mappings
    const topicMappings: TopicHandlerMapping[] = [
      {
        topic: 'user/events',
        handler: (message) => {
          console.log('👤 User event handler:', message);
          // Process user events
        },
        options: { qos: 1 }
      },
      {
        topic: 'order/events',
        handler: (message) => {
          console.log('🛒 Order event handler:', message);
          // Process order events
        },
        options: { qos: 2 }
      },
      {
        topic: 'system/alerts',
        handler: (message) => {
          console.log('🚨 System alert handler:', message);
          // Process system alerts
        },
        options: { qos: 1 }
      },
      {
        topic: 'analytics/data',
        handler: (message) => {
          console.log('📊 Analytics handler:', message);
          // Process analytics data
        },
        options: { qos: 0 }
      }
    ];

    // Subscribe to all topics with their respective handlers
    await subscriptionManager.subscribeMultiple(topicMappings);
    console.log('✅ Subscribed to all topics with different handlers');

    // Publish messages to test different handlers
    await subscriptionManager.publish('user/events', {
      userId: 'user-123',
      event: 'login',
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('order/events', {
      orderId: 'order-456',
      status: 'created',
      amount: 99.99,
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('system/alerts', {
      level: 'warning',
      message: 'High CPU usage detected',
      system: 'server-001',
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('analytics/data', {
      event: 'page_view',
      page: '/home',
      userId: 'user-123',
      timestamp: new Date().toISOString()
    });

    // Keep running for a while to see the handlers in action
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Multiple topic handlers example failed:', error);
  } finally {
    await subscriptionManager.disconnect();
  }
}

// Example 2: Class-based approach with multiple handlers
class EventProcessor {
  private subscriptionManager: SubscriptionManager;

  constructor(brokerConfig: any) {
    this.subscriptionManager = new SubscriptionManager(brokerConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.subscriptionManager.on('connect', () => {
      console.log('✅ Event processor connected');
    });

    this.subscriptionManager.on('disconnect', () => {
      console.log('❌ Event processor disconnected');
    });

    this.subscriptionManager.on('error', (error) => {
      console.log('⚠️ Event processor error:', error?.message);
    });
  }

  async start() {
    try {
      await this.subscriptionManager.connect();

      // Define different handlers for different event types
      const eventMappings: TopicHandlerMapping[] = [
        {
          topic: 'email/events',
          handler: this.handleEmailEvent.bind(this),
          options: { qos: 1 }
        },
        {
          topic: 'sms/events',
          handler: this.handleSMSEvent.bind(this),
          options: { qos: 1 }
        },
        {
          topic: 'push/events',
          handler: this.handlePushEvent.bind(this),
          options: { qos: 1 }
        },
        {
          topic: 'notification/events',
          handler: this.handleNotificationEvent.bind(this),
          options: { qos: 2 }
        }
      ];

      await this.subscriptionManager.subscribeMultiple(eventMappings);
      console.log('✅ Event processor started with multiple handlers');

    } catch (error) {
      console.error('❌ Failed to start event processor:', error);
      throw error;
    }
  }

  private handleEmailEvent(message: any) {
    console.log('📧 Processing email event:', message);
    // Process email events
    if (message.type === 'welcome') {
      console.log('   → Sending welcome email to:', message.to);
    } else if (message.type === 'reset_password') {
      console.log('   → Sending password reset email to:', message.to);
    }
  }

  private handleSMSEvent(message: any) {
    console.log('📱 Processing SMS event:', message);
    // Process SMS events
    if (message.type === 'verification') {
      console.log('   → Sending verification SMS to:', message.to);
    } else if (message.type === 'alert') {
      console.log('   → Sending alert SMS to:', message.to);
    }
  }

  private handlePushEvent(message: any) {
    console.log('🔔 Processing push event:', message);
    // Process push notification events
    if (message.type === 'new_message') {
      console.log('   → Sending push notification to user:', message.userId);
    } else if (message.type === 'reminder') {
      console.log('   → Sending reminder push to user:', message.userId);
    }
  }

  private handleNotificationEvent(message: any) {
    console.log('📢 Processing notification event:', message);
    // Process general notification events
    console.log('   → Processing notification:', message.message);
  }

  async publishEvent(topic: string, event: any) {
    await this.subscriptionManager.publish(topic, event);
  }

  async stop() {
    await this.subscriptionManager.disconnect();
    console.log('✅ Event processor stopped');
  }

  // Utility methods to manage handlers
  getSubscribedTopics(): string[] {
    return this.subscriptionManager.getSubscribedTopics();
  }

  getHandler(topic: string) {
    return this.subscriptionManager.getHandler(topic);
  }

  removeHandler(topic: string): boolean {
    return this.subscriptionManager.removeHandler(topic);
  }
}

// Example 3: Using with environment configuration
async function withEnvironmentConfig() {
  console.log('=== Multiple Topics with Environment Config ===');
  
  const env: BrokerEnvConfig = {
    BROKER_TYPE: 'MQTT',
    BROKER_CLIENT_ID: 'env-multi-handler-app',
    MQTT_URL: 'mqtt://broker.hivemq.com',
  };

  const subscriptionManager = createSubscriptionManagerFromEnv(env, 'env-multi-handler-app');

  try {
    await subscriptionManager.connect();

    // Define handlers for different sensor types
    const sensorMappings: TopicHandlerMapping[] = [
      {
        topic: 'sensor/temperature',
        handler: (message) => {
          console.log('🌡️ Temperature sensor:', message);
          if (message.value > 30) {
            console.log('   ⚠️ High temperature detected!');
          }
        }
      },
      {
        topic: 'sensor/humidity',
        handler: (message) => {
          console.log('💧 Humidity sensor:', message);
          if (message.value > 80) {
            console.log('   ⚠️ High humidity detected!');
          }
        }
      },
      {
        topic: 'sensor/pressure',
        handler: (message) => {
          console.log('🌪️ Pressure sensor:', message);
          if (message.value < 1000) {
            console.log('   ⚠️ Low pressure detected!');
          }
        }
      },
      {
        topic: 'sensor/motion',
        handler: (message) => {
          console.log('👁️ Motion sensor:', message);
          if (message.detected) {
            console.log('   🚨 Motion detected!');
          }
        }
      }
    ];

    await subscriptionManager.subscribeMultiple(sensorMappings);

    // Publish sensor data
    await subscriptionManager.publish('sensor/temperature', {
      sensorId: 'temp-001',
      value: 25.5,
      unit: 'celsius',
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('sensor/humidity', {
      sensorId: 'hum-001',
      value: 65.2,
      unit: 'percent',
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('sensor/pressure', {
      sensorId: 'press-001',
      value: 1013.25,
      unit: 'hPa',
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('sensor/motion', {
      sensorId: 'motion-001',
      detected: true,
      location: 'room-1',
      timestamp: new Date().toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Environment config example failed:', error);
  } finally {
    await subscriptionManager.disconnect();
  }
}

// Example 4: Alternative method for same handler on multiple topics
async function sameHandlerMultipleTopics() {
  console.log('=== Same Handler for Multiple Topics ===');
  
  const subscriptionManager = new SubscriptionManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'same-handler-app-' + Date.now(),
    },
  });

  try {
    await subscriptionManager.connect();

    // Use the same handler for multiple related topics
    const topics = [
      'logs/error',
      'logs/warning',
      'logs/info',
      'logs/debug'
    ];

    const logHandler = (message: any) => {
      console.log('📝 Log message:', message);
      // Process all log messages the same way
    };

    await subscriptionManager.subscribeToTopics(topics, logHandler, { qos: 1 });
    console.log('✅ Subscribed to all log topics with same handler');

    // Publish different log levels
    await subscriptionManager.publish('logs/error', {
      level: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('logs/warning', {
      level: 'warning',
      message: 'High memory usage',
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('logs/info', {
      level: 'info',
      message: 'User logged in',
      timestamp: new Date().toISOString()
    });

    await subscriptionManager.publish('logs/debug', {
      level: 'debug',
      message: 'Processing request',
      timestamp: new Date().toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Same handler example failed:', error);
  } finally {
    await subscriptionManager.disconnect();
  }
}

// Run all examples
async function runExamples() {
  console.log('🚀 Starting Multiple Topic Handlers Examples...\n');
  
  try {
    await multipleTopicHandlers();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test class-based approach
    const eventProcessor = new EventProcessor({
      brokerType: 'MQTT',
      mqtt: {
        url: 'mqtt://broker.hivemq.com',
        clientId: 'event-processor-' + Date.now(),
      },
    });
    
    await eventProcessor.start();
    
    // Publish different event types
    await eventProcessor.publishEvent('email/events', {
      type: 'welcome',
      to: 'user@example.com',
      subject: 'Welcome!',
      timestamp: new Date().toISOString()
    });
    
    await eventProcessor.publishEvent('sms/events', {
      type: 'verification',
      to: '+1234567890',
      code: '123456',
      timestamp: new Date().toISOString()
    });
    
    await eventProcessor.publishEvent('push/events', {
      type: 'new_message',
      userId: 'user-123',
      title: 'New Message',
      body: 'You have a new message',
      timestamp: new Date().toISOString()
    });
    
    await eventProcessor.publishEvent('notification/events', {
      type: 'system',
      message: 'System maintenance scheduled',
      timestamp: new Date().toISOString()
    });
    
    console.log('📋 Subscribed topics:', eventProcessor.getSubscribedTopics());
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    await eventProcessor.stop();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    await withEnvironmentConfig();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await sameHandlerMultipleTopics();
    
  } catch (error) {
    console.error('❌ Examples failed:', error);
  }
}

runExamples().catch(console.error); 