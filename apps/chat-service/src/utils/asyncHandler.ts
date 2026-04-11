import type { NextFunction, Request, Response } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (handler: AsyncRequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unexpected error');
    }
  };
};
