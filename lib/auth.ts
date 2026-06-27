import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { NextResponse } from "next/server";

export const ACCESS_TOKEN_TTL_SECONDS = 60;
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-only-insecure-secret-change-me",
);

export type AccessTokenClaims = JWTPayload & {
  sub: string;
  email: string;
  name: string;
};

export async function signAccessToken(user: {
  id: string;
  email: string;
  name: string;
}): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAccessToken(
  token: string | undefined,
): Promise<AccessTokenClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as AccessTokenClaims;
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
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function setRefreshCookie(res: NextResponse, token: string): void {
  res.cookies.set(REFRESH_COOKIE, token, {
    ...baseCookie,
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
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
