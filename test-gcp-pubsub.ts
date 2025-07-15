import { SubscriptionManager, createSubscriptionManagerFromEnv } from './src/index';

async function testGCPPubSub() {
  console.log('🔧 Testing GCP Pub/Sub with SubscriptionManager...');

  // Note: You need to set up your GCP credentials and project
  const subscriptionManager = createSubscriptionManagerFromEnv({
    BROKER_TYPE: 'GCP_PUBSUB',
    GCP_PROJECT_ID: 'your-project-id', // Replace with your project ID
    GCP_KEY_FILENAME: '/path/to/service-account-key.json', // Optional
    BROKER_CLIENT_ID: 'test-gcp-pubsub'
  });

  let receivedMessages: string[] = [];

  try {
    await subscriptionManager.connect();
    console.log('✅ Connected to GCP Pub/Sub');

    // Subscribe to a topic
    await subscriptionManager.subscribe(
      { topic: 'projects/your-project-id/topics/test-topic' },
      (message: any) => {
        console.log('📨 Received message:', message);
        receivedMessages.push(JSON.stringify(message));
      }
    );
    console.log('✅ Successfully subscribed to topic');

    // Wait a moment for subscription to take effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Publish a message
    await subscriptionManager.publish(
      'projects/your-project-id/topics/test-topic',
      { 
        test: 'Hello from GCP Pub/Sub!', 
        timestamp: Date.now(),
        source: 'test-app'
      }
    );
    console.log('✅ Published message to topic');

    // Wait for message to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check results
    if (receivedMessages.length > 0) {
      console.log('✅ SUCCESS: Message handler was called!');
      console.log('📨 Received messages:', receivedMessages);
    } else {
      console.log('❌ FAILURE: No messages received');
      console.log('💡 Make sure your GCP credentials and project are set up correctly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('💡 Common issues:');
    console.log('   - Check your GCP project ID');
    console.log('   - Verify your service account key file path');
    console.log('   - Ensure the topic exists in your GCP project');
    console.log('   - Make sure your service account has Pub/Sub permissions');
  } finally {
    await subscriptionManager.disconnect();
    console.log('👋 Disconnected from GCP Pub/Sub');
  }
}

// Run the test
testGCPPubSub().catch(console.error); 