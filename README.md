# Broker-Lib

A TypeScript library for Multi-Broker Message Bus with Multi-Topic Support. This library provides a unified interface for working with different message brokers including Kafka, MQTT, and Google Cloud Pub/Sub.

## Features

- **Multi-Broker Support**: Support for Kafka, MQTT, and Google Cloud Pub/Sub
- **TypeScript First**: Built with TypeScript for better type safety and developer experience
- **Unified API**: Consistent interface across different brokers
- **Error Handling**: Comprehensive error handling and connection management
- **Flexible Configuration**: Rich configuration options for each broker type
- **Message Options**: Support for message keys, headers, QoS, and other broker-specific options

## Installation

```bash
npm install broker-lib
```

## Quick Start

### Basic Usage

```typescript
import { BrokerManager } from 'broker-lib';

// Create a broker manager
const broker = new BrokerManager({
  brokerType: 'MQTT',
  mqtt: {
    url: 'mqtt://broker.hivemq.com',
  },
});

// Subscribe to topics
await broker.subscribe(['topic1', 'topic2'], (topic, message) => {
  console.log(`Received on ${topic}: ${message.toString()}`);
});

// Publish messages
await broker.publish('topic1', 'Hello MQTT!');
await broker.publish('topic2', 'Hello from broker-lib!');

// Disconnect when done
await broker.disconnect();
```

## Environment-Based Configuration

For applications that want to configure brokers using environment variables, you can use the factory functions to create broker instances from environment configuration.

### Using Factory Functions

```typescript
import { 
  createBrokerManagerFromEnv, 
  createSubscriptionManagerFromEnv,
  BrokerEnvConfig 
} from 'broker-lib';

// Define your environment variables
const env: BrokerEnvConfig = {
  BROKER_TYPE: 'MQTT',
  BROKER_CLIENT_ID: 'my-app',
  MQTT_URL: 'mqtt://broker.hivemq.com',
};

// Create broker manager from environment
const brokerManager = createBrokerManagerFromEnv(env, 'my-app');

// Or create subscription manager from environment
const subscriptionManager = createSubscriptionManagerFromEnv(env, 'my-app');
```

### Environment Variables

The following environment variables are supported:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BROKER_TYPE` | Broker type: `MQTT`, `KAFKA`, or `GCP_PUBSUB` | `KAFKA` | No |
| `BROKER_CLIENT_ID` | Client ID for the broker | `broker-lib-app` | No |
| `MQTT_URL` | MQTT broker URL | `mqtt://localhost:1883` | For MQTT |
| `KAFKA_BROKERS` | Comma-separated list of Kafka brokers | `localhost:9092` | For Kafka |
| `KAFKA_GROUP_ID` | Kafka consumer group ID | `{clientId}-group` | For Kafka |
| `GCP_PROJECT_ID` | Google Cloud project ID | `your-project-id` | For GCP Pub/Sub |
| `GCP_KEY_FILENAME` | Path to service account key file | - | For GCP Pub/Sub |

### Examples

**MQTT Configuration:**
```typescript
const env = {
  BROKER_TYPE: 'MQTT',
  BROKER_CLIENT_ID: 'my-mqtt-app',
  MQTT_URL: 'mqtt://broker.example.com',
};

const subscriptionManager = createSubscriptionManagerFromEnv(env, 'my-mqtt-app');
```

**Kafka Configuration:**
```typescript
const env = {
  BROKER_TYPE: 'KAFKA',
  BROKER_CLIENT_ID: 'my-kafka-app',
  KAFKA_BROKERS: 'kafka1.example.com:9092,kafka2.example.com:9092',
  KAFKA_GROUP_ID: 'my-consumer-group',
};

const brokerManager = createBrokerManagerFromEnv(env, 'my-kafka-app');
```

