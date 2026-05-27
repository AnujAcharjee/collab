import type { NextFunction, Request, Response } from 'express';

const headerName = 'x-gateway-secret';

export const requireGatewaySecret = (req: Request, res: Response, next: NextFunction) => {
  const expected = process.env.GATEWAY_INTERNAL_SECRET?.trim();

  // Dev-friendly: if not configured, don't enforce.
  if (!expected) {
    return next();
  }

  const provided = req.get(headerName)?.trim();
  if (!provided || provided !== expected) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  return next();
};

