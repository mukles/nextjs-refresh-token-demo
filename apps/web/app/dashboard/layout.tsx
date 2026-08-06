import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { decodeAccessToken } from "@/lib/auth/server/session";
import { AccessTokenCountdown } from "@/components/access-token-countdown";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const expiresAt = decodeAccessToken(accessToken)?.exp ?? null;

  return (
    <>
      <SiteHeader />
      {children}
      <AccessTokenCountdown initialExpiresAt={expiresAt} />
    </>
  );
}
