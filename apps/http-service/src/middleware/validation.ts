import { ZodError, type ZodType } from '@repo/validation';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/appError.js';

export const validateRequest = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        user: req.user,
      }) as {
        body?: Request['body'];
        query?: Request['query'];
        params?: Request['params'];
        user?: Request['user'];
      };

      // req.query and req.params are getter-only properties on IncomingMessage — direct
      // assignment throws a TypeError. Mutate the existing object instead of replacing it.
      if (parsed.query) {
        Object.assign(req.query, parsed.query);
      }
      if (parsed.params) {
        Object.assign(req.params, parsed.params);
      }

      // req.body and req.user are plain writable properties, direct assignment is fine.
      if (parsed.body) {
        req.body = parsed.body;
      }
      if (parsed.user) {
        req.user = parsed.user;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new AppError(error.issues[0]?.message ?? 'Validation failed', 400));
      }

      return next(new AppError('Invalid request data', 400));
    }
  };
};
