import { ZodError, type ZodType } from '@repo/validation';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/appError.js';

function replaceObjectValues(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, source);
}

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

      if (parsed.body) {
        req.body = parsed.body;
      }

      if (parsed.query) {
        replaceObjectValues(req.query as Record<string, unknown>, parsed.query as Record<string, unknown>);
      }

      if (parsed.params) {
        req.params = parsed.params;
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
