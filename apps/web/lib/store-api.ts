"use client";

import { backendErrorFromResponse, readBackendJson } from "@/lib/backend";
import { backendFetchWithAutoRefresh } from "@/lib/backend-client";

const STORE_READ_RETRY_DELAYS = [500, 1000, 1500];

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function isReadRequest(init?: RequestInit) {
  return !init?.method || init.method.toUpperCase() === "GET";
}

async function retryUnavailableRead(
  request: () => Promise<{ res: Response }>,
  initialResponse: Response,
) {
  let response = initialResponse;

  for (const delay of STORE_READ_RETRY_DELAYS) {
    if (response.status !== 503) break;
    await wait(delay);
    response = (await request()).res;
  }

  return response;
}

export async function storeRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const request = () =>
    backendFetchWithAutoRefresh(`/store${path}`, {
      ...init,
      headers: init?.body
        ? { "Content-Type": "application/json", ...init.headers }
        : init?.headers,
    });

  let { res } = await request();
  if (isReadRequest(init)) res = await retryUnavailableRead(request, res);

  if (!res.ok)
    throw await backendErrorFromResponse(res, "Store request failed");
  return readBackendJson<T>(res);
}
