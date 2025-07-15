import { SubscriptionManager, createSubscriptionManagerFromEnv } from './src/index';

async function testMqttMemoryLeakFix() {
  console.log('🔧 Testing MQTT memory leak fix...');

  const subscriptionManager = createSubscriptionManagerFromEnv({
    BROKER_TYPE: 'MQTT',
    MQTT_URL: 'mqtt://localhost:1883',
    BROKER_CLIENT_ID: 'test-mqtt-memory-leak-fix'
  });

  try {
    // Test multiple connection attempts to see if listeners accumulate
    console.log('📋 Testing multiple connection attempts...');
    
    for (let i = 1; i <= 5; i++) {
      console.log(`\n🔄 Connection attempt ${i}/5`);
      
      try {
        await subscriptionManager.connect();
        console.log(`✅ Connection ${i} successful`);
        
        // Subscribe to a topic
        await subscriptionManager.subscribe(
          { topic: `test/memory/${i}` },
          (message: any) => {
            console.log(`📨 Message received on attempt ${i}:`, message);
          }
        );
        
        // Publish a message
        await subscriptionManager.publish(`test/memory/${i}`, { 
          test: `message ${i}`, 
          timestamp: Date.now() 
        });
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Disconnect
        await subscriptionManager.disconnect();
        console.log(`✅ Disconnected from attempt ${i}`);
        
      } catch (error) {
        console.log(`❌ Connection ${i} failed:`, error.message);
      }
    }

    console.log('\n✅ Memory leak test completed!');
    console.log('📊 If you don\'t see MaxListenersExceededWarning, the fix worked!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMqttMemoryLeakFix().catch(console.error); 