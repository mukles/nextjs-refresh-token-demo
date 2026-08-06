import { getServerProfile } from "@/lib/auth/server/student-profile";
import { ServerProfile } from "./_components/server-profile";

export default async function ServerProfilePage() {
  const result = await getServerProfile();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Next.js Server Component
        </p>
        <h1 className="text-2xl font-semibold">Server-rendered profile</h1>
      </div>

      <ServerProfile result={result} />
    </main>
  );
}
