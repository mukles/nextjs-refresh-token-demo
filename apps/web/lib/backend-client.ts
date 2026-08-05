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
  let res = await backendFetch(path, init);
  if (res.status !== 401) return { res, didRefresh: false };

  const refreshResponse = await refreshSession();
  if (!refreshResponse.ok) {
    return { res: refreshResponse, didRefresh: false };
  }

  res = await backendFetch(path, init);
  return { res, didRefresh: true };
}
