declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: unknown;
    exp?: number;
    iat?: number;
    nbf?: number;
    sub?: string;
  }

  export interface VerifyOptions {
    algorithms?: string[];
  }

  export function verify(
    token: string,
    secretOrPublicKey: string,
    options?: VerifyOptions,
  ): string | JwtPayload;

  const jwt: {
    verify: typeof verify;
  };

  export default jwt;
}
