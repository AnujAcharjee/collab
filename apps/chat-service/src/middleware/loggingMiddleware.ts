import { logger } from '../lib/logger.js';
import type { Request, Response, NextFunction } from 'express';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startTime,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      context: 'ChatRequest',
      userId: req.user?.id,
      query: Object.keys(req.query).length ? req.query : undefined,
      body: Object.keys(req.body || {}).length ? req.body : undefined,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request failed');
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn(logData, 'Request failed');
      return;
    }

    logger.info(logData, 'Request completed');
  });

  next();
};
