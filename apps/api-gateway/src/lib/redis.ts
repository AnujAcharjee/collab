import { createRedisClient, type RedisClient, type RedisEventHandlers } from '@repo/redis';
import { logger } from './logger.js';

const url = process.env.REDIS_URL;

if (!url) {
  throw new Error('REDIS_URL is required');
}

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
