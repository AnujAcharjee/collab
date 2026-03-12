import { WebSocketServer } from 'ws';
import { logger } from './logger.js';
import type { AppWebSocket } from './types/wss.js';

const PORT = Number(process.env.PORT) || 3002;
const HEARTBEAT_INTERVAL = 30_000;
const HEARTBEAT_VALUE = 0x01;

let client: WebSocketServer | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;
let shutdownHandlersRegistered = false;

function clearHeartbeat() {
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
}

function closeServer(server: WebSocketServer): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

function startHeartbeat(wss: WebSocketServer) {
  clearHeartbeat();

  heartbeat = setInterval(() => {
    try {
      wss.clients.forEach((socket) => {
        const ws = socket as AppWebSocket;

        if (!ws.isAlive) {
          ws.terminate();
          return;
        }

        ws.isAlive = false;

        try {
          ws.ping(Buffer.from([HEARTBEAT_VALUE]));
        } catch (sendErr) {
          logger.warn({ sendErr }, 'heartbeat: failed to send ping');
        }
      });
    } catch (err) {
      logger.error({ err }, 'heartbeat loop error');
    }
  }, HEARTBEAT_INTERVAL);
}

function registerShutdownHandlers(wss: WebSocketServer) {
  if (shutdownHandlersRegistered) {
    return;
  }

  const shutdown = async (signal: 'SIGINT' | 'SIGTERM') => {
    logger.info({ signal }, 'Closing WebSocket server');

    try {
      clearHeartbeat();
      await closeServer(wss);
      process.exit(0);
    } catch (err) {
      logger.error({ err, signal }, 'Error during WebSocket shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  shutdownHandlersRegistered = true;
}

function getWssClient(): WebSocketServer {
  if (!client) {
    client = new WebSocketServer({
      port: PORT,
      perMessageDeflate: {
        zlibDeflateOptions: { chunkSize: 1024, memLevel: 7, level: 3 },
        zlibInflateOptions: { chunkSize: 10 * 1024 },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024,
      },
    });

    client.on('listening', () => {
      logger.info({ port: PORT }, 'WebSocketServer listening');
    });

    client.on('error', (err) => {
      logger.error({ err }, 'WebSocket server error');
    });

    client.on('close', () => {
      clearHeartbeat();
      isInitialized = false;
      client = null;
    });
  }

  return client;
}

export async function startWebSocketServer() {
  const wss = getWssClient();

  if (!isInitialized) {
    wss.on('connection', async (socket, req) => {
      const ws = socket as AppWebSocket;

      try {
        ws.isAlive = true;
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        void req;
        ws.user = ws.user ?? { username: 'anonymous' };
        ws.sessionId = ws.sessionId ?? null;

        // TODO: authorize and validate session

        // if (!authResult.isValidSession) {
        //   logger.warn('initSocket:: Invalid session - closing socket');
        //   ws.close(4403, 'Forbidden: Invalid session');
        //   return;
        // }

        // ws.user = authResult.user;
        // ws.sessionId = authResult.sessionId ?? null;

        ws.on('message', async (data) => {
          try {
            logger.debug({ data }, 'Received message from client');
          } catch (err) {
            logger.error({ err }, 'ws.on message handler error');
          }
        });

        ws.on('close', async (code, reason) => {
          try {
            logger.info(
              {
                username: ws.user?.username ?? null,
                sessionId: ws.sessionId ?? null,
                code,
                reason: reason.toString() || null,
              },
              'WebSocket connection closed',
            );
          } catch (err) {
            logger.error({ err }, 'ws.on close handler error');
          }
        });

        ws.on('error', (err) => {
          try {
            logger.error(
              {
                err,
                username: ws?.user?.username ?? null,
                sessionId: ws?.sessionId ?? null,
              },
              'WebSocket error',
            );
          } catch (handlerErr) {
            logger.error({ handlerErr }, 'ws.on error handler threw');
          }
        });
      } catch (error) {
        logger.error({ error }, 'initSocket:: WebSocket connection error');
        ws.close(1011, 'Internal server error');
      }
    });

    startHeartbeat(wss);
    registerShutdownHandlers(wss);
    isInitialized = true;
  }

  return wss;
}
