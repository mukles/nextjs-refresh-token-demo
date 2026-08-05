import "server-only";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "./get-access-token";

export async function setAccessToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
