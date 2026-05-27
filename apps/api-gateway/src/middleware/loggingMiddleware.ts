import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger.js';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const logData = {
      requestId: req.requestId || req.get('x-request-id') || undefined,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startTime,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      context: 'ApiGatewayRequest',
      userId: req.user?.id,
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