**GCP Pub/Sub Configuration:**
```typescript
const env = {
  BROKER_TYPE: 'GCP_PUBSUB',
  BROKER_CLIENT_ID: 'my-gcp-app',
  GCP_PROJECT_ID: 'my-project-id',
  GCP_KEY_FILENAME: '/path/to/service-account-key.json',
};

const subscriptionManager = createSubscriptionManagerFromEnv(env, 'my-gcp-app');
```

**Using with process.env:**
```typescript
// Set environment variables
process.env.BROKER_TYPE = 'KAFKA';
process.env.BROKER_CLIENT_ID = 'my-app';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.KAFKA_GROUP_ID = 'my-group';

// Create broker manager from process.env
const brokerManager = createBrokerManagerFromEnv(process.env as BrokerEnvConfig, 'my-app');
```

### Replacing Complex Configuration Code

Instead of writing complex configuration methods like this:

```typescript
// OLD: Complex configuration method
private getConfig(): BrokerConfig {
  const brokerType = this.configService.get<string>('BROKER_TYPE', 'KAFKA');
  
  if (brokerType === 'MQTT') {
    return {
      brokerType: 'MQTT' as const,
      mqtt: {
        url: this.configService.get<string>('MQTT_URL', 'mqtt://localhost:1883'),
        clientId: this.configService.get<string>('BROKER_CLIENT_ID') || 'my-app',
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30000,
      },
    };
  }
  
  if (brokerType === 'KAFKA') {
    return {
      brokerType: 'KAFKA' as const,
      kafka: {
        clientId: this.configService.get<string>('BROKER_CLIENT_ID') || 'my-app',
        brokers: [this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092')],
        groupId: this.configService.get<string>('KAFKA_GROUP_ID', 'my-group'),
      },
    };
  }
  
  // Default to Kafka...
}
```

You can now use a single line:

```typescript
// NEW: Single line configuration
const env = {
  BROKER_TYPE: this.configService.get('BROKER_TYPE', 'KAFKA'),
  BROKER_CLIENT_ID: this.configService.get('BROKER_CLIENT_ID', 'my-app'),
  MQTT_URL: this.configService.get('MQTT_URL', 'mqtt://localhost:1883'),
  KAFKA_BROKERS: this.configService.get('KAFKA_BROKERS', 'localhost:9092'),
  KAFKA_GROUP_ID: this.configService.get('KAFKA_GROUP_ID', 'my-group'),
};

const brokerManager = createBrokerManagerFromEnv(env, 'my-app');
```

## Simplified Subscription Interface

For applications that want a simpler subscription interface, you can use the `SubscriptionManager` class. This provides a cleaner API where you only need to call one method with options and a callback.

### Using SubscriptionManager

```typescript
import { SubscriptionManager } from 'broker-lib';

// Create a subscription manager
const subscriptionManager = new SubscriptionManager({
  brokerType: 'MQTT',
  mqtt: {
    url: 'mqtt://broker.hivemq.com',
  },
});

// Subscribe with simplified interface
await subscriptionManager.subscribe(
  { 
    topic: 'my-topic',
    qos: 1 
  },
  (message) => {
    console.log('Received message:', message);
  }
);

// Publish messages (automatically converts objects to JSON)
await subscriptionManager.publish('my-topic', {
  id: 1,
  text: 'Hello World!',
  timestamp: new Date().toISOString()
});

// Disconnect when done
await subscriptionManager.disconnect();
```

### SubscriptionManager Features

- **Automatic JSON Parsing**: Messages are automatically parsed as JSON, with fallback to raw string
- **Automatic Connection Management**: Connects automatically when needed
- **Simplified Options**: Single options object with topic and broker-specific settings
- **Object Publishing**: Automatically converts objects to JSON when publishing
- **Error Handling**: Built-in error handling and logging
- **Event Forwarding**: All broker events are forwarded for monitoring

### SubscriptionOptions Interface

```typescript
interface SubscriptionOptions {
  topic: string;              // Required: Topic to subscribe to
  fromBeginning?: boolean;    // Optional: Start from beginning (Kafka)
  qos?: number;              // Optional: Quality of Service (MQTT)
  autoAck?: boolean;         // Optional: Auto acknowledge (GCP PubSub)
}
```

