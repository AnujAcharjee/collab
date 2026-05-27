declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        username?: string;
        email?: string;
      };
      auth?: {
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
      };
    }
  }
}

export {};

