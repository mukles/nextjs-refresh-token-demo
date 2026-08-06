export default function ProductDetailsLoading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12"
      aria-label="Loading product details"
      aria-busy="true"
    >
      <span className="sr-only">Loading product details…</span>
      <div className="mb-7 h-5 w-32 animate-pulse rounded bg-stone-100" />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square animate-pulse rounded-3xl bg-stone-100" />
        <div className="py-2">
          <div className="h-4 w-40 animate-pulse rounded bg-orange-100" />
          <div className="mt-4 h-12 w-4/5 animate-pulse rounded-xl bg-stone-100" />
          <div className="mt-5 h-9 w-48 animate-pulse rounded-lg bg-stone-100" />
          <div className="mt-8 space-y-3">
            <div className="h-5 w-full animate-pulse rounded bg-stone-100" />
            <div className="h-5 w-11/12 animate-pulse rounded bg-stone-100" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-stone-100" />
          </div>
          <div className="mt-7 h-5 w-44 animate-pulse rounded bg-emerald-50" />
          <div className="mt-8 h-10 w-32 animate-pulse rounded-lg bg-stone-100" />
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="h-12 animate-pulse rounded-xl bg-orange-100" />
            <div className="h-12 animate-pulse rounded-xl bg-orange-200" />
          </div>
        </div>
      </div>

      <section className="mt-20 border-t border-stone-200 pt-12">
        <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-stone-100" />
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-4">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl border border-stone-100 bg-stone-50"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-stone-100" />
        </div>
      </section>
    </main>
  );
}
