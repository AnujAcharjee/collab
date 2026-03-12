import { ZodError, type ZodType } from '@repo/validation';
import type { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next({ success: false, error: error.issues[0]?.message ?? 'Validation failed' });
      }

      next({ success: false, error: 'Invalid request data' });
    }
  };
};
