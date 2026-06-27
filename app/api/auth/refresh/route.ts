import { NextResponse, type NextRequest } from "next/server";
import { findUserById } from "@/lib/db";
import { rotateRefreshToken } from "@/lib/tokens";
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAccessCookie,
  setRefreshCookie,
  signAccessToken,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const presented = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!presented) {
    return NextResponse.json({ error: "No refresh token." }, { status: 401 });
  }

  const result = await rotateRefreshToken(presented);

  if (result.status === "reuse_detected") {
    const res = NextResponse.json(
      {
        error:
          "Refresh token reuse detected. Session revoked — please log in again.",
        code: "REUSE_DETECTED",
      },
      { status: 401 },
    );
    clearAuthCookies(res);
    return res;
  }

  if (result.status === "invalid") {
    const res = NextResponse.json(
      { error: "Invalid or expired refresh token." },
      { status: 401 },
    );
    clearAuthCookies(res);
    return res;
  }

  const user = await findUserById(result.userId);
  if (!user) {
    const res = NextResponse.json(
      { error: "User not found." },
      { status: 401 },
    );
    clearAuthCookies(res);
    return res;
  }

  const accessToken = await signAccessToken(user);
  const res = NextResponse.json({
    refreshed: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
  setAccessCookie(res, accessToken);
  setRefreshCookie(res, result.next.token);
  return res;
}
