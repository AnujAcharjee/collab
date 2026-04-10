import { ZodError, type ZodType } from '@repo/validation';
import type { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
        req.query = parsed.query;
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
        next({ success: false, error: error.issues[0]?.message ?? 'Validation failed' });
      }

      next({ success: false, error: 'Invalid request data' });
    }
  };
};
