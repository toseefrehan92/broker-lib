import { BrokerConnectionOptions } from './types';

export type BrokerType = 'KAFKA' | 'MQTT' | 'GCP_PUBSUB';

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  groupId: string;
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

export interface MqttConfig {
  url: string;
  username?: string;
  password?: string;
  clientId?: string;
  clean?: boolean;
  reconnectPeriod?: number;
  connectTimeout?: number;
  rejectUnauthorized?: boolean;
}

export interface GCPPubSubConfig {
  projectId: string;
  keyFilename?: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
  apiEndpoint?: string;
}

export interface BrokerConfig {
  brokerType: BrokerType;
  kafka?: KafkaConfig;
  mqtt?: MqttConfig;
  gcp?: GCPPubSubConfig;
  connectionOptions?: BrokerConnectionOptions;
}

export interface BrokerManagerConfig extends BrokerConfig {
  topics?: string[];
  messageHandler?: (topic: string, message: Buffer) => void;
}
