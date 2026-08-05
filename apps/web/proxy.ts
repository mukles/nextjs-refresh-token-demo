import { NextResponse, type NextRequest } from "next/server";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

export function proxy(request: NextRequest) {
  if (
    request.cookies.has(ACCESS_COOKIE) ||
    request.cookies.has(REFRESH_COOKIE)
  ) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
