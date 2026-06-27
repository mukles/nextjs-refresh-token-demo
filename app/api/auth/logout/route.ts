import { NextResponse, type NextRequest } from "next/server";
import { refreshTokens, revokeFamily } from "@/lib/db";
import { REFRESH_COOKIE, clearAuthCookies } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const presented = req.cookies.get(REFRESH_COOKIE)?.value;

  if (presented) {
    const record = refreshTokens.get(presented);
    if (record) revokeFamily(record.familyId);
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
