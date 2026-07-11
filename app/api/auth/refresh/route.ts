import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAccessCookie,
  setRefreshCookie,
} from "@/lib/auth";

export const runtime = "nodejs";

function parseCookieValue(setCookieHeader: string): string {
  return setCookieHeader.split(";")[0].split("=").slice(1).join("=");
}

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token." }, { status: 401 });
  }

  let backendRes: Response;
  try {
    const url = `${process.env.API_BASE_URL}/auth/student/refresh`;

    backendRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
  } catch {
    const res = NextResponse.json(
      { error: "Failed to reach auth service." },
      { status: 502 },
    );
    clearAuthCookies(res);
    return res;
  }

  if (!backendRes.ok) {
    const body = await backendRes.json().catch(() => ({}));
    console.error("[refresh] Backend rejected token:", body);
    const res = NextResponse.json(
      { error: "Session expired. Please log in again." },
      { status: 401 },
    );
    clearAuthCookies(res);
    return res;
  }

  const setCookieHeaders =
    backendRes.headers.getSetCookie?.() ??
    (backendRes.headers.get("set-cookie")
      ? [backendRes.headers.get("set-cookie")!]
      : []);

  const accessCookieHeader = setCookieHeaders.find((h) =>
    h.startsWith(`${ACCESS_COOKIE}=`),
  );
  const refreshCookieHeader = setCookieHeaders.find((h) =>
    h.startsWith(`${REFRESH_COOKIE}=`),
  );

  if (accessCookieHeader && refreshCookieHeader) {
    const res = NextResponse.json({ refreshed: true });
    setAccessCookie(res, parseCookieValue(accessCookieHeader));
    setRefreshCookie(res, parseCookieValue(refreshCookieHeader));
    return res;
  }

  const raw = await backendRes.json().catch(() => ({}));

  const accessToken: string | undefined =
    raw?.data?.accessToken ?? raw?.accessToken;
  const newRefreshToken: string | undefined =
    raw?.data?.refreshToken ?? raw?.refreshToken;

  if (!accessToken || !newRefreshToken) {
    console.error("[refresh] Unexpected backend response shape:", raw);
    console.error(
      "[refresh] Set-Cookie headers from backend:",
      setCookieHeaders,
    );
    const res = NextResponse.json(
      { error: "Invalid token response from auth service." },
      { status: 502 },
    );
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ refreshed: true });
  setAccessCookie(res, accessToken);
  setRefreshCookie(res, newRefreshToken);
  return res;
}

export async function DELETE(_req: NextRequest) {
  const res = NextResponse.json({ success: true });
  clearAuthCookies(res);
  return res;
}
