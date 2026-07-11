import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const hasAccessToken = Boolean(req.cookies.get(ACCESS_COOKIE)?.value);
  const hasRefreshToken = Boolean(req.cookies.get(REFRESH_COOKIE)?.value);

  console.log({
    hasAccessToken,
    hasRefreshToken,
  });

  return NextResponse.json({
    hasAccessToken,
    hasRefreshToken,
  });
}
