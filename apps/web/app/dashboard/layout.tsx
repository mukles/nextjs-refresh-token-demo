import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { AuthProvider } from "@/features/auth/auth-context";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { decodeAccessToken } from "@/lib/auth/server/session";
import { AccessTokenCountdown } from "./_components/access-token-countdown";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const expiresAt = decodeAccessToken(accessToken)?.exp ?? null;

  return (
    <AuthProvider>
      <SiteHeader />
      {children}
      <AccessTokenCountdown initialExpiresAt={expiresAt} />
    </AuthProvider>
  );
}
