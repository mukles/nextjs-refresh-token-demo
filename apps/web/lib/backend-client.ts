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
