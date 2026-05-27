import type { NextFunction, Request, Response } from 'express';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  key?: (req: Request) => string;
};

export function rateLimit({ windowMs, max, key }: RateLimitOptions) {
  const keyFn = key ?? ((req) => req.ip || 'unknown');

  return async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const identity = keyFn(req) || 'unknown';
    const redisKey = `rate-limit:api-gateway:${identity}`;

    try {
      const count = await redis.incr(redisKey);

      if (count === 1) {
        await redis.pexpire(redisKey, windowMs);
      }

      const ttl = await redis.pttl(redisKey);
      const resetAt = now + (ttl > 0 ? ttl : windowMs);
      const remaining = Math.max(0, max - count);

      res.setHeader('x-ratelimit-limit', String(max));
      res.setHeader('x-ratelimit-remaining', String(remaining));
      res.setHeader('x-ratelimit-reset', String(Math.ceil(resetAt / 1000)));

      if (count > max) {
        return res.status(429).json({ success: false, error: 'Too many requests' });
      }

      return next();
    } catch (error) {
      logger.error({ error, key: redisKey }, 'Redis rate limit check failed');
      return res.status(503).json({ success: false, error: 'Rate limit service unavailable' });
    }
  };
}
