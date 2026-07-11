"use server";
import "server-only";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080/api/v1";

export type AutoRefreshResult = {
  res: Response;
  didRefresh: boolean;
};

export async function apiClientFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  return fetch(url, {
    ...init,
    credentials: init?.credentials ?? "include",
  });
}

export async function fetchWithAutoRefresh(
  path: string,
  init?: RequestInit,
  cookieHeader?: string,
): Promise<AutoRefreshResult> {
  let res = await apiClientFetch(path, init);
  if (res.status !== 401) return { res, didRefresh: false };

  const refreshRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/refresh`,
    {
      method: "POST",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    },
  );
  if (!refreshRes.ok) {
    return { res: refreshRes, didRefresh: false };
  }

  res = await apiClientFetch(path, init);
  return { res, didRefresh: true };
}

export type SendOtpResponse = {
  success: boolean;
  storedOtp: string;
  profileCompleted: boolean;
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
};

export async function sendOtp(mobileNumber: string): Promise<SendOtpResponse> {
  const res = await apiClientFetch("/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobileNumber }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to send OTP",
    );
  }
  return res.json() as Promise<SendOtpResponse>;
}

export async function verifyOtp(
  mobileNumber: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  const res = await apiClientFetch("/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobileNumber, otp }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "OTP verification failed",
    );
  }
  return res.json() as Promise<VerifyOtpResponse>;
}
