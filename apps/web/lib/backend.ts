import { logger } from "@/lib/logger";

export type BackendTransport = (
  path: string,
  init?: RequestInit,
) => Promise<Response>;

type BackendErrorOptions = {
  status?: number;
  code?: string;
  cause?: unknown;
};

export class BackendError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, options: BackendErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "BackendError";
    this.status = options.status;
    this.code = options.code;
  }
}

export type BackendResult<T> =
  | { ok: true; status: number; data: T; error: null }
  | { ok: false; status: number; data: null; error: BackendError };

export function createBackendTransport(
  baseUrl: string,
  defaults: RequestInit = {},
): BackendTransport {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  return async (path, init) => {
    const method = init?.method ?? defaults.method ?? "GET";
    const startedAt = performance.now();
    try {
      const response = await fetch(
        `${normalizedBaseUrl}${path.startsWith("/") ? path : `/${path}`}`,
        {
          ...defaults,
          ...init,
          headers: {
            ...defaults.headers,
            ...init?.headers,
          },
        },
      );
      const details = {
        method: method.toUpperCase(),
        path,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
      };
      if (response.status >= 400)
        logger.warn("API", "Request completed", details);
      else logger.info("API", "Request completed", details);
      return response;
    } catch (cause) {
      logger.error("API", "Request failed", {
        method: method.toUpperCase(),
        path,
        status: 503,
        durationMs: Math.round(performance.now() - startedAt),
      });
      throw new BackendError("Backend API is unavailable", {
        status: 503,
        code: "API_UNAVAILABLE",
        cause,
      });
    }
  };
}

export async function readBackendJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new BackendError("Backend returned an invalid response", {
      status: response.status,
      code: "INVALID_RESPONSE",
      cause,
    });
  }
}

export async function backendErrorFromResponse(
  response: Response,
  fallback = `Backend request failed (${response.status})`,
): Promise<BackendError> {
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
    error?: string;
    code?: string;
  };
  const message = Array.isArray(payload.message)
    ? payload.message.join(", ")
    : (payload.message ?? payload.error ?? fallback);
  return new BackendError(message, {
    status: response.status,
    code: payload.code,
  });
}

export function backendErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function backendResultFromResponse<T>(
  response: Response,
  fallback?: string,
): Promise<BackendResult<T>> {
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: null,
      error: await backendErrorFromResponse(response, fallback),
    };
  }

  try {
    return {
      ok: true,
      status: response.status,
      data: await readBackendJson<T>(response),
      error: null,
    };
  } catch (error) {
    const backendError =
      error instanceof BackendError
        ? error
        : new BackendError("Backend returned an invalid response", {
            status: response.status,
            code: "INVALID_RESPONSE",
            cause: error,
          });
    return {
      ok: false,
      status: response.status,
      data: null,
      error: backendError,
    };
  }
}

export async function backendFetch<T>(
  transport: BackendTransport,
  path: string,
  init?: RequestInit,
  fallback?: string,
): Promise<BackendResult<T>> {
  try {
    return await backendResultFromResponse<T>(
      await transport(path, init),
      fallback,
    );
  } catch (error) {
    const backendError =
      error instanceof BackendError
        ? error
        : new BackendError(fallback ?? "Backend request failed", {
            code: "REQUEST_FAILED",
            cause: error,
          });
    return {
      ok: false,
      status: backendError.status ?? 500,
      data: null,
      error: backendError,
    };
  }
}
