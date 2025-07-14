import { BrokerManager } from './src/index';

async function testRobustReconnection() {
  console.log('Testing Robust Reconnection with Network Disconnections...');
  
  const broker = new BrokerManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'test-robust-client-' + Date.now(),
    },
  });

  // Configure reconnection settings
  broker.setReconnectionConfig({
    enabled: true,
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  });

  // Set up comprehensive event listeners
  broker.on('connect', () => {
    console.log('✅ Connected to broker');
  });

  broker.on('disconnect', () => {
    console.log('❌ Disconnected from broker');
  });

  broker.on('error', (error) => {
    console.log('⚠️ Broker error:', error?.message);
  });

  broker.on('connecting', () => {
    console.log('🔄 Connecting to broker...');
  });

  broker.on('reconnect', () => {
    console.log('🔄 Reconnected successfully');
  });

  broker.on('reconnect_failed', (error) => {
    console.log('💥 Reconnection failed:', error?.message);
  });

  try {
    // Connect initially
    console.log('🔌 Initial connection...');
    await broker.connect();
    
    console.log('📊 Connection state:', broker.getConnectionState());
    console.log('🔗 Is connected:', broker.isConnected());

    // Subscribe to topics
    await broker.subscribe(['test/robust'], (topic, message) => {
      console.log(`📨 Received on ${topic}: ${message.toString()}`);
    });

    // Publish a message
    await broker.publish('test/robust', 'Hello from robust connection!');
    console.log('✅ Message published successfully');

    // Simulate network disconnection by publishing while connection might be unstable
    console.log('🔄 Testing resilience with multiple operations...');
    
    for (let i = 0; i < 5; i++) {
      try {
        await broker.publish('test/robust', `Message ${i + 1} - testing resilience`);
        console.log(`✅ Published message ${i + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`⚠️ Operation ${i + 1} failed, but reconnection should handle it:`, error?.message);
      }
    }

    console.log('📊 Final connection state:', broker.getConnectionState());
    console.log('🔗 Final is connected:', broker.isConnected());
    console.log('🔄 Reconnect attempts:', broker.getReconnectAttempts());

    // Disconnect cleanly
    await broker.disconnect();
    console.log('✅ Disconnected successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testExplicitConnection() {
  console.log('Testing Explicit Connection Management...');
  
  const broker = new BrokerManager({
    brokerType: 'KAFKA',
    kafka: {
      clientId: 'test-explicit-client',
      brokers: ['localhost:9092'],
      groupId: 'test-explicit-group',
    },
  });

  // Set up event listeners
  broker.on('connect', () => {
    console.log('✅ Broker Connected');
  });

  broker.on('disconnect', () => {
    console.log('❌ Broker Disconnected');
  });

  broker.on('error', (error) => {
    console.log('⚠️ Broker Error:', error?.message);
  });

  broker.on('connecting', () => {
    console.log('🔄 Connecting to broker...');
  });

  try {
    console.log('📊 Initial connection state:', broker.getConnectionState());
    console.log('🔗 Is connected:', broker.isConnected());

    // Explicitly connect
    console.log('🔌 Connecting explicitly...');
    await broker.connect();
    
    console.log('📊 Connection state after connect:', broker.getConnectionState());
    console.log('🔗 Is connected:', broker.isConnected());

    if (broker.isConnected()) {
      console.log('✅ Connection successful!');
      
      // Test publish
      await broker.publish('test-explicit-topic', 'Hello from explicit connection!');
      console.log('✅ Message published successfully');
      
      // Test subscribe
      await broker.subscribe(['test-explicit-topic'], (topic, message) => {
        console.log(`📨 Received on ${topic}: ${message.toString()}`);
      });
      console.log('✅ Subscribed successfully');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Disconnect
      await broker.disconnect();
      console.log('✅ Disconnected successfully');
    } else {
      console.log('❌ Connection failed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testConnectionLifecycle() {
  console.log('Testing Connection Lifecycle...');
  
  const broker = new BrokerManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'test-lifecycle-client-' + Date.now(),
    },
  });

  // Set up event listeners
  broker.on('connect', () => {
    console.log('✅ Connected to broker');
  });

  broker.on('disconnect', () => {
    console.log('❌ Disconnected from broker');
  });

  broker.on('error', (error) => {
    console.log('⚠️ Connection error:', error?.message);
  });

  broker.on('connecting', () => {
    console.log('🔄 Connecting...');
  });

  try {
    // Connect explicitly
    console.log('🔌 Connecting...');
    await broker.connect();
    
    console.log('📊 Connection state:', broker.getConnectionState());
    console.log('🔗 Is connected:', broker.isConnected());

    // Subscribe to topics
    await broker.subscribe(['test/lifecycle'], (topic, message) => {
      console.log(`📨 Received on ${topic}: ${message.toString()}`);
    });

    // Publish messages
    await broker.publish('test/lifecycle', 'Hello Connection Lifecycle!');

    // Wait a bit for messages to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Disconnect
    console.log('🔌 Disconnecting...');
    await broker.disconnect();
    
    console.log('📊 Final connection state:', broker.getConnectionState());
    console.log('🔗 Final is connected:', broker.isConnected());

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testReconnection() {
  console.log('Testing reconnection...');
  
  const broker = new BrokerManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'test-reconnect-client-' + Date.now(),
    },
  });

  // Set up event listeners
  broker.on('connect', () => console.log('🟢 Connected'));
  broker.on('disconnect', () => console.log('🔴 Disconnected'));
  broker.on('error', (error) => console.log('⚠️ Error:', error?.message));
  broker.on('reconnect', () => console.log('🔄 Reconnected'));
  broker.on('reconnect_failed', (error) => console.log('💥 Reconnect failed:', error?.message));

  try {
    await broker.connect();
    console.log('Initial connection successful');
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test manual reconnect
    console.log('Testing manual reconnect...');
    await broker.reconnect();
    
    console.log('Reconnection test completed');
  } catch (error) {
    console.error('Reconnection test failed:', error);
  } finally {
    await broker.disconnect();
  }
}

async function testMQTT() {
  console.log('Testing MQTT...');
  
  const broker = new BrokerManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'test-client-' + Date.now(),
    },
  });

  // Set up event listeners
  broker.on('connect', () => console.log('MQTT Connected'));
  broker.on('disconnect', () => console.log('MQTT Disconnected'));
  broker.on('error', (error) => console.log('MQTT Error:', error?.message));

  try {
    // Connect first
    await broker.connect();
    
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

async function testWithOptions() {
  console.log('Testing with message options...');
  
  const broker = new BrokerManager({
    brokerType: 'MQTT',
    mqtt: {
      url: 'mqtt://broker.hivemq.com',
      clientId: 'test-options-client-' + Date.now(),
    },
  });

  // Set up event listeners
  broker.on('connect', () => console.log('Options test connected'));
  broker.on('disconnect', () => console.log('Options test disconnected'));

  try {
    // Connect first
    await broker.connect();
    
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

  // Set up event listeners
  broker.on('connect', () => console.log('Error test connected'));
  broker.on('disconnect', () => console.log('Error test disconnected'));
  broker.on('error', (error) => console.log('Error test error:', error?.message));

  try {
    await broker.connect();
  } catch (error) {
    console.log('Expected connection error caught:', error);
  }

  try {
    await broker.publish('test/topic', 'This should fail');
  } catch (error) {
    console.log('Expected publish error caught:', error);
  }

  try {
    await broker.subscribe(['test/topic'], (_topic, _message) => {
      console.log('This should not be called');
    });
  } catch (error) {
    console.log('Expected subscription error caught:', error);
  }
}

async function main() {
  console.log('Starting broker-lib tests with robust reconnection...\n');

  // Test robust reconnection (this is the main new feature)
  await testRobustReconnection();
  console.log('');

  // Test explicit connection management
  await testExplicitConnection();
  console.log('');

  // Test connection lifecycle
  await testConnectionLifecycle();
  console.log('');

  // Test reconnection
  await testReconnection();
  console.log('');

  // Test MQTT (this should work with public broker)
  await testMQTT();
  console.log('');

  // Test with options
  await testWithOptions();
  console.log('');

  // Test error handling
  await testErrorHandling();
  console.log('');

  console.log('All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}