### SubscriptionCallback Interface

```typescript
interface SubscriptionCallback {
  (message: any): void;      // Called with parsed message (JSON object or string)
}
```

### Examples

**MQTT with QoS:**
```typescript
await subscriptionManager.subscribe(
  { 
    topic: 'sensor/data',
    qos: 2 
  },
  (message) => {
    console.log('Sensor data:', message);
  }
);
```

**Kafka with fromBeginning:**
```typescript
await subscriptionManager.subscribe(
  { 
    topic: 'user-events',
    fromBeginning: true 
  },
  (message) => {
    console.log('User event:', message);
  }
);
```

**Multiple Subscriptions:**
```typescript
// First subscription
await subscriptionManager.subscribe(
  { topic: 'topic1' },
  (message) => console.log('Topic 1:', message)
);

// Second subscription (works for all brokers)
await subscriptionManager.subscribe(
  { topic: 'topic2' },
  (message) => console.log('Topic 2:', message)
);
```

### Multiple Topic Subscriptions with Different Handlers

You can subscribe to multiple topics with different handlers for each topic:

```typescript
import { TopicHandlerMapping } from 'broker-lib';

// Define topic-handler mappings
const topicMappings: TopicHandlerMapping[] = [
  {
    topic: 'user/events',
    handler: (message) => {
      console.log('User event:', message);
      // Process user events
    },
    options: { qos: 1 }
  },
  {
    topic: 'order/events',
    handler: (message) => {
      console.log('Order event:', message);
      // Process order events
    },
    options: { qos: 2 }
  },
  {
    topic: 'system/alerts',
    handler: (message) => {
      console.log('System alert:', message);
      // Process system alerts
    },
    options: { qos: 1 }
  }
];

// Subscribe to all topics with their respective handlers
await subscriptionManager.subscribeMultiple(topicMappings);
```

### Same Handler for Multiple Topics

You can also use the same handler for multiple related topics:

```typescript
const topics = ['logs/error', 'logs/warning', 'logs/info', 'logs/debug'];

const logHandler = (message: any) => {
  console.log('Log message:', message);
  // Process all log messages the same way
};

await subscriptionManager.subscribeToTopics(topics, logHandler, { qos: 1 });
```

### Handler Management

The `SubscriptionManager` provides methods to manage handlers:

```typescript
// Get all subscribed topics
const topics = subscriptionManager.getSubscribedTopics();

// Get handler for a specific topic
const handler = subscriptionManager.getHandler('user/events');

// Remove handler for a specific topic
subscriptionManager.removeHandler('user/events');

// Clear all handlers
subscriptionManager.clearHandlers();
```

### TopicHandlerMapping Interface

```typescript
interface TopicHandlerMapping {
  topic: string;                                    // Required: Topic to subscribe to
  handler: SubscriptionCallback;                     // Required: Handler function for this topic
  options?: Omit<SubscriptionOptions, 'topic'>;     // Optional: Subscription options
}
```

## Configuration

### How Broker Configurations are Passed

All broker configurations are passed through the `BrokerManager` constructor using a unified `BrokerConfig` interface. The configuration object has the following structure:

```typescript
{
  brokerType: 'KAFKA' | 'MQTT' | 'GCP_PUBSUB',
  kafka?: KafkaConfig,      // Required when brokerType is 'KAFKA'
  mqtt?: MqttConfig,        // Required when brokerType is 'MQTT'
  gcp?: GCPPubSubConfig,    // Required when brokerType is 'GCP_PUBSUB'
  connectionOptions?: BrokerConnectionOptions
}
```

### Kafka Configuration

The `KafkaConfig` is passed in the `kafka` property when `brokerType` is `'KAFKA'`:

```typescript
{
  brokerType: 'KAFKA',
  kafka: {
    clientId: 'my-app',
    brokers: ['localhost:9092'],
    groupId: 'my-group',
    ssl?: boolean,
    sasl?: {
      mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512',
      username: string,
      password: string,
    },
  }
}
```

