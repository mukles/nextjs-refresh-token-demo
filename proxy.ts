import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  clearAuthCookies,
  decodeAccessToken,
  REFRESH_COOKIE,
  setAccessCookie,
  setRefreshCookie,
} from "@/lib/auth";

const SKEW_SECONDS = 0;

export async function proxy(request: NextRequest) {
  const claims = decodeAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);

  const now = Math.floor(Date.now() / 1000);
  const isExpired = claims?.exp ? claims.exp + SKEW_SECONDS < now : true;

  if (claims && !isExpired) {
    return NextResponse.next();
  }

  if (isExpired) {
    const refreshRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/refresh`,
      {
        method: "POST",
        headers: request.headers,
      },
    );
    const tokens = await refreshRes.json().catch(() => ({}));

    if (tokens) {
      // 1) Make the rotated tokens visible to THIS request's SSR render.
      request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
      request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
      const response = NextResponse.next({
        request: { headers: request.headers },
      });
      // 2) Persist them to the browser.
      setAccessCookie(response, tokens.accessToken);
      setRefreshCookie(response, tokens.refreshToken);
      return response;
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  const res = NextResponse.redirect(loginUrl);
  clearAuthCookies(res);
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
