import { headers } from "next/headers";
import { apiClientFetch } from "@/lib/api-client";

export default async function DashboardPage() {
  const h = await headers();
  const cookieHeader = h.get("cookie") ?? "";

  const meRes = await apiClientFetch("/api/auth/me", {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  const sessionRes = await apiClientFetch("/api/auth/session", {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  return (
    <>
      {/* <section className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-3 px-6 text-sm">
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
      <DashboardClient /> */}
    </>
  );
}
