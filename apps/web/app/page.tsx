import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";

export default async function Home() {
  const jar = await cookies();
  const hasSession = jar.has(ACCESS_COOKIE) || jar.has(REFRESH_COOKIE);
  redirect(hasSession ? "/dashboard" : "/login");
}
