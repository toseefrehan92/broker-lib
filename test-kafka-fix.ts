import { BrokerManager } from './dist';
import { KafkaConfig } from './dist/config';

async function testKafkaConnection() {
  const kafkaConfig: KafkaConfig = {
    clientId: 'test-client',
    brokers: ['localhost:9092'],
    groupId: 'test-group',
  };

  const manager = new BrokerManager({
    brokerType: 'KAFKA',
    kafka: kafkaConfig,
  });

  // Listen for events
  manager.on('connect', () => {
    console.log('✅ Connected to Kafka');
  });

  manager.on('disconnect', () => {
    console.log('❌ Disconnected from Kafka');
  });

  manager.on('error', (error) => {
    console.log('⚠️ Error in Kafka:', error);
  });

  try {
    console.log('🔌 Connecting to Kafka...');
    await manager.connect();
    
    console.log('📤 Publishing test message...');
    await manager.publish('test-topic', 'Hello from broker-lib!');
    
    console.log('📥 Subscribing to first topic...');
    await manager.subscribe(['test-topic'], (topic, message) => {
      console.log(`📨 Received message from ${topic}:`, message.toString());
    });

    console.log('📥 Subscribing to second topic (should not cause "consumer already running" error)...');
    await manager.subscribe(['test-topic-2'], (topic, message) => {
      console.log(`📨 Received message from ${topic}:`, message.toString());
    });

    console.log('📥 Subscribing to third topic (should not cause "consumer already running" error)...');
    await manager.subscribe(['test-topic-3'], (topic, message) => {
      console.log(`📨 Received message from ${topic}:`, message.toString());
    });

    console.log('✅ Kafka test completed successfully! Multiple subscriptions handled correctly.');
    
    // Keep the connection alive for a moment to see if any errors occur
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔌 Disconnecting...');
    await manager.disconnect();
  }
}

testKafkaConnection().catch(console.error); 