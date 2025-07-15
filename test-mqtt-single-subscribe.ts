import { SubscriptionManager, createSubscriptionManagerFromEnv } from './src/index';

async function testMqttSingleSubscribe() {
  console.log('🔧 Testing MQTT single subscribe functionality...');

  const subscriptionManager = createSubscriptionManagerFromEnv({
    BROKER_TYPE: 'MQTT',
    MQTT_URL: 'mqtt://localhost:1883',
    BROKER_CLIENT_ID: 'test-mqtt-single-subscribe'
  });

  let receivedMessages: string[] = [];

  try {
    await subscriptionManager.connect();
    console.log('✅ Connected to MQTT broker');

    // Subscribe to a single topic
    await subscriptionManager.subscribe(
      { topic: 'test/single/topic1' },
      (message: any) => {
        console.log('✅ Single topic handler called:', message);
        receivedMessages.push(`single:${JSON.stringify(message)}`);
      }
    );
    console.log('✅ Successfully subscribed to single topic');

    // Wait a moment for subscription to take effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Publish message to test handler
    await subscriptionManager.publish('test/single/topic1', { test: 'single message', timestamp: Date.now() });

    // Wait for message to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check results
    if (receivedMessages.length === 1) {
      console.log('✅ SUCCESS: Single handler was called correctly!');
      console.log('📨 Received messages:', receivedMessages);
    } else {
      console.log('❌ FAILURE: Expected 1 message, got', receivedMessages.length);
      console.log('📨 Received messages:', receivedMessages);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await subscriptionManager.disconnect();
    console.log('👋 Disconnected');
  }
}

// Run the test
testMqttSingleSubscribe().catch(console.error); 