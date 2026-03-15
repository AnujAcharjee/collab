import type { ErrorRequestHandler } from 'express';
import { logger } from '../logger.js';
import { AppError } from '../utils/appError.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error({ error }, 'Unhandled error occurred');

  const message = error instanceof Error ? error.message : 'Internal Server Error';
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  res.status(statusCode).json({ success: false, error: message });
};
