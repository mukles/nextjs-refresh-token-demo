import { NextResponse, type NextRequest } from "next/server";
import { findRefreshToken, revokeFamily } from "@/lib/db";
import { REFRESH_COOKIE, clearAuthCookies } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const presented = req.cookies.get(REFRESH_COOKIE)?.value;

  if (presented) {
    const record = await findRefreshToken(presented);
    if (record) await revokeFamily(record.familyId);
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
