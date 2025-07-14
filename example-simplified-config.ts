import { 
  createBrokerManagerFromEnv, 
  createSubscriptionManagerFromEnv,
  BrokerEnvConfig 
} from './dist';

// Example 1: Replace your complex getConfig() method with a single line
async function simplifiedBrokerConnection() {
  console.log('=== Simplified Broker Connection Example ===');
  
  // Your environment variables (from process.env or config service)
  const env: BrokerEnvConfig = {
    BROKER_TYPE: 'MQTT',
    BROKER_CLIENT_ID: 'lms-backend-service',
    MQTT_URL: 'mqtt://broker.hivemq.com',
  };

  // Replace your entire getConfig() method with this single line:
  const brokerManager = createBrokerManagerFromEnv(env, 'lms-backend-service');
  
  // Or for SubscriptionManager:
  const subscriptionManager = createSubscriptionManagerFromEnv(env, 'lms-backend-service');

  try {
    console.log('🔌 Connecting to broker...');
    await brokerManager.connect();
    console.log('✅ Connected successfully!');
    
    // Use the broker manager
    await brokerManager.publish('test/topic', 'Hello from simplified config!');
    
    await brokerManager.disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

// Example 2: Using with process.env directly
async function withProcessEnv() {
  console.log('=== Using process.env directly ===');
  
  // Set environment variables (in your app, these would come from your config service)
  process.env.BROKER_TYPE = 'KAFKA';
  process.env.BROKER_CLIENT_ID = 'lms-backend-service';
  process.env.KAFKA_BROKERS = 'localhost:9092';
  process.env.KAFKA_GROUP_ID = 'lms-backend-service-group';

  // Single line to create broker manager from environment
  const brokerManager = createBrokerManagerFromEnv(process.env as BrokerEnvConfig, 'lms-backend-service');

  try {
    console.log('🔌 Connecting to Kafka...');
    await brokerManager.connect();
    console.log('✅ Connected to Kafka successfully!');
    
    await brokerManager.publish('test/kafka', 'Hello from Kafka!');
    
    await brokerManager.disconnect();
  } catch (error) {
    console.error('❌ Kafka connection failed:', error);
  }
}

// Example 3: Class-based approach with simplified configuration
class SimplifiedBrokerService {
  private subscriptionManager: any;

  constructor(env: BrokerEnvConfig, serviceName: string = 'lms-backend-service') {
    // Replace your entire getConfig() method with this single line:
    this.subscriptionManager = createSubscriptionManagerFromEnv(env, serviceName);
    
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.subscriptionManager.on('connect', () => {
      console.log('✅ Broker service connected');
    });

    this.subscriptionManager.on('disconnect', () => {
      console.log('❌ Broker service disconnected');
    });

    this.subscriptionManager.on('error', (error: any) => {
      console.log('⚠️ Broker service error:', error?.message);
    });
  }

  async start() {
    try {
      console.log('🚀 Starting broker service...');
      await this.subscriptionManager.connect();
      
      // Subscribe to topics
      await this.subscriptionManager.subscribe(
        { topic: 'user/events', qos: 1 },
        (message: any) => {
          console.log('👤 User event received:', message);
        }
      );

      await this.subscriptionManager.subscribe(
        { topic: 'system/alerts', qos: 1 },
        (message: any) => {
          console.log('🚨 System alert received:', message);
        }
      );

      console.log('✅ Broker service started successfully');
    } catch (error) {
      console.error('❌ Failed to start broker service:', error);
      throw error;
    }
  }

  async publishMessage(topic: string, message: any) {
    await this.subscriptionManager.publish(topic, message);
  }

  async stop() {
    await this.subscriptionManager.disconnect();
    console.log('✅ Broker service stopped');
  }
}

// Example 4: Your original code replaced with simplified version
async function originalCodeReplacement() {
  console.log('=== Original Code Replacement ===');
  
  // Your original complex getConfig() method:
  /*
  private getConfig(): BrokerConfig {
    const brokerType = this.configService.get<string>('BROKER_TYPE', 'KAFKA') as 'MQTT' | 'KAFKA' | 'GCP_PUBSUB';

    if (brokerType === 'MQTT') {
      return {
        brokerType: 'MQTT' as const,
        mqtt: {
          url: this.configService.get<string>('MQTT_URL', 'mqtt://localhost:1883'),
          clientId: this.configService.get<string>('BROKER_CLIENT_ID') || 'lms-backend-service',
          clean: true,
          reconnectPeriod: 1000,
          connectTimeout: 30000,
        },
      };
    }

    if (brokerType === 'KAFKA') {
      return {
        brokerType: 'KAFKA' as const,
        kafka: {
          clientId: this.configService.get<string>('BROKER_CLIENT_ID') || 'lms-backend-service',
          brokers: [this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092')],
          groupId: this.configService.get<string>('KAFKA_GROUP_ID', 'lms-backend-service-group'),
        },
      };
    }

    // Default to Kafka
    return {
      brokerType: 'KAFKA' as const,
      kafka: {
        clientId: this.configService.get<string>('BROKER_CLIENT_ID') || 'lms-backend-service',
        brokers: [this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092')],
        groupId: this.configService.get<string>('KAFKA_GROUP_ID', 'lms-backend-service-group'),
      },
    };
  }
  */

  // REPLACED WITH THIS SINGLE LINE:
  const env: BrokerEnvConfig = {
    BROKER_TYPE: 'KAFKA',
    BROKER_CLIENT_ID: 'lms-backend-service',
    KAFKA_BROKERS: 'localhost:9092',
    KAFKA_GROUP_ID: 'lms-backend-service-group',
  };
  
  const brokerManager = createBrokerManagerFromEnv(env, 'lms-backend-service');

  // Your original connect() method:
  /*
  async connect(): Promise<void> {
    try {
      this.logger.log('Starting connection to broker...');
      const config = this.getConfig();
      this.logger.log('Broker config:', JSON.stringify(config, null, 2));

      this.brokerManager = new BrokerManager(config);
      this.logger.log('BrokerManager instance created');

      this.connectionRetryCount = 0;

      this.brokerManager.connect();
      const brokerInfo = this.configService.get<string>('BROKER_HOST');
      this.logger.log(`Connected to broker at ${brokerInfo}`);
    } catch (error) {
      this.logger.error('Failed to connect to broker', error);
      throw error;
    }
  }
  */

  // REPLACED WITH THIS:
  try {
    console.log('Starting connection to broker...');
    await brokerManager.connect();
    console.log('Connected to broker successfully');
    
    // Test the connection
    await brokerManager.publish('test/topic', 'Hello from simplified config!');
    console.log('Message published successfully');
    
    await brokerManager.disconnect();
  } catch (error) {
    console.error('Failed to connect to broker', error);
    throw error;
  }
}

// Example 5: Different broker types with the same simplified approach
async function multipleBrokerTypes() {
  console.log('=== Multiple Broker Types Example ===');
  
  const brokerConfigs = [
    {
      name: 'MQTT',
      env: {
        BROKER_TYPE: 'MQTT',
        BROKER_CLIENT_ID: 'mqtt-app',
        MQTT_URL: 'mqtt://broker.hivemq.com',
      }
    },
    {
      name: 'Kafka',
      env: {
        BROKER_TYPE: 'KAFKA',
        BROKER_CLIENT_ID: 'kafka-app',
        KAFKA_BROKERS: 'localhost:9092',
        KAFKA_GROUP_ID: 'kafka-app-group',
      }
    },
    {
      name: 'GCP Pub/Sub',
      env: {
        BROKER_TYPE: 'GCP_PUBSUB',
        BROKER_CLIENT_ID: 'gcp-app',
        GCP_PROJECT_ID: 'your-project-id',
        GCP_KEY_FILENAME: '/path/to/key.json',
      }
    }
  ];

  for (const config of brokerConfigs) {
    console.log(`\n--- Testing ${config.name} ---`);
    
    try {
      const subscriptionManager = createSubscriptionManagerFromEnv(config.env, config.env.BROKER_CLIENT_ID);
      
      await subscriptionManager.connect();
      console.log(`✅ Connected to ${config.name}`);
      
      await subscriptionManager.publish('test/topic', {
        message: `Hello from ${config.name}!`,
        timestamp: new Date().toISOString()
      });
      
      await subscriptionManager.disconnect();
    } catch (error) {
      console.log(`❌ ${config.name} test failed:`, error?.message);
    }
  }
}

// Run all examples
async function runExamples() {
  console.log('🚀 Starting Simplified Configuration Examples...\n');
  
  try {
    await simplifiedBrokerConnection();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await withProcessEnv();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test class-based approach
    const env: BrokerEnvConfig = {
      BROKER_TYPE: 'MQTT',
      BROKER_CLIENT_ID: 'lms-backend-service',
      MQTT_URL: 'mqtt://broker.hivemq.com',
    };
    
    const brokerService = new SimplifiedBrokerService(env);
    await brokerService.start();
    
    await brokerService.publishMessage('user/events', {
      userId: 'user-123',
      event: 'login',
      timestamp: new Date().toISOString()
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await brokerService.stop();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    await originalCodeReplacement();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await multipleBrokerTypes();
    
  } catch (error) {
    console.error('❌ Examples failed:', error);
  }
}

runExamples().catch(console.error); 