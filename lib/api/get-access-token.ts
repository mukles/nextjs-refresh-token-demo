import "server-only";
import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "access_token";
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}
