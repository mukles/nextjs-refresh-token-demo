import type { ApiErrorResponse, VerifyOtpResponse } from "../types";

async function postJson<T>(
  url: string,
  body: unknown,
): Promise<{ ok: boolean; data: T }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T;
  return { ok: res.ok, data };
}

export function sendOtp(mobileNumber: string) {
  return postJson<ApiErrorResponse>("/api/auth/send-otp", { mobileNumber });
}

export function verifyOtp(mobileNumber: string, otp: string) {
  return postJson<VerifyOtpResponse>("/api/auth/verify-otp", {
    mobileNumber,
    otp,
  });
}
