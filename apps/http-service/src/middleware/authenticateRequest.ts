import type { NextFunction, Request, Response } from 'express';
import { auth, AuthService, type AccessTokenPayload } from '../lib/auth.js';
// import { logger } from '../lib/logger.js';

function extractUser(payload: AccessTokenPayload): Request['user'] | null {
  const id =
    typeof payload.sub === 'string' ? payload.sub
    : typeof payload.userId === 'string' ? payload.userId
    : typeof payload.id === 'string' ? payload.id
    : null;

  if (!id) return null;

  return {
    id,
    ...(typeof payload.username === 'string' ? { username: payload.username } : {}),
    ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
  };
}

export const authenticateRequest = async (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const cookies = AuthService.parseCookies(req.headers.cookie);
  const authCookie = auth.getAccessTokenCookie(cookies);

  if (!authCookie) {
    return res.status(401).json({ success: false, error: 'Access token cookie is required' });
  }

  const payload = await auth.verifyAccessToken(authCookie.accessToken);
  const user = payload ? extractUser(payload) : null;

  if (!payload || !user) {
    return res.status(401).json({ success: false, error: 'Invalid or expired access token' });
  }

  req.auth = {
    cookieName: authCookie.cookieName,
    accessToken: authCookie.accessToken,
    cookies,
    payload: {
      ...payload,
      sub: typeof payload.sub === 'string' ? payload.sub : undefined,
      id: typeof payload.id === 'string' ? payload.id : undefined,
      userId: typeof payload.userId === 'string' ? payload.userId : undefined,
      username: typeof payload.username === 'string' ? payload.username : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      nbf: typeof payload.nbf === 'number' ? payload.nbf : undefined,
    },
  };

  req.user = user;
  return next();
};
