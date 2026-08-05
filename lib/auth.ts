import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const isProd = process.env.NODE_ENV === "production";

const FALLBACK_MAX_AGE = 60 * 5; // 5 minutes

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

function decodeJwtExpiry(token: string): number | undefined {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return undefined;
    const json = Buffer.from(payloadPart, "base64url").toString("utf8");
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

function maxAgeFromToken(token: string): number {
  const exp = decodeJwtExpiry(token);
  if (exp === undefined) return FALLBACK_MAX_AGE;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const remaining = exp - nowSeconds;
  return remaining > 0 ? remaining : 0;
}

export function setAccessCookie(res: NextResponse, token: string): void {
  res.cookies.set(ACCESS_COOKIE, token, {
    ...cookieOptions,
    maxAge: maxAgeFromToken(token),
  });
}

export function setRefreshCookie(res: NextResponse, token: string): void {
  res.cookies.set(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: maxAgeFromToken(token),
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

// --- Server Action variants: mutate the current request's cookie jar directly ---
// (cookies().set() is only legal inside Server Actions / Route Handlers.)

export async function setAccessCookieDirect(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, token, {
    ...cookieOptions,
    maxAge: maxAgeFromToken(token),
  });
}

export async function setRefreshCookieDirect(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: maxAgeFromToken(token),
  });
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}