#### Kafka Examples

**Basic Kafka Setup:**
```typescript
const broker = new BrokerManager({
  brokerType: 'KAFKA',
  kafka: {
    clientId: 'my-application',
    brokers: ['localhost:9092'],
    groupId: 'my-consumer-group',
  },
});
```

**Kafka with SSL:**
```typescript
const broker = new BrokerManager({
  brokerType: 'KAFKA',
  kafka: {
    clientId: 'my-app',
    brokers: ['kafka.example.com:9092'],
    groupId: 'my-group',
    ssl: true,
  },
});
```

**Kafka with SASL Authentication:**
```typescript
const broker = new BrokerManager({
  brokerType: 'KAFKA',
  kafka: {
    clientId: 'my-app',
    brokers: ['kafka.example.com:9092'],
    groupId: 'my-group',
    ssl: true,
    sasl: {
      mechanism: 'plain',
      username: 'your-username',
      password: 'your-password',
    },
  },
});
```

**Multiple Kafka Brokers:**
```typescript
const broker = new BrokerManager({
  brokerType: 'KAFKA',
  kafka: {
    clientId: 'my-app',
    brokers: [
      'kafka1.example.com:9092',
      'kafka2.example.com:9092',
      'kafka3.example.com:9092'
    ],
    groupId: 'my-group',
  },
});
```

### MQTT Configuration

The `MqttConfig` is passed in the `mqtt` property when `brokerType` is `'MQTT'`:

```typescript
{
  brokerType: 'MQTT',
  mqtt: {
    url: 'mqtt://broker.hivemq.com',
    username?: string,
    password?: string,
    clientId?: string,
    clean?: boolean,
    reconnectPeriod?: number,
    connectTimeout?: number,
    rejectUnauthorized?: boolean,
  }
}
```

#### MQTT Examples

**Basic MQTT Setup:**
```typescript
const broker = new BrokerManager({
  brokerType: 'MQTT',
  mqtt: {
    url: 'mqtt://broker.hivemq.com',
  },
});
```

**MQTT with Authentication:**
```typescript
const broker = new BrokerManager({
  brokerType: 'MQTT',
  mqtt: {
    url: 'mqtt://broker.example.com',
    username: 'your-username',
    password: 'your-password',
    clientId: 'my-client-id',
  },
});
```

**MQTT with Custom Options:**
```typescript
const broker = new BrokerManager({
  brokerType: 'MQTT',
  mqtt: {
    url: 'mqtt://broker.example.com',
    clientId: 'my-app',
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30000,
    rejectUnauthorized: true,
  },
});
```

### Google Cloud Pub/Sub Configuration

The `GCPPubSubConfig` is passed in the `gcp` property when `brokerType` is `'GCP_PUBSUB'`:

```typescript
{
  brokerType: 'GCP_PUBSUB',
  gcp: {
    projectId: 'your-project-id',
    keyFilename?: string,
    credentials?: {
      client_email: string,
      private_key: string,
    },
    apiEndpoint?: string,
  }
}
```

#### GCP Pub/Sub Examples

**Basic GCP Pub/Sub Setup:**
```typescript
const broker = new BrokerManager({
  brokerType: 'GCP_PUBSUB',
  gcp: {
    projectId: 'your-project-id',
    keyFilename: '/path/to/service-account-key.json',
  },
});
```

**GCP Pub/Sub with Credentials:**
```typescript
const broker = new BrokerManager({
  brokerType: 'GCP_PUBSUB',
  gcp: {
    projectId: 'your-project-id',
    credentials: {
      client_email: 'service-account@project.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\n...',
    },
  },
});
```

**GCP Pub/Sub with Custom Endpoint:**
```typescript
const broker = new BrokerManager({
  brokerType: 'GCP_PUBSUB',
  gcp: {
    projectId: 'your-project-id',
    keyFilename: '/path/to/service-account-key.json',
    apiEndpoint: 'https://pubsub.googleapis.com',
  },
});
```

