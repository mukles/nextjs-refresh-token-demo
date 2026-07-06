import { headers } from "next/headers";
import { apiClientFetch } from "@/lib/api-client";
import { DashboardClient } from "./_components/dashobard-client-page";

type MeApiResponse = {
  user: { id: string; email: string; name: string };
  accessTokenExpiresAt: number;
};

type SessionApiResponse = {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
};

function readJsonSafely<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return Promise.resolve(null);
  return res.json().catch(() => null);
}

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export default async function DashboardPage() {
  const h = await headers();
  const cookieHeader = h.get("cookie") ?? "";
  const baseUrl = await getBaseUrl();

  const meRes = await apiClientFetch(`${baseUrl}/api/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  const sessionRes = await apiClientFetch(`${baseUrl}/api/auth/session`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  const me = await readJsonSafely<MeApiResponse>(meRes);

  const session = await readJsonSafely<SessionApiResponse>(sessionRes);

  return (
    <>
      <section className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-3 px-6 text-sm">
        <div className="rounded-md border p-3">
          <p className="font-medium">Render-time API 1: /api/auth/me</p>
          <p className="text-muted-foreground">
            {meRes.ok && me?.user
              ? `User: ${me.user.name} (${me.user.email})`
              : "No authenticated user from render-time call."}
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="font-medium">Render-time API 2: /api/auth/session</p>
          <p className="text-muted-foreground">
            {session
              ? `hasAccessToken=${String(session.hasAccessToken)}, hasRefreshToken=${String(session.hasRefreshToken)}`
              : "Session info unavailable."}
          </p>
        </div>
      </section>
      <DashboardClient />
    </>
  );
}
