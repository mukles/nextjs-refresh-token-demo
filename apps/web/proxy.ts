import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookies, decodeAccessToken } from "./lib/auth/server/session";
import {
  ACCESS_COOKIE,
  ACCESS_EXPIRY_SKEW_SECONDS,
  REFRESH_COOKIE,
  COOKIE_OPTS,
} from "./lib/auth/constants";

function readResponseCookie(response: Response, name: string) {
  for (const header of response.headers.getSetCookie()) {
    const pair = header.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator === -1 || pair.slice(0, separator) !== name) continue;
    return decodeURIComponent(pair.slice(separator + 1));
  }
  return undefined;
}

function isAuthRoute(request: NextRequest) {
  return (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register"
  );
}

function safeCallbackUrl(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  if (
    !callbackUrl?.startsWith("/") ||
    callbackUrl.startsWith("//") ||
    callbackUrl.includes("\\") ||
    callbackUrl.startsWith("/login") ||
    callbackUrl.startsWith("/register")
  ) {
    return "/";
  }
  return callbackUrl;
}

function authenticatedResponse(request: NextRequest) {
  return isAuthRoute(request)
    ? NextResponse.redirect(new URL(safeCallbackUrl(request), request.url))
    : NextResponse.next({ request: { headers: request.headers } });
}

export async function proxy(request: NextRequest) {
  const claims = decodeAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);

  const now = Math.floor(Date.now() / 1000);
  const isExpired = claims?.exp
    ? claims.exp - ACCESS_EXPIRY_SKEW_SECONDS <= now
    : true;

  if (claims && !isExpired) {
    return authenticatedResponse(request);
  }

  if (isExpired && request.cookies.has(REFRESH_COOKIE)) {
    const apiBaseUrl = process.env.API_BASE_URL;
    if (apiBaseUrl) {
      const refreshRes = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: { cookie: request.headers.get("cookie") ?? "" },
      });
      const accessToken = readResponseCookie(refreshRes, ACCESS_COOKIE);
      const refreshToken = readResponseCookie(refreshRes, REFRESH_COOKIE);

      if (refreshRes.ok && accessToken && refreshToken) {
        // Make the rotated tokens visible to this request's Server Components.
        request.cookies.set(ACCESS_COOKIE, accessToken);
        request.cookies.set(REFRESH_COOKIE, refreshToken);
        const response = authenticatedResponse(request);
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
    "/dashboard/:path*",
    "/login",
    "/register",
  ],
};
