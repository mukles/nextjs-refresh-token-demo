import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import { API_BASE_URL } from "@/lib/auth/server/constants";
import {
  clearAuthCookies,
  readAuthTokens,
  setAuthCookies,
} from "@/lib/auth/server/session";

type RouteContext = { params: Promise<{ path: string[] }> };

const RESPONSE_HEADERS = ["cache-control", "content-type"];

const REFRESH_PATHS = new Set(["auth/refresh", "auth/logout"]);

const TOKEN_ISSUING_PATHS = new Set([
  "auth/login",
  "auth/verify-otp",
  "auth/refresh",
]);

function unavailable() {
  return NextResponse.json(
    { error: "Backend API is unavailable", code: "API_UNAVAILABLE" },
    { status: 503 },
  );
}

const TOKEN_FIELDS = [
  "access_token",
  "refresh_token",
  "accessToken",
  "refreshToken",
  "tokens",
];

function withoutTokens(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  return Object.fromEntries(
    Object.entries(payload as Record<string, unknown>).filter(
      ([key]) => !TOKEN_FIELDS.includes(key),
    ),
  );
}

async function forward(request: NextRequest, context: RouteContext) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "API_BASE_URL is not configured" },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  const route = path.join("/");
  const requestUrl = new URL(request.url);
  const target = new URL(
    `${API_BASE_URL.replace(/\/$/, "")}/${path.map(encodeURIComponent).join("/")}`,
  );
  target.search = requestUrl.search;

  const headers = new Headers();
  for (const name of ["accept", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  // Access token goes in the header; the refresh token goes in the body. The
  // browser never holds either, so this route supplies them from the cookies.
  let body: BodyInit | undefined;
  if (REFRESH_PATHS.has(route)) {
    headers.set("content-type", "application/json");
    body = JSON.stringify({
      refresh_token: request.cookies.get(REFRESH_COOKIE)?.value,
    });
  } else {
    const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
    if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer();
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return unavailable();
  }

  const responseHeaders = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  if (TOKEN_ISSUING_PATHS.has(route) || route === "auth/logout") {
    const payload: unknown = await upstream.json().catch(() => null);
    const tokens = upstream.ok ? readAuthTokens(payload) : null;
    const response = NextResponse.json(withoutTokens(payload) ?? {}, {
      status: upstream.status,
      headers: responseHeaders,
    });

    if (tokens) setAuthCookies(response, tokens);
    else if (route === "auth/logout" || upstream.status === 401) {
      clearAuthCookies(response);
    }
    return response;
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
