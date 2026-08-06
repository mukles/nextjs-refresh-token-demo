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

export async function proxy(request: NextRequest) {
  const claims = decodeAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);

  const now = Math.floor(Date.now() / 1000);
  const isExpired = claims?.exp
    ? claims.exp - ACCESS_EXPIRY_SKEW_SECONDS <= now
    : true;

  if (claims && !isExpired) {
    return NextResponse.next();
  }

  if (isExpired) {
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
        const response = NextResponse.next({
          request: { headers: request.headers },
        });
        // Persist the same rotated pair in the browser.
        response.cookies.set(ACCESS_COOKIE, accessToken, COOKIE_OPTS);
        response.cookies.set(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
        return response;
      }
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
