export interface RedisConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: boolean;
}

export interface RedisEventHandlers {
  onConnect?: () => void;
  onReady?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}
