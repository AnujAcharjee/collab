import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const incoming = req.get('x-request-id');
  const id = (incoming && incoming.trim()) || uuidv4();

  req.requestId = id;
  res.setHeader('x-request-id', id);

  next();
};

