import { createRedisClient, type RedisClient, type RedisConfig, type RedisEventHandlers } from '@repo/redis';
import { logger } from './logger.js';
import { WebSocketServer } from 'ws';
import {
  chatMessagePayloadAndReceiversSchema,
  type ChatMessagePayloadAndReceivers,
  type WsMessage,
} from '@repo/validation';
import { AppWebSocket } from './types/wss.js';

const url = process.env.REDIS_URL!;

// const config: RedisConfig = {
//   host: process.env.REDIS_HOST || 'localhost',
//   port: Number(process.env.REDIS_PORT) || 6379,
//   username: process.env.REDIS_USERNAME,
//   password: process.env.REDIS_PASSWORD,
//   db: Number(process.env.REDIS_DB) || 0,
//   tls: process.env.REDIS_TLS === 'true',
// };

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

export const redis: RedisClient = createRedisClient(url, eventHandlers);
export const redisSub: RedisClient = createRedisClient(url, eventHandlers);

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
      .map((receiverId: string) =>
        [...wss.clients].find((client): client is AppWebSocket => (client as AppWebSocket).user.id === receiverId),
      )
      .filter((client: AppWebSocket | undefined): client is AppWebSocket => client !== undefined);

    logger.debug({ clients: clients.length }, 'Number of clients to receive the message');

    const wsMessage: WsMessage = {
      type: 'chat_message',
      payload: { id, parentId, sender, text, attachments, roomId, createdAt },
    };
    const wsStrMessage = JSON.stringify(wsMessage);

    clients.forEach((client: AppWebSocket) => {
      if (client.readyState === client.OPEN) {
        client.send(wsStrMessage);
      }
    });
  });

  // Subscribe to the Redis channel
  await redisSub.subscribe(channel);
  logger.info({ channel }, 'Subscribed to Redis channel');
};