## Connection Management

The `BrokerManager` now supports robust connection management with automatic reconnection, exponential backoff, and graceful error handling.

### Robust Reconnection with Network Resilience

```typescript
import { BrokerManager } from 'broker-lib';

const broker = new BrokerManager({
  brokerType: 'MQTT',
  mqtt: {
    url: 'mqtt://broker.hivemq.com',
    clientId: 'my-app',
  },
});

// Configure reconnection settings
broker.setReconnectionConfig({
  enabled: true,
  maxAttempts: 10,
  initialDelay: 1000,
  maxDelay: 30000,
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

// Connect explicitly
await broker.connect();

// Operations are automatically retried on connection issues
await broker.publish('my-topic', 'Hello World!');
await broker.subscribe(['my-topic'], (topic, message) => {
  console.log(`Received: ${message.toString()}`);
});

// Disconnect when done
await broker.disconnect();
```

### Key Features

- **Automatic Reconnection**: Handles network disconnections (`ECONNRESET`, `ECONNREFUSED`, etc.) automatically
- **Exponential Backoff**: Smart retry strategy with configurable delays
- **Operation Queuing**: Failed operations are queued and retried after reconnection
- **Graceful Error Handling**: Connection errors don't crash your application
- **Event-Driven**: Comprehensive event system for monitoring connection state

### Connection States

The broker manager tracks connection states:
- `'disconnected'` - Not connected
- `'connecting'` - Attempting to connect
- `'connected'` - Successfully connected
- `'error'` - Connection error occurred

### Automatic Connection

If you don't call `connect()` explicitly, the broker will automatically connect when you call `publish()` or `subscribe()`:

```typescript
const broker = new BrokerManager({
  brokerType: 'MQTT',
  mqtt: {
    url: 'mqtt://broker.hivemq.com',
  },
});

// Connection happens automatically
await broker.publish('my-topic', 'Hello!');
await broker.subscribe(['my-topic'], (topic, message) => {
  console.log(`Received: ${message.toString()}`);
});
```

### Reconnection

You can manually reconnect if needed:

```typescript
// Disconnect and reconnect
await broker.reconnect();
```

## Complete Usage Examples

### Kafka Example with Connection Management

```typescript
import { BrokerManager } from 'broker-lib';

const broker = new BrokerManager({
  brokerType: 'KAFKA',
  kafka: {
    clientId: 'my-app',
    brokers: ['localhost:9092'],
    groupId: 'my-group',
  },
});

// Connect explicitly
await broker.connect();

await broker.subscribe(['my-topic'], (topic, message) => {
  console.log(`Kafka message: ${message.toString()}`);
});

await broker.publish('my-topic', 'Hello Kafka!');

// Disconnect when done
await broker.disconnect();
```

### MQTT Example

```typescript
import { BrokerManager } from 'broker-lib';

const broker = new BrokerManager({
  brokerType: 'MQTT',
  mqtt: {
    url: 'mqtt://broker.hivemq.com',
  },
});

await broker.subscribe(['my-topic'], (topic, message) => {
  console.log(`MQTT message: ${message.toString()}`);
});

await broker.publish('my-topic', 'Hello MQTT!');
```

### Google Cloud Pub/Sub Example

```typescript
import { BrokerManager } from 'broker-lib';

const broker = new BrokerManager({
  brokerType: 'GCP_PUBSUB',
  gcp: {
    projectId: 'your-project-id',
    keyFilename: '/path/to/service-account-key.json',
  },
});

await broker.subscribe(['my-topic'], (topic, message) => {
  console.log(`PubSub message: ${message.toString()}`);
});

await broker.publish('my-topic', 'Hello PubSub!');
```

## Broker-Specific Behavior

### Kafka Behavior

Kafka has some unique characteristics compared to other brokers:

