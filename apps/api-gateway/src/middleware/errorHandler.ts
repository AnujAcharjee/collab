import type { ErrorRequestHandler } from 'express';
import { logger } from '../lib/logger.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _req;
  void _next;

  logger.error({ error }, 'Unhandled error occurred');
  const message = error instanceof Error ? error.message : 'Internal Server Error';

  res.status(500).json({ success: false, error: message });
};

