export interface IBroker {
  publish(topic: string, message: string | Buffer, options?: PublishOptions): Promise<void>;
  subscribe(topics: string[], handler: MessageHandler, options?: SubscribeOptions): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export type MessageHandler = (topic: string, message: Buffer) => void | Promise<void>;

export interface MessageOptions {
  key?: string;
  partition?: number;
  headers?: Record<string, string>;
  timestamp?: Date;
}

export interface PublishOptions extends MessageOptions {
  qos?: number; // For MQTT
  retain?: boolean; // For MQTT
}

export interface SubscribeOptions {
  fromBeginning?: boolean; // For Kafka
  qos?: number; // For MQTT
  autoAck?: boolean; // For GCP PubSub
}

export interface BrokerConnectionOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}