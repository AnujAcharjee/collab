import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/appError.js';
import { logger } from '../lib/logger.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  void req;
  void next;

  logger.error({ error }, 'Unhandled error occurred');

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : 'Internal Server Error';

  res.status(statusCode).json({ success: false, error: message });
};
