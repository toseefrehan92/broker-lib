import { SubscriptionManager } from './dist';

async function testSimplifiedSubscription() {
  console.log('Testing Simplified Subscription Interface...');
  
  // Create a subscription manager with MQTT
  const subscriptionManager = new SubscriptionManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'test-simplified-client-' + Date.now(),
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
    // Connect explicitly
    console.log('🔌 Connecting...');
    await subscriptionManager.connect();
    
    // Subscribe with simplified interface
    console.log('📥 Subscribing to topic with simplified interface...');
    await subscriptionManager.subscribe(
      { 
        topic: 'test/simplified',
        qos: 1 
      },
      (message) => {
        console.log('📨 Received message:', message);
      }
    );

    // Publish a message
    console.log('📤 Publishing message...');
    await subscriptionManager.publish('test/simplified', {
      id: 1,
      text: 'Hello from simplified subscription!',
      timestamp: new Date().toISOString()
    });

    // Subscribe to another topic
    console.log('📥 Subscribing to second topic...');
    await subscriptionManager.subscribe(
      { 
        topic: 'test/simplified-2',
        qos: 1 
      },
      (message) => {
        console.log('📨 Received message on topic 2:', message);
      }
    );

    // Publish to second topic
    await subscriptionManager.publish('test/simplified-2', {
      id: 2,
      text: 'Hello from second topic!',
      timestamp: new Date().toISOString()
    });

    console.log('✅ Simplified subscription test completed successfully!');
    
    // Keep the connection alive for a moment to see messages
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔌 Disconnecting...');
    await subscriptionManager.disconnect();
  }
}

async function testKafkaSimplifiedSubscription() {
  console.log('Testing Kafka Simplified Subscription Interface...');
  
  // Create a subscription manager with Kafka
  const subscriptionManager = new SubscriptionManager({
    brokerType: 'KAFKA',
    kafka: {
      clientId: 'test-kafka-simplified',
      brokers: ['localhost:9092'],
      groupId: 'test-kafka-simplified-group',
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
    // Connect explicitly
    console.log('🔌 Connecting to Kafka...');
    await subscriptionManager.connect();
    
    // Subscribe with simplified interface
    console.log('📥 Subscribing to Kafka topic with simplified interface...');
    await subscriptionManager.subscribe(
      { 
        topic: 'test-kafka-simplified',
        fromBeginning: true 
      },
      (message) => {
        console.log('📨 Received Kafka message:', message);
      }
    );

    // Publish a message
    console.log('📤 Publishing message to Kafka...');
    await subscriptionManager.publish('test-kafka-simplified', {
      id: 1,
      text: 'Hello from Kafka simplified subscription!',
      timestamp: new Date().toISOString()
    });

    // Subscribe to another topic (should work without "consumer already running" error)
    console.log('📥 Subscribing to second Kafka topic...');
    await subscriptionManager.subscribe(
      { 
        topic: 'test-kafka-simplified-2',
        fromBeginning: true 
      },
      (message) => {
        console.log('📨 Received Kafka message on topic 2:', message);
      }
    );

    // Publish to second topic
    await subscriptionManager.publish('test-kafka-simplified-2', {
      id: 2,
      text: 'Hello from second Kafka topic!',
      timestamp: new Date().toISOString()
    });

    console.log('✅ Kafka simplified subscription test completed successfully!');
    
    // Keep the connection alive for a moment to see messages
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Kafka test failed:', error);
  } finally {
    console.log('🔌 Disconnecting from Kafka...');
    await subscriptionManager.disconnect();
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Simplified Subscription Tests...\n');
  
  console.log('=== MQTT Test ===');
  await testSimplifiedSubscription();
  
  console.log('\n=== Kafka Test ===');
  await testKafkaSimplifiedSubscription();
  
  console.log('\n✅ All tests completed!');
}

runTests().catch(console.error); 