export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export function backendFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...init?.headers,
    },
  });
}

let refreshInFlight: Promise<Response> | undefined;

function unavailableResponse() {
  return Response.json(
    { error: "Backend API is unavailable", code: "API_UNAVAILABLE" },
    { status: 503 },
  );
}

function refreshSession(): Promise<Response> {
  refreshInFlight ??= backendFetch("/auth/refresh", { method: "POST" }).finally(
    () => {
      refreshInFlight = undefined;
    },
  );
  return refreshInFlight;
}

export async function backendFetchWithAutoRefresh(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; didRefresh: boolean }> {
  let res: Response;
  try {
    res = await backendFetch(path, init);
  } catch {
    return { res: unavailableResponse(), didRefresh: false };
  }
  if (res.status !== 401) return { res, didRefresh: false };

  let refreshResponse: Response;
  try {
    refreshResponse = await refreshSession();
  } catch {
    return { res: unavailableResponse(), didRefresh: false };
  }
  if (!refreshResponse.ok) {
    return { res: refreshResponse, didRefresh: false };
  }

  try {
    res = await backendFetch(path, init);
  } catch {
    return { res: unavailableResponse(), didRefresh: false };
  }
  return { res, didRefresh: true };
}
