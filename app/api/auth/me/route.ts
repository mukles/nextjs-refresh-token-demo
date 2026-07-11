import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, decodeAccessToken } from "@/lib/auth";
import { apiClientFetch } from "@/lib/api-client";
import type { StudentProfile } from "@/app/api/students/profile/route";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Access token missing or expired." },
      { status: 401 },
    );
  }

  // Validate the token against the external backend (RS256 — we cannot verify locally)
  const backendRes = await apiClientFetch("/students/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: "Access token missing or expired." },
      { status: 401 },
    );
  }

  const profile = (await backendRes.json()) as StudentProfile;
  const claims = decodeAccessToken(accessToken);

  return NextResponse.json({
    user: {
      id: profile._id,
      name: profile.name,
      mobile: profile.mobileNumber,
    },
    accessTokenExpiresAt: claims?.exp
      ? new Date(claims.exp * 1000).toISOString()
      : null,
  });
}
