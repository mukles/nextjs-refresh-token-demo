import "server-only";

import { apiClientFetch } from "@/lib/api/client";

type BackendEnvelope<T> = { data: T; message?: string };

async function expectJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Backend request failed with status ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

export { apiClientFetch };

export async function sendOtp(mobileNumber: string) {
  return expectJson<BackendEnvelope<unknown>>(
    await apiClientFetch("/auth/student/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber }),
    }),
  );
}

export async function verifyOtp(mobileNumber: string, otp: string) {
  return expectJson<
    BackendEnvelope<{ accessToken: string; refreshToken: string }>
  >(
    await apiClientFetch("/auth/student/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber, otp }),
    }),
  );
}
