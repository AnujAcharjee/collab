import type { WebSocket } from 'ws';

export type AuthenticatedUser = {
  username: string;
  [key: string]: unknown;
};

export type AuthResult = {
  isValidAccessToken: boolean;
  isValidSession: boolean;
  user: AuthenticatedUser;
  sessionId?: string | null;
};

export type KafkaValue = {
  action_kafka: 'SEND_UNSENT_MSG';
  username: string;
  sessionId: string | null;
  gatewayId: string | undefined;
};

export type AppWebSocket = WebSocket & {
  isAlive: boolean;
  user: AuthenticatedUser;
  sessionId: string | null;
};
