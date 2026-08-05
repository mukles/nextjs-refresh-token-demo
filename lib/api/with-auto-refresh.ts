import "server-only";
import { apiClientFetch } from "./client";
import { getAccessToken } from "./get-access-token";
import { setAccessToken } from "./set-access-token";
import type { AutoRefreshResult, RefreshResponse } from "./types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080/api/v1";

const REFRESH_PATH = "/auth/student/refresh";

export async function fetchWithAutoRefresh(
  path: string,
  init?: RequestInit,
): Promise<AutoRefreshResult> {
  const accessToken = await getAccessToken();
  let res = await apiClientFetch(path, init, accessToken);

  if (res.status !== 401 || !accessToken) {
    return { res, didRefresh: false };
  }

  const refreshRes = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!refreshRes.ok) {
    return { res: refreshRes, didRefresh: false };
  }

  const { accessToken: newAccessToken } =
    (await refreshRes.json()) as RefreshResponse;

  await setAccessToken(newAccessToken);

  res = await apiClientFetch(path, init, newAccessToken);
  return { res, didRefresh: true };
}
