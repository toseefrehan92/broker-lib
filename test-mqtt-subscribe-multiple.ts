import { SubscriptionManager, createSubscriptionManagerFromEnv } from './src/index';

async function testMqttSubscribeMultiple() {
  console.log('Testing MQTT subscribeMultiple functionality...');

  // Create subscription manager with MQTT configuration
  const subscriptionManager = createSubscriptionManagerFromEnv({
    BROKER_TYPE: 'MQTT',
    MQTT_URL: 'mqtt://localhost:1883',
    BROKER_CLIENT_ID: 'test-mqtt-subscribe-multiple'
  });

  // Set up event listeners
  subscriptionManager.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
  });

  subscriptionManager.on('disconnect', () => {
    console.log('❌ Disconnected from MQTT broker');
  });

  subscriptionManager.on('error', (error) => {
    console.error('❌ Error:', error);
  });

  try {
    // Connect to the broker
    await subscriptionManager.connect();
    console.log('✅ Successfully connected');

    // Define multiple topic handlers
    const topicHandlers = [
      {
        topic: 'test/topic1',
        handler: (message: any) => {
          console.log('📨 Received message on topic1:', message);
        }
      },
      {
        topic: 'test/topic2',
        handler: (message: any) => {
          console.log('📨 Received message on topic2:', message);
        }
      },
      {
        topic: 'test/topic3',
        handler: (message: any) => {
          console.log('📨 Received message on topic3:', message);
        }
      }
    ];

    // Subscribe to multiple topics with different handlers
    await subscriptionManager.subscribeMultiple(topicHandlers);
    console.log('✅ Successfully subscribed to multiple topics');

    // Verify subscribed topics
    const subscribedTopics = subscriptionManager.getSubscribedTopics();
    console.log('📋 Subscribed topics:', subscribedTopics);

    // Publish messages to test the handlers
    console.log('\n📤 Publishing test messages...');
    
    await subscriptionManager.publish('test/topic1', { message: 'Hello from topic1', timestamp: Date.now() });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await subscriptionManager.publish('test/topic2', { message: 'Hello from topic2', timestamp: Date.now() });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await subscriptionManager.publish('test/topic3', { message: 'Hello from topic3', timestamp: Date.now() });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test handler management
    console.log('\n🔧 Testing handler management...');
    
    // Get handler for a specific topic
    const handler = subscriptionManager.getHandler('test/topic1');
    console.log('📋 Handler for test/topic1 exists:', !!handler);

    // Remove a handler
    const removed = subscriptionManager.removeHandler('test/topic1');
    console.log('🗑️ Removed handler for test/topic1:', removed);

    // Publish to the removed topic (should not trigger handler)
    await subscriptionManager.publish('test/topic1', { message: 'This should not be handled', timestamp: Date.now() });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clear all handlers
    subscriptionManager.clearHandlers();
    console.log('🧹 Cleared all handlers');

    // Publish to all topics (should not trigger any handlers)
    await subscriptionManager.publish('test/topic2', { message: 'This should not be handled', timestamp: Date.now() });
    await subscriptionManager.publish('test/topic3', { message: 'This should not be handled', timestamp: Date.now() });
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n✅ MQTT subscribeMultiple test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Disconnect
    await subscriptionManager.disconnect();
    console.log('👋 Disconnected from broker');
  }
}

// Run the test
testMqttSubscribeMultiple().catch(console.error); 