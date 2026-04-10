import { Redis } from 'ioredis';
import { RedisEventHandlers } from './types.js';

export function createRedisClient(url: string, handlers?: RedisEventHandlers) {
  // const { host, port, username, password, db = 0, tls = false } = config;

  // if (!host) throw new Error('Redis host is required');
  // if (!port) throw new Error('Redis port is required');

  // const options: RedisOptions = {
  //   host,
  //   port,
  //   username,
  //   password,
  //   db,
  //   tls: tls ? {} : undefined,
  //   maxRetriesPerRequest: 3,
  //   enableReadyCheck: true,
  //   connectTimeout: 10000,
  // };

  // const redis = new Redis(options);

  const redis = new Redis(url);

  redis.on('connect', () => handlers?.onConnect?.());
  redis.on('ready', () => handlers?.onReady?.());
  redis.on('close', () => handlers?.onClose?.());
  redis.on('error', (error) => handlers?.onError?.(error));

  return redis;
}

export function redisShutdown(redis: Redis) {
  let isShuttingDown = false;

  const handleShutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    await redis.quit();
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}
