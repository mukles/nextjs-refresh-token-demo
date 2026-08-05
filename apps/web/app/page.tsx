import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

export default async function Home() {
  const jar = await cookies();
  const hasSession = jar.has(ACCESS_COOKIE) || jar.has(REFRESH_COOKIE);
  redirect(hasSession ? "/dashboard" : "/login");
}
