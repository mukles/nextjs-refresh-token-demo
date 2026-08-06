import { expect, test } from "@playwright/test";
import { backendFetch } from "../lib/backend";
import { backendFetchWithAutoRefresh } from "../lib/backend-client";

test("simultaneous 401 responses share one refresh request", async () => {
  const originalFetch = globalThis.fetch;
  let protectedCalls = 0;
  let refreshCalls = 0;

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/auth/refresh")) {
      refreshCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 25));
      return new Response(null, { status: 200 });
    }
    protectedCalls += 1;
    return new Response(null, { status: protectedCalls <= 2 ? 401 : 200 });
  };

  try {
    const results = await Promise.all([
      backendFetchWithAutoRefresh("/auth/me"),
      backendFetchWithAutoRefresh("/students/profile"),
    ]);
    expect(results.map(({ res }) => res.status)).toEqual([200, 200]);
    expect(refreshCalls).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("network failures become a stable API_UNAVAILABLE response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("network offline");
  };
  try {
    const { res, didRefresh } = await backendFetchWithAutoRefresh("/auth/me");
    expect(res.status).toBe(503);
    expect(didRefresh).toBe(false);
    await expect(res.json()).resolves.toMatchObject({
      code: "API_UNAVAILABLE",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("common requests return the same typed result schema", async () => {
  const success = await backendFetch<{ value: number }>(
    async () => Response.json({ value: 42 }),
    "/example",
  );
  expect(success).toEqual({
    ok: true,
    status: 200,
    data: { value: 42 },
    error: null,
  });

  const failure = await backendFetch(
    async () =>
      Response.json(
        { message: "Not allowed", code: "FORBIDDEN" },
        { status: 403 },
      ),
    "/example",
  );
  expect(failure.ok).toBe(false);
  if (failure.ok) return;
  expect(failure.status).toBe(403);
  expect(failure.data).toBeNull();
  expect(failure.error).toMatchObject({
    message: "Not allowed",
    code: "FORBIDDEN",
    status: 403,
  });
});
