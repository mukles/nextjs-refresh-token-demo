import type { ApiErrorResponse, VerifyOtpResponse } from "../types";
import { backendFetch } from "@/lib/backend-client";

async function postJson<T>(
  url: string,
  body: unknown,
): Promise<{ ok: boolean; data: T }> {
  const res = await backendFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T;
  return { ok: res.ok, data };
}

export function sendOtp(mobileNumber: string) {
  return postJson<ApiErrorResponse>("/auth/send-otp", { mobileNumber });
}

export function verifyOtp(mobileNumber: string, otp: string) {
  return postJson<VerifyOtpResponse>("/auth/verify-otp", {
    mobileNumber,
    otp,
  });
}
