import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, verifyAccessToken } from "@/lib/auth";

export default async function Home() {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  const claims = await verifyAccessToken(token);
  redirect(claims ? "/dashboard" : "/login");
}
