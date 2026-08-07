import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookies, decodeAccessToken } from "./lib/auth/server/session";
import {
  ACCESS_COOKIE,
  ACCESS_EXPIRY_SKEW_SECONDS,
  REFRESH_COOKIE,
  COOKIE_OPTS,
} from "./lib/auth/constants";

function isAuthRoute(request: NextRequest) {
  const publicRoutes = ["/login", "/register"];
  return publicRoutes.some((path) => request.nextUrl.pathname === path);
}

export async function proxy(request: NextRequest) {
  const claims = decodeAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);

  const now = Math.floor(Date.now() / 1000);
  const isExpired = claims?.exp
    ? claims.exp - ACCESS_EXPIRY_SKEW_SECONDS <= now
    : true;

  if (claims && !isExpired) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
    const target = isAuthRoute(request) ? "/" : callbackUrl;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isExpired && request.cookies.has(REFRESH_COOKIE)) {
    const apiBaseUrl = process.env.API_BASE_URL;
    if (apiBaseUrl) {
      const refreshRes = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: { cookie: request.headers.get("cookie") ?? "" },
      });
      const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
      const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

      if (refreshRes.ok && accessToken && refreshToken) {
        // Make the rotated tokens visible to this request's Server Components.
        request.cookies.set(ACCESS_COOKIE, accessToken);
        request.cookies.set(REFRESH_COOKIE, refreshToken);
        const response = NextResponse.next({
          headers: request.headers,
        });
        // Persist the same rotated pair in the browser.
        response.cookies.set(ACCESS_COOKIE, accessToken, COOKIE_OPTS);
        response.cookies.set(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
        return response;
      }
    }
  }

  if (isAuthRoute(request)) {
    const response = NextResponse.next();
    clearAuthCookies(response);
    return response;
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  const res = NextResponse.redirect(loginUrl);
  clearAuthCookies(res);
  return res;
}

export const config = {
  matcher: [
    "/",
    "/products/:path*",
    "/categories/:path*",
    "/cart",
    "/checkout",
    "/orders",
    "/dashboard/:path*",
    "/login",
    "/register",
  ],
};
