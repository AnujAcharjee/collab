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

  export interface SignOptions {
    algorithm?: string;
    expiresIn?: number | string;
  }

  export function verify(
    token: string,
    secretOrPublicKey: string,
    options?: VerifyOptions,
  ): string | JwtPayload;
  export function sign(
    payload: string | Buffer | Record<string, unknown>,
    secretOrPrivateKey: string,
    options?: SignOptions,
  ): string;

  const jwt: {
    verify: typeof verify;
    sign: typeof sign;
  };

  export default jwt;
}
