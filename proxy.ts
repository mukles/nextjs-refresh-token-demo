import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAccessCookie,
  setRefreshCookie,
  signAccessToken,
  verifyAccessToken,
} from "@/lib/auth";
import { findUserById } from "@/lib/db";
import { rotateRefreshToken } from "@/lib/tokens";

export async function proxy(req: NextRequest) {
  const claims = await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value);

  if (claims) return NextResponse.next();

  const presented = req.cookies.get(REFRESH_COOKIE)?.value;
  const rotation = presented
    ? rotateRefreshToken(presented)
    : ({ status: "invalid" } as const);

  console.log({ rotation });

  if (rotation.status === "rotated") {
    const user = findUserById(rotation.userId);
    if (user) {
      const accessToken = await signAccessToken(user);

      req.cookies.set(ACCESS_COOKIE, accessToken);
      const res = NextResponse.next({ request: { headers: req.headers } });

      setAccessCookie(res, accessToken);
      setRefreshCookie(res, rotation.next.token);
      return res;
    }
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", req.nextUrl.pathname);
  const res = NextResponse.redirect(loginUrl);
  clearAuthCookies(res);
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