1. **Consumer Lifecycle**: Kafka consumers start consuming messages immediately when `consumer.run()` is called and continue until disconnected. The broker-lib manages this lifecycle automatically.

2. **Multiple Subscriptions**: Unlike MQTT, Kafka consumers can subscribe to multiple topics without restarting the consumer. The library handles this by:
   - Only calling `consumer.run()` once
   - Adding new topics to the existing consumer via `consumer.subscribe()`
   - Managing a single message handler for all subscribed topics

3. **Consumer Groups**: Kafka uses consumer groups for load balancing and fault tolerance. Messages are distributed among consumers in the same group.

4. **Message Ordering**: Messages within a partition are guaranteed to be in order, but messages across partitions may arrive out of order.

**Example - Multiple Kafka Subscriptions:**
```typescript
const broker = new BrokerManager({
  brokerType: 'KAFKA',
  kafka: {
    clientId: 'my-app',
    brokers: ['localhost:9092'],
    groupId: 'my-group',
  },
});

await broker.connect();

// First subscription - starts the consumer
await broker.subscribe(['topic1'], (topic, message) => {
  console.log(`Topic1: ${message.toString()}`);
});

// Second subscription - adds to existing consumer (no "consumer already running" error)
await broker.subscribe(['topic2'], (topic, message) => {
  console.log(`Topic2: ${message.toString()}`);
});

// Third subscription - also adds to existing consumer
await broker.subscribe(['topic3'], (topic, message) => {
  console.log(`Topic3: ${message.toString()}`);
});
```

### MQTT Behavior

MQTT has a simpler subscription model:

1. **Global Message Handler**: MQTT uses a single message handler for all subscribed topics, set up once when the first subscription is made.

2. **Topic Subscriptions**: Each call to `subscribe()` adds topics to the existing subscription list.

3. **QoS Levels**: MQTT supports different Quality of Service levels (0, 1, 2) for message delivery guarantees.

4. **Message Routing**: The broker-lib properly routes messages to the correct handlers when using `subscribeMultiple()` by maintaining a topic-to-handler mapping and using a unified message handler.

**Example - Multiple MQTT Subscriptions:**
```typescript
const broker = new BrokerManager({
  brokerType: 'MQTT',
  mqtt: {
    url: 'mqtt://broker.hivemq.com',
  },
});

await broker.connect();

// First subscription - sets up the message handler
await broker.subscribe(['topic1'], (topic, message) => {
  console.log(`Topic1: ${message.toString()}`);
});

// Second subscription - adds to existing handler
await broker.subscribe(['topic2'], (topic, message) => {
  console.log(`Topic2: ${message.toString()}`);
});
```

### GCP Pub/Sub Behavior

Google Cloud Pub/Sub has its own characteristics:

1. **Subscription Management**: Pub/Sub uses subscriptions that are separate from the client connection.

2. **Message Acknowledgment**: Messages must be explicitly acknowledged to prevent redelivery.

3. **Ordering**: Pub/Sub supports ordered message delivery when configured.

## API Reference

### BrokerManager

The main class for managing broker connections and operations.

#### Constructor

```typescript
new BrokerManager(config: BrokerConfig)
```

**Configuration Structure:**
```typescript
interface BrokerConfig {
  brokerType: BrokerType;           // 'KAFKA' | 'MQTT' | 'GCP_PUBSUB'
  kafka?: KafkaConfig;              // Required when brokerType is 'KAFKA'
  mqtt?: MqttConfig;                // Required when brokerType is 'MQTT'
  gcp?: GCPPubSubConfig;            // Required when brokerType is 'GCP_PUBSUB'
  connectionOptions?: BrokerConnectionOptions;
}
```

#### Methods

