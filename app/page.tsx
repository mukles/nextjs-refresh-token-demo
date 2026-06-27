import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, verifyAccessToken } from "@/lib/auth";

export default async function Home() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const claims = await verifyAccessToken(token);
  redirect(claims ? "/dashboard" : "/login");
}
