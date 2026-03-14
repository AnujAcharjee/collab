import { createRedisClient, type RedisClient, type RedisConfig, type RedisEventHandlers } from '@repo/redis';
import { logger } from './logger.js';
import { WebSocketServer } from 'ws';
import {
  chatMessagePayloadAndReceiversSchema,
  type ChatMessagePayloadAndReceivers,
  type WsMessage,
} from '@repo/validation';
import { AppWebSocket } from './types/wss.js';

const config: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB) || 0,
  tls: process.env.REDIS_TLS === 'true',
};

const eventHandlers: RedisEventHandlers = {
  onConnect: () => {
    logger.info('Connected to Redis');
  },
  onReady: () => {
    logger.info('Redis client is ready');
  },
  onClose: () => {
    logger.warn('Redis connection closed');
  },
  onError: (error) => {
    logger.error({ error }, 'Redis error');
  },
};

export const redis: RedisClient = createRedisClient(config, eventHandlers);
export const redisSub: RedisClient = createRedisClient(config, eventHandlers);

export const initConsumer = async (channel: string, wss: WebSocketServer): Promise<void> => {
  /**
   * ON MESSAGE
   * - consume msg
   * - parse msg
   * - get all clients for the active receivers
   * - send ws message to all
   */
  redisSub.on('message', (chan: string, message: string) => {
    if (chan !== channel) return;

    logger.debug({ channel, message }, 'Received message from Redis');

    let parsed: ChatMessagePayloadAndReceivers;
    try {
      parsed = chatMessagePayloadAndReceiversSchema.parse(JSON.parse(message));
    } catch (err) {
      logger.error({ err, message }, 'Failed to parse Redis message');
      return;
    }

    const { sender, text, attachments, roomId, parentId, createdAt, id, receivers } = parsed;

    const clients = receivers
      .map((id) =>
        [...wss.clients].find(
          (client): client is AppWebSocket =>
            client.readyState === WebSocket.OPEN && (client as AppWebSocket).sessionId === id,
        ),
      )
      .filter((client): client is AppWebSocket => client !== undefined);

    logger.debug({ clients: clients.length }, 'Number of clients to receive the message');

    const payload = {
      type: 'chat_message',
      payload: { id, parentId, sender, text, attachments, roomId, createdAt },
    } as WsMessage;
    clients.forEach((client) => client.send(JSON.stringify(payload)));
  });

  // Subscribe to the Redis channel
  await redisSub.subscribe(channel);
  logger.info({ channel }, 'Subscribed to Redis channel');
};