- `connect(): Promise<void>` - Explicitly connect to the broker
- `publish(topic: string, message: string | Buffer, options?: PublishOptions): Promise<void>`
- `subscribe(topics: string[], handler?: MessageHandler, options?: SubscribeOptions): Promise<void>`
- `disconnect(): Promise<void>`
- `reconnect(): Promise<void>` - Disconnect and reconnect to the broker
- `isConnected(): boolean` - Check if currently connected
- `getConnectionState(): 'disconnected' | 'connecting' | 'connected' | 'error'` - Get current connection state
- `getReconnectAttempts(): number` - Get number of reconnection attempts
- `setReconnectionConfig(config: Partial<ReconnectionConfig>): void` - Configure reconnection behavior
- `getBrokerType(): BrokerType`
- `setMessageHandler(handler: MessageHandler): void`

#### Events

The `BrokerManager` extends `EventEmitter` and emits the following events:

- `'connect'` - Emitted when successfully connected
- `'disconnect'` - Emitted when disconnected
- `'error'` - Emitted when a connection error occurs
- `'connecting'` - Emitted when attempting to connect
- `'reconnect'` - Emitted when reconnected (MQTT only)
- `'reconnect_failed'` - Emitted when reconnection fails (MQTT only)

#### ReconnectionConfig

```typescript
interface ReconnectionConfig {
  enabled: boolean;        // Enable/disable automatic reconnection
  maxAttempts: number;     // Maximum reconnection attempts
  initialDelay: number;    // Initial delay in milliseconds
  maxDelay: number;        // Maximum delay in milliseconds
  backoffMultiplier: number; // Exponential backoff multiplier
}
```

### Configuration Interfaces

#### KafkaConfig
```typescript
interface KafkaConfig {
  clientId: string;                 // Required: Unique client identifier
  brokers: string[];                // Required: Array of broker addresses
  groupId: string;                  // Required: Consumer group ID
  ssl?: boolean;                    // Optional: Enable SSL/TLS
  sasl?: {                          // Optional: SASL authentication
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}
```

#### MqttConfig
```typescript
interface MqttConfig {
  url: string;                      // Required: MQTT broker URL
  username?: string;                // Optional: Username for authentication
  password?: string;                // Optional: Password for authentication
  clientId?: string;                // Optional: Client ID
  clean?: boolean;                  // Optional: Clean session flag
  reconnectPeriod?: number;         // Optional: Reconnection period in ms
  connectTimeout?: number;          // Optional: Connection timeout in ms
  rejectUnauthorized?: boolean;     // Optional: SSL certificate validation
}
```

#### GCPPubSubConfig
```typescript
interface GCPPubSubConfig {
  projectId: string;                // Required: Google Cloud project ID
  keyFilename?: string;             // Optional: Path to service account key file
  credentials?: {                   // Optional: Service account credentials
    client_email: string;
    private_key: string;
  };
  apiEndpoint?: string;             // Optional: Custom API endpoint
}
```

### Message Options

#### PublishOptions
```typescript
interface PublishOptions {
  key?: string;                     // Message key (Kafka)
  partition?: number;               // Partition number (Kafka)
  headers?: Record<string, string>; // Message headers
  timestamp?: Date;                 // Message timestamp
  qos?: number;                     // Quality of Service (MQTT)
  retain?: boolean;                 // Retain flag (MQTT)
}
```

#### SubscribeOptions
```typescript
interface SubscribeOptions {
  fromBeginning?: boolean;          // Start from beginning (Kafka)
  qos?: number;                     // Quality of Service (MQTT)
  autoAck?: boolean;                // Auto acknowledge (GCP PubSub)
}
```

### Message Handler
```typescript
type MessageHandler = (topic: string, message: Buffer) => void | Promise<void>;
```

## Advanced Usage

### Using Message Options

```typescript
// Publish with options
await broker.publish('my-topic', 'Hello World!', {
  key: 'message-key',
  headers: { 'source': 'my-app' },
  qos: 1, // For MQTT
  retain: true, // For MQTT
});

// Subscribe with options
await broker.subscribe(['my-topic'], (topic, message) => {
  console.log(`Received: ${message.toString()}`);
}, {
  fromBeginning: true, // For Kafka
  qos: 1, // For MQTT
  autoAck: true, // For GCP PubSub
});
```

