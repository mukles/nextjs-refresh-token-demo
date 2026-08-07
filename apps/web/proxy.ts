import { NextResponse, type NextRequest } from "next/server";
import {
  clearAuthCookies,
  decodeAccessToken,
  setAuthCookies,
} from "./lib/auth/server/session";
import {
  ACCESS_COOKIE,
  ACCESS_EXPIRY_SKEW_SECONDS,
  DEFAULT_REDIRECT,
  REDIRECT_PARAM,
  REFRESH_COOKIE,
} from "./lib/auth/constants";
import { API_BASE_URL } from "./lib/auth/server/constants";

function isAuthRoute(request: NextRequest) {
  const publicRoutes = ["/login", "/register"];
  return publicRoutes.some((path) => request.nextUrl.pathname === path);
}

function signedInDestination(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get(REDIRECT_PARAM) ?? "/";
  const isInternal = requested.startsWith("/");
  return isInternal ? requested : DEFAULT_REDIRECT;
}

async function rotateTokens(refreshToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = await response.json();
    if (!body?.access_token || !body.refresh_token) return null;
    return {
      accessToken: body.access_token as string,
      refreshToken: body.refresh_token as string,
      expiresIn: body.expires_in as number,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const claims = decodeAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);

  const now = Math.floor(Date.now() / 1000);
  const isExpired = claims?.exp
    ? claims.exp - ACCESS_EXPIRY_SKEW_SECONDS <= now
    : true;

  if (claims && !isExpired) {
    if (isAuthRoute(request)) {
      return NextResponse.redirect(
        new URL(signedInDestination(request), request.url),
      );
    }
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (isExpired && refreshToken) {
    const tokens = await rotateTokens(refreshToken);
    if (tokens) {
      // Make the rotated tokens visible to this request's Server Components.
      request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
      request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
      const response = NextResponse.next({
        request: { headers: request.headers },
      });
      // Persist the same rotated pair in the browser.
      setAuthCookies(response, tokens);
      return response;
    }
  }

  if (isAuthRoute(request)) {
    const response = NextResponse.next();
    clearAuthCookies(response);
    return response;
  }

  const loginUrl = new URL("/login", request.url);
  const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  // "/" is where sign-in already goes, so round-tripping it just adds noise.
  if (destination !== "/") {
    loginUrl.searchParams.set(REDIRECT_PARAM, destination);
  }
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
