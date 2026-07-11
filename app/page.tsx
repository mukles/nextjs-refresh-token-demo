import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, decodeAccessToken } from "@/lib/auth";

export default async function Home() {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  const claims = decodeAccessToken(token);
  redirect(claims ? "/dashboard" : "/login");
}
