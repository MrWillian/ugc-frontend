import { decodeJwt, type JWTPayload } from "jose";

export type AccessTokenPayload = JWTPayload & {
  sub?: string;
  clientId?: string;
  email?: string;
};

/** Decodifica o JWT sem verificar assinatura (útil no client para ler claims). */
export function decodeAccessToken(token: string): AccessTokenPayload {
  return decodeJwt(token) as AccessTokenPayload;
}
