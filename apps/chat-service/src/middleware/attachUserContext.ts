import type { NextFunction, Request, Response } from 'express';

export const attachUserContext = (req: Request, _res: Response, next: NextFunction) => {
  const id = req.get('x-user-id')?.trim();
  if (!id) {
    return next();
  }

  const username = req.get('x-user-username')?.trim();
  const email = req.get('x-user-email')?.trim();

  req.user = {
    id,
    ...(username ? { username } : {}),
    ...(email ? { email } : {}),
  };

  next();
};

