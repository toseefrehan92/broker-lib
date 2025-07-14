import { BrokerManager } from './src/index';

async function kafkaExample() {
  console.log('🚀 Starting Kafka Example...\n');

  // Create Kafka broker with proper connection options
  const broker = new BrokerManager({
    brokerType: 'KAFKA',
    kafka: {
      clientId: 'my-kafka-app',
      brokers: ['localhost:9092'], // Update this to your Kafka broker
      groupId: 'my-consumer-group',
      connectionOptions: {
        autoReconnect: true,
        maxReconnectAttempts: 5,
        reconnectDelay: 2000,
        connectionTimeout: 10000,
      },
    },
  });

  // Set up connection event listeners
  broker.on('connect', () => {
    console.log('✅ Connected to Kafka');
  });

  broker.on('disconnect', () => {
    console.log('❌ Disconnected from Kafka');
  });

  broker.on('error', (error) => {
    console.log('⚠️ Kafka error:', error?.message);
  });

  broker.on('reconnect', () => {
    console.log('🔄 Reconnected to Kafka');
  });

  broker.on('reconnect_failed', (error) => {
    console.log('💥 Reconnection failed:', error?.message);
  });

  try {
    // Step 1: Connect to Kafka
    console.log('🔌 Connecting to Kafka...');
    await broker.connect();
    
    // Step 2: Check connection status
    console.log('📊 Connection state:', broker.getConnectionState());
    console.log('🔗 Is connected:', broker.isConnected());
    
    if (!broker.isConnected()) {
      throw new Error('Failed to connect to Kafka');
    }

    // Step 3: Subscribe to topics
    console.log('📡 Subscribing to topics...');
    await broker.subscribe(['my-topic', 'another-topic'], (topic, message) => {
      console.log(`📨 Received on ${topic}: ${message.toString()}`);
    });

    // Step 4: Publish messages
    console.log('📤 Publishing messages...');
    await broker.publish('my-topic', 'Hello from broker-lib!');
    await broker.publish('my-topic', 'This is a test message');
    await broker.publish('another-topic', 'Message to another topic');

    // Step 5: Wait for messages to be processed
    console.log('⏳ Waiting for messages...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 6: Disconnect
    console.log('🔌 Disconnecting...');
    await broker.disconnect();
    
    console.log('✅ Kafka example completed successfully!');
    
  } catch (error) {
    console.error('❌ Kafka example failed:', error);
    
    // Try to disconnect if there was an error
    try {
      await broker.disconnect();
    } catch (disconnectError) {
      console.error('❌ Failed to disconnect:', disconnectError);
    }
  }
}

// Run the example
kafkaExample().catch(console.error); 