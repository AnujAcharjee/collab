import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

export interface SessionUser {
  id: string;
  username: string;
}

export interface AuthedRequest extends IncomingMessage {
  user: SessionUser;
  sessionId: string;
}

export interface AppWebSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  sessionId: string;
  user: SessionUser;
}
