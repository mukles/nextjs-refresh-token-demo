export default function DashboardLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6"
      aria-label="Loading dashboard page"
      aria-busy="true"
    >
      <span className="sr-only" role="status">
        Loading dashboard page…
      </span>

      <div>
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-8 w-72 max-w-full animate-pulse rounded-lg bg-muted" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-7 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </main>
  );
}
