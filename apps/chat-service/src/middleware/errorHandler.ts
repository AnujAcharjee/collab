import type { ErrorRequestHandler } from 'express';
import { logger } from '../logger.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error({ error }, 'Unhandled error occurred');
  res.status(500).json({ success: false, error: 'Internal Server Error' });
};