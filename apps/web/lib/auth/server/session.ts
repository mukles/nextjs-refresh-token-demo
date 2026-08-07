import { decodeJwt, type JWTPayload } from "jose";
import type { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  COOKIE_OPTS,
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
} from "../constants";

export type AccessTokenClaims = JWTPayload & {
  sub: string;
  mobile: string;
  role: string;
  sessionId: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type TokenPayload = {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export function decodeAccessToken(
  token: string | undefined,
): AccessTokenClaims | null {
  if (!token) return null;
  try {
    return decodeJwt(token) as AccessTokenClaims;
  } catch {
    return null;
  }
}

export function readAuthTokens(payload: unknown): AuthTokens | null {
  const body = payload as TokenPayload | null;
  if (!body?.access_token || !body.refresh_token) return null;
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresIn: body.expires_in,
  };
}

export function setAuthCookies(res: NextResponse, tokens: AuthTokens): void {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...COOKIE_OPTS,
    ...(tokens.expiresIn ? { maxAge: tokens.expiresIn } : {}),
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...COOKIE_OPTS,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
}
