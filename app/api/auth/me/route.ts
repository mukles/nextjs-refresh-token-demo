import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, verifyAccessToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const claims = await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value);
  if (!claims) {
    return NextResponse.json(
      { error: "Access token missing or expired." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    user: { id: claims.sub, email: claims.email, name: claims.name },
    accessTokenExpiresAt: claims.exp,
  });
}
