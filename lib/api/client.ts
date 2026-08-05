import "server-only";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080/api/v1";

export async function apiClientFetch(
  path: string,
  init?: RequestInit,
  accessToken?: string,
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}
