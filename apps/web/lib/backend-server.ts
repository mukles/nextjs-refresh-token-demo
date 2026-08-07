import "server-only";

import { cookies } from "next/headers";
import { connection } from "next/server";
import { createBackendTransport } from "@/lib/backend";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { API_BASE_URL } from "@/lib/auth/server/constants";

export async function createServerBackendTransport() {
  await connection();
  if (!API_BASE_URL) throw new Error("API_BASE_URL is not configured");

  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  return createBackendTransport(API_BASE_URL, {
    cache: "no-store",
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
  });
}
