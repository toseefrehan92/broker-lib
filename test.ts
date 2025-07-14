import { BrokerManager } from './src/index';

async function testMQTT() {
  console.log('Testing MQTT...');
  
  const broker = new BrokerManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'test-client-' + Date.now(),
    },
  });

  try {
    // Subscribe to topics
    await broker.subscribe(['test/topic1', 'test/topic2'], (topic, message) => {
      console.log(`MQTT Received on ${topic}: ${message.toString()}`);
    });

    // Publish messages
    await broker.publish('test/topic1', 'Hello MQTT!');
    await broker.publish('test/topic2', 'Hello from broker-lib!');

    // Wait a bit for messages to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    await broker.disconnect();
    console.log('MQTT test completed');
  } catch (error) {
    console.error('MQTT test failed:', error);
  }
}

async function testKafka() {
  console.log('Testing Kafka...');
  
  const broker = new BrokerManager({
    brokerType: 'KAFKA',
    kafka: {
      clientId: 'test-client',
      brokers: ['localhost:9092'],
      groupId: 'test-group',
    },
  });

  try {
    // Subscribe to topics
    await broker.subscribe(['test-topic'], (topic, message) => {
      console.log(`Kafka Received on ${topic}: ${message.toString()}`);
    });

    // Publish messages
    await broker.publish('test-topic', 'Hello Kafka!');
    await broker.publish('test-topic', 'Hello from broker-lib!');

    // Wait a bit for messages to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    await broker.disconnect();
    console.log('Kafka test completed');
  } catch (error) {
    console.error('Kafka test failed:', error);
  }
}

async function testGCPPubSub() {
  console.log('Testing GCP PubSub...');
  
  const broker = new BrokerManager({
    brokerType: 'GCP_PUBSUB',
    gcp: {
      projectId: 'your-project-id',
      keyFilename: '/path/to/service-account-key.json',
    },
  });

  try {
    // Subscribe to topics
    await broker.subscribe(['test-topic'], (topic, message) => {
      console.log(`PubSub Received on ${topic}: ${message.toString()}`);
    });

    // Publish messages
    await broker.publish('test-topic', 'Hello PubSub!');
    await broker.publish('test-topic', 'Hello from broker-lib!');

    // Wait a bit for messages to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    await broker.disconnect();
    console.log('GCP PubSub test completed');
  } catch (error) {
    console.error('GCP PubSub test failed:', error);
  }
}

async function testWithOptions() {
  console.log('Testing with message options...');
  
  const broker = new BrokerManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'test-options-client-' + Date.now(),
    },
  });

  try {
    // Subscribe with options
    await broker.subscribe(['test/options'], (topic, message) => {
      console.log(`Received with options on ${topic}: ${message.toString()}`);
    }, {
      qos: 1,
    });

    // Publish with options
    await broker.publish('test/options', 'Hello with options!', {
      qos: 1,
      retain: true,
      headers: { 'source': 'test-app' },
    });

    // Wait a bit for messages to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    await broker.disconnect();
    console.log('Options test completed');
  } catch (error) {
    console.error('Options test failed:', error);
  }
}

async function testErrorHandling() {
  console.log('Testing error handling...');
  
  const broker = new BrokerManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://invalid-broker-url.com',
      clientId: 'test-error-client-' + Date.now(),
    },
  });

  try {
    await broker.publish('test/topic', 'This should fail');
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }

  try {
    await broker.subscribe(['test/topic'], (topic, message) => {
      console.log('This should not be called');
    });
  } catch (error) {
    console.log('Expected subscription error caught:', error.message);
  }
}

async function main() {
  console.log('Starting broker-lib tests...\n');

  // Test MQTT (this should work with public broker)
  await testMQTT();
  console.log('');

  // Test with options
  await testWithOptions();
  console.log('');

  // Test error handling
  await testErrorHandling();
  console.log('');

  // Uncomment these to test other brokers (requires local setup)
  // await testKafka();
  // await testGCPPubSub();

  console.log('All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}