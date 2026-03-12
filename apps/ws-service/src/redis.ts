import { createRedisClient, type RedisClient, type RedisConfig, type RedisEventHandlers } from '@repo/redis';
import { logger } from './logger.js';
import type { WebSocketServer } from 'ws';

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

export const redisSub: RedisClient = createRedisClient(config, eventHandlers);

export const initConsumer = async (channel: string, wss: WebSocketServer): Promise<void> => {
  await redisSub.subscribe(channel, (err, count) => {
    if (err) {
      logger.fatal({ err }, 'initRedisConsumer:: Redis subscribe ERROR');
    } else {
      logger.info({ channel }, `Redis:Subscribed to ${count} channels`);
    }
  });

  redisSub.on('message', (chan, message) => {
    if (chan === channel) {
      logger.debug({ channel, message }, 'Received message from Redis');

      // const {receiverIds} = JSON.parse(message) as { receiverIds: string[]; data: unknown };

      // get all connected clients who's gonna receive the message

      // if (!Array.isArray(receiverIds) || receiverIds.length === 0) {
      //   logger.warn({ receiverIds }, 'initRedisConsumer:: No sessionIds provided, skipping message');
      //   return;
      // }

      // const clientsToSend = receiverIds.map((id) => [...wss.clients].)

    }
  });
};
