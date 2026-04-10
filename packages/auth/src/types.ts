import { type JWTPayload } from 'jose';

export type AuthConfig = {
  jwtSecret: string;
  accessTokenTtlSeconds?: number;
  accessTokenCookieName?: string;
  // only needed if using Pramaan / OIDC id token verification
  oidc?: {
    jwksUrl: string;
    issuer: string;
    clientId: string;
  };
};

export type AccessTokenPayload = JWTPayload & {
  sub?: unknown;
  id?: unknown;
  userId?: unknown;
  username?: unknown;
  email?: unknown;
};

export type ProviderProfile = {
  sub?: unknown;
  email?: unknown;
  emailVerified?: boolean;
  name?: unknown;
  picture?: unknown;
  preferred_username?: unknown;
  given_name?: unknown;
  family_name?: unknown;
};