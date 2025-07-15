import { SubscriptionManager, createSubscriptionManagerFromEnv } from './src/index';

async function verifyMqttFix() {
  console.log('🔧 Verifying MQTT subscribeMultiple fix...');

  const subscriptionManager = createSubscriptionManagerFromEnv({
    BROKER_TYPE: 'MQTT',
    MQTT_URL: 'mqtt://localhost:1883',
    BROKER_CLIENT_ID: 'test-mqtt-fix-verification'
  });

  let receivedMessages: string[] = [];

  try {
    await subscriptionManager.connect();
    console.log('✅ Connected to MQTT broker');

    // Test 1: Single subscription
    console.log('\n📋 Test 1: Single subscription');
    await subscriptionManager.subscribe(
      { topic: 'test/fix/single' },
      (message: any) => {
        console.log('✅ Single handler called:', message);
        receivedMessages.push(`single:${JSON.stringify(message)}`);
      }
    );

    // Test 2: Multiple subscriptions
    console.log('\n📋 Test 2: Multiple subscriptions');
    const topicHandlers = [
      {
        topic: 'test/fix/topic1',
        handler: (message: any) => {
          console.log('✅ Topic1 handler called:', message);
          receivedMessages.push(`topic1:${JSON.stringify(message)}`);
        }
      },
      {
        topic: 'test/fix/topic2',
        handler: (message: any) => {
          console.log('✅ Topic2 handler called:', message);
          receivedMessages.push(`topic2:${JSON.stringify(message)}`);
        }
      }
    ];

    await subscriptionManager.subscribeMultiple(topicHandlers);
    console.log('✅ Successfully subscribed to multiple topics');

    // Wait for subscriptions to take effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Publish messages to test all handlers
    console.log('\n📤 Publishing test messages...');
    
    await subscriptionManager.publish('test/fix/single', { test: 'single message', timestamp: Date.now() });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await subscriptionManager.publish('test/fix/topic1', { test: 'message1', timestamp: Date.now() });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await subscriptionManager.publish('test/fix/topic2', { test: 'message2', timestamp: Date.now() });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Wait for messages to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check results
    console.log('\n📊 Results:');
    console.log('📨 Total messages received:', receivedMessages.length);
    console.log('📨 Messages:', receivedMessages);

    if (receivedMessages.length === 3) {
      console.log('✅ SUCCESS: All handlers were called correctly!');
      
      // Verify each handler was called
      const hasSingle = receivedMessages.some(msg => msg.startsWith('single:'));
      const hasTopic1 = receivedMessages.some(msg => msg.startsWith('topic1:'));
      const hasTopic2 = receivedMessages.some(msg => msg.startsWith('topic2:'));
      
      if (hasSingle && hasTopic1 && hasTopic2) {
        console.log('✅ SUCCESS: All three handlers were called!');
      } else {
        console.log('❌ FAILURE: Not all handlers were called');
        console.log('Single handler called:', hasSingle);
        console.log('Topic1 handler called:', hasTopic1);
        console.log('Topic2 handler called:', hasTopic2);
      }
    } else {
      console.log('❌ FAILURE: Expected 3 messages, got', receivedMessages.length);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await subscriptionManager.disconnect();
    console.log('👋 Disconnected');
  }
}

// Run the verification
verifyMqttFix().catch(console.error); 