### Error Handling

```typescript
try {
  await broker.publish('my-topic', 'Hello World!');
} catch (error) {
  console.error('Failed to publish message:', error.message);
}

try {
  await broker.subscribe(['my-topic'], (topic, message) => {
    console.log(`Received: ${message.toString()}`);
  });
} catch (error) {
  console.error('Failed to subscribe:', error.message);
}
```

### Connection Management

```typescript
const broker = new BrokerManager(config);

// Check connection status
if (broker.isConnected()) {
  console.log('Broker is connected');
}

// Set a default message handler
broker.setMessageHandler((topic, message) => {
  console.log(`Default handler: ${topic} -> ${message.toString()}`);
});

// Subscribe without specifying handler (uses default)
await broker.subscribe(['topic1', 'topic2']);
```

## Troubleshooting

### Common Issues

#### MQTT subscribeMultiple Not Working

**Problem**: When using `subscribeMultiple()` with MQTT, handlers are not invoked for messages.

**Solution**: This issue has been fixed in version 1.0.15. The SubscriptionManager now properly:
- Passes the message handler directly to the broker's subscribe method
- Ensures the handler is set up before subscription occurs
- Maintains proper message routing for both single and multiple subscriptions

**Example**:
```typescript
const subscriptionManager = createSubscriptionManagerFromEnv({
  BROKER_TYPE: 'MQTT',
  MQTT_URL: 'mqtt://localhost:1883'
});

const topicHandlers = [
  {
    topic: 'topic1',
    handler: (message) => console.log('Topic1:', message)
  },
  {
    topic: 'topic2', 
    handler: (message) => console.log('Topic2:', message)
  }
];

// This now works correctly for MQTT
await subscriptionManager.subscribeMultiple(topicHandlers);
```

#### Kafka Consumer Already Running

**Problem**: Error "Cannot subscribe to topic while consumer is running" when trying to subscribe to additional topics.

**Solution**: The library now handles this automatically. When you call `subscribe()` multiple times:
- The first call starts the consumer
- Subsequent calls add topics to the existing consumer
- No manual consumer management is required

#### Connection Issues

**Problem**: Frequent disconnections or connection timeouts.

**Solutions**:
1. **Enable Reconnection**: The library automatically handles reconnection, but you can configure it:
   ```typescript
   broker.setReconnectionConfig({
     enabled: true,
     maxAttempts: 10,
     initialDelay: 1000,
     maxDelay: 30000,
     backoffMultiplier: 2
   });
   ```

2. **Check Network**: Ensure your broker is accessible and network connectivity is stable.

3. **Verify Configuration**: Double-check broker URLs, credentials, and connection parameters.

#### Message Handler Not Called

**Problem**: Messages are published but handlers are not invoked.

**Solutions**:
1. **Check Topic Names**: Ensure topic names match exactly (case-sensitive).
2. **Verify Subscription**: Confirm the subscription was successful.
3. **Check Message Format**: Ensure messages are in the expected format (JSON for parsed messages).
4. **Enable Logging**: Use the logger to debug message flow:
   ```typescript
   const subscriptionManager = new SubscriptionManager(config, console);
   ```

#### MaxListenersExceededWarning

**Problem**: Node.js warning about too many event listeners on MQTT client.

**Solution**: This issue has been fixed in version 1.0.17. The MQTT broker now:
- Properly cleans up event listeners after connection attempts
- Increases the max listeners limit to prevent warnings
- Uses proper listener management to prevent memory leaks

**Example**:
```typescript
// This will no longer cause MaxListenersExceededWarning
const subscriptionManager = createSubscriptionManagerFromEnv({
  BROKER_TYPE: 'MQTT',
  MQTT_URL: 'mqtt://localhost:1883'
});

// Multiple connection attempts are now safe
for (let i = 0; i < 10; i++) {
  await subscriptionManager.connect();
  await subscriptionManager.disconnect();
}
```

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Clean Build

```bash
npm run clean
npm run build
```

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
