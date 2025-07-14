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

## Complete Usage Examples

### Kafka Example

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

await broker.subscribe(['my-topic'], (topic, message) => {
  console.log(`Kafka message: ${message.toString()}`);
});

await broker.publish('my-topic', 'Hello Kafka!');
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

- `publish(topic: string, message: string | Buffer, options?: PublishOptions): Promise<void>`
- `subscribe(topics: string[], handler?: MessageHandler, options?: SubscribeOptions): Promise<void>`
- `disconnect(): Promise<void>`
- `isConnected(): boolean`
- `getBrokerType(): BrokerType`
- `setMessageHandler(handler: MessageHandler): void`

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
