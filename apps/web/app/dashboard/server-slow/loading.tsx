export default function SlowServerProfileLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6"
      aria-label="Loading slow server-rendered profile"
      aria-busy="true"
    >
      <div>
        <p className="text-sm text-muted-foreground">
          Next.js Server Component · 5-second render delay
        </p>
        <h1 className="text-2xl font-semibold">Slow server-rendered profile</h1>
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          Waiting on the server before requesting the profile API…
        </p>
      </div>

      <div className="grid gap-2 rounded-xl border bg-muted/30 p-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex justify-between gap-4 py-1">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index}>
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-5 w-44 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
