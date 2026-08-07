import { getServerProfile } from "@/lib/auth/server/student-profile";
import { ServerProfile } from "../server/_components/server-profile";

const RENDER_DELAY_MS = 5_000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function SlowServerProfilePage() {
  const renderStartedAt = new Date();
  await wait(RENDER_DELAY_MS);
  const profileRequestedAt = new Date();
  const result = await getServerProfile();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Next.js Server Component · 5-second render delay
        </p>
        <h1 className="text-2xl font-semibold">Slow server-rendered profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Proxy checks the access token first. This page then waits five seconds
          on the server before calling the real student profile API.
        </p>
      </div>

      <dl className="grid gap-2 rounded-xl border bg-muted/30 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Render started</dt>
          <dd className="font-mono">{renderStartedAt.toISOString()}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Profile API requested</dt>
          <dd className="font-mono">{profileRequestedAt.toISOString()}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">API status</dt>
          <dd className="font-mono">{result.status}</dd>
        </div>
      </dl>

      <ServerProfile result={result} />
    </main>
  );
}
