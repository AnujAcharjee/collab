import { jwtVerify, createRemoteJWKSet, SignJWT } from 'jose';
import type { AuthConfig, AccessTokenPayload, ProviderProfile } from './types.js';

const DEFAULT_ACCESS_TOKEN_COOKIE_NAMES = ['accessToken', 'access_token'] as const;

export class AuthService {
  private readonly jwtSecret: Uint8Array;
  private readonly accessTokenTtlSeconds: number;
  private readonly accessTokenCookieName: string | undefined;
  private readonly oidcConfig: AuthConfig['oidc'] | undefined;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

  constructor(config: AuthConfig) {
    if (!config.jwtSecret) {
      throw new Error('jwtSecret is required');
    }

    this.jwtSecret = new TextEncoder().encode(config.jwtSecret);
    this.accessTokenTtlSeconds = config.accessTokenTtlSeconds ?? 60 * 60 * 24 * 7;
    this.accessTokenCookieName = config.accessTokenCookieName?.trim();
    this.oidcConfig = config.oidc;

    if (config.oidc) {
      this.jwks = createRemoteJWKSet(new URL(config.oidc.jwksUrl));
    }
  }

  // --- Token issuing ---

  issueAccessToken(user: { id: string; email: string; username: string }): Promise<string> {
    return new SignJWT({ userId: user.id, email: user.email, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(`${this.accessTokenTtlSeconds}s`)
      .sign(this.jwtSecret);
  }

  // --- Token verification ---

  async verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
    try {
      const { payload } = await jwtVerify<AccessTokenPayload>(token, this.jwtSecret, {
        algorithms: ['HS256'],
      });
      return payload;
    } catch {
      return null;
    }
  }

  async verifyIdToken(idToken: string, nonce: string): Promise<ProviderProfile> {
    if (!this.jwks || !this.oidcConfig) {
      throw new Error('OIDC is not configured — pass oidc config to AuthService');
    }

    const { payload } = await jwtVerify(idToken, this.jwks, {
      issuer: this.oidcConfig.issuer,
      audience: this.oidcConfig.clientId,
      algorithms: ['RS256'],
    });

    if (payload.nonce !== nonce) {
      throw new Error('Invalid nonce');
    }

    return payload as ProviderProfile;
  }

  // --- Cookie helpers ---

  getAccessTokenCookie(cookies: Record<string, string>): { cookieName: string; accessToken: string } | null {
    const candidateCookieNames =
      this.accessTokenCookieName ?
        [this.accessTokenCookieName, ...DEFAULT_ACCESS_TOKEN_COOKIE_NAMES]
      : DEFAULT_ACCESS_TOKEN_COOKIE_NAMES;

    for (const cookieName of candidateCookieNames) {
      const accessToken = cookies[cookieName];
      if (accessToken) {
        return { cookieName, accessToken };
      }
    }

    return null;
  }

  // --- Static utils (no config needed) ---

  static parseCookies(cookieHeader: string | undefined): Record<string, string> {
    if (!cookieHeader) return {};

    return cookieHeader.split(';').reduce<Record<string, string>>((cookies, segment) => {
      const trimmed = segment.trim();
      if (!trimmed) return cookies;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) return cookies;

      const name = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      if (!name) return cookies;

      try {
        cookies[name] = decodeURIComponent(rawValue);
      } catch {
        cookies[name] = rawValue;
      }

      return cookies;
    }, {});
  }

  static extractUser(payload: AccessTokenPayload): { id: string; username?: string; email?: string } | null {
    const id = payload.sub ?? payload.userId ?? payload.id;
    if (!id || typeof id !== 'string') return null;

    const username = typeof payload.username === 'string' ? payload.username : undefined;
    const email = typeof payload.email === 'string' ? payload.email : undefined;

    return {
      id,
      ...(username ? { username } : {}),
      ...(email ? { email } : {}),
    };
  }
}

export type { AccessTokenPayload, ProviderProfile } from './types.js';
