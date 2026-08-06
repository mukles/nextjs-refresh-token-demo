import "server-only";

import { cookies } from "next/headers";
import { createBackendTransport } from "@/lib/backend";
import { API_BASE_URL } from "@/lib/auth/server/constants";

export async function createServerBackendTransport() {
  if (!API_BASE_URL) throw new Error("API_BASE_URL is not configured");

  const cookieHeader = (await cookies()).toString();
  return createBackendTransport(API_BASE_URL, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}
