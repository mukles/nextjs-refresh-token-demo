export function ProductGridSkeleton() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
      aria-label="Loading products"
      aria-busy="true"
    >
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-orange-100" />
          <div className="h-10 w-72 max-w-full animate-pulse rounded-lg bg-stone-100" />
          <div className="h-5 w-96 max-w-full animate-pulse rounded bg-stone-100" />
        </div>
        <div className="grid gap-3 sm:grid-cols-[224px_180px_80px]">
          <div className="h-11 animate-pulse rounded-xl bg-stone-100" />
          <div className="h-11 animate-pulse rounded-xl bg-stone-100" />
          <div className="h-11 animate-pulse rounded-xl bg-orange-100" />
        </div>
      </div>
      <div className="mb-5 h-4 w-28 animate-pulse rounded bg-stone-100" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
          >
            <div className="aspect-[4/3] animate-pulse bg-stone-100" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-4/5 animate-pulse rounded bg-stone-100" />
              <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
              <div className="h-10 animate-pulse rounded-lg bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
