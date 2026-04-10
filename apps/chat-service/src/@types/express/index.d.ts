declare global {
  namespace Express {
    interface AuthenticatedRequestCookieInfo {
      cookieName: string;
      accessToken: string;
      cookies: Record<string, string>;
      payload: {
        sub?: string;
        id?: string;
        userId?: string;
        username?: string;
        email?: string;
        exp?: number;
        iat?: number;
        nbf?: number;
        [key: string]: unknown;
      };
    }

    interface Request {
      user?: {
        id: string;
        username?: string;
        email?: string;
      };
      auth?: AuthenticatedRequestCookieInfo;
    }
  }
}

export {};
