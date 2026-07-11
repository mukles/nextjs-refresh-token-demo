import { decodeJwt, type JWTPayload } from "jose";
import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export type AccessTokenClaims = JWTPayload & {
  sub: string;
  mobile: string;
  role: string;
  sessionId: string;
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

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export function setAccessCookie(res: NextResponse, token: string): void {
  res.cookies.set(ACCESS_COOKIE, token, {
    ...baseCookie,
    path: "/",
  });
}

export function setRefreshCookie(res: NextResponse, token: string): void {
  res.cookies.set(REFRESH_COOKIE, token, {
    ...baseCookie,
    path: "/",
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...baseCookie, path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", {
    ...baseCookie,
    path: "/",
    maxAge: 0,
  });
}
