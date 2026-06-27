export type AutoRefreshResult = {
  res: Response;
  didRefresh: boolean;
};

export async function fetchWithAutoRefresh(
  url: string,
  init?: RequestInit,
): Promise<AutoRefreshResult> {
  let res = await fetch(url, init);
  if (res.status !== 401) return { res, didRefresh: false };

  const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
  if (!refreshRes.ok) {
    return { res: refreshRes, didRefresh: false };
  }

  res = await fetch(url, init);
  return { res, didRefresh: true };
}
