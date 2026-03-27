import type { ErrorRequestHandler } from 'express';
import { logger } from '../logger.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  void req;
  void next;
  logger.error({ error }, 'Unhandled error occurred');
  res.status(500).json({ success: false, error: 'Internal Server Error' });
};
