import { API_BASE_URL } from "@/lib/auth/server/constants";

type RouteContext = { params: Promise<{ path: string[] }> };

const RESPONSE_HEADERS = ["cache-control", "content-type"];

async function forward(request: Request, context: RouteContext) {
  if (!API_BASE_URL) {
    return Response.json(
      { error: "API_BASE_URL is not configured" },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  const requestUrl = new URL(request.url);
  const target = new URL(
    `${API_BASE_URL.replace(/\/$/, "")}/${path.map(encodeURIComponent).join("/")}`,
  );
  target.search = requestUrl.search;

  const headers = new Headers();
  for (const name of ["accept", "content-type", "cookie"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
    const responseHeaders = new Headers();
    for (const name of RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append("set-cookie", cookie);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { error: "Backend API is unavailable", code: "API_UNAVAILABLE" },
      { status: 503 },
    );
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
