import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { API_BASE_URL } from "@/lib/auth/server/constants";
import type { StudentProfile } from "@/lib/student-profile";

async function getServerProfile(): Promise<StudentProfile> {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) redirect("/login?from=/dashboard/server");
  if (!API_BASE_URL) throw new Error("API_BASE_URL is not configured");

  const response = await fetch(`${API_BASE_URL}/students/profile`, {
    headers: { cookie: `${ACCESS_COOKIE}=${encodeURIComponent(accessToken)}` },
    cache: "no-store",
  });
  if (response.status === 401) redirect("/login?from=/dashboard/server");
  if (!response.ok)
    throw new Error("Failed to load the server-rendered profile");
  return response.json() as Promise<StudentProfile>;
}

export default async function ServerProfilePage() {
  const profile = await getServerProfile();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Next.js Server Component
        </p>
        <h1 className="text-2xl font-semibold">Server-rendered profile</h1>
      </div>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <dl className="grid gap-3">
          <div>
            <dt className="text-sm text-muted-foreground">Name</dt>
            <dd className="font-medium">{profile.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Mobile</dt>
            <dd className="font-medium">{profile.mobileNumber}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Verified</dt>
            <dd className="font-medium">
              {profile.mobileVerified ? "Yes" : "No"}
            </dd>
          </div>
        </dl>
      </section>

      <Link className="text-sm font-medium underline" href="/dashboard">
        Back to client dashboard
      </Link>
    </main>
  );
}
