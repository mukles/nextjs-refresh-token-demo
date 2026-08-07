export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14"
      aria-label="Loading orders"
      aria-busy="true"
    >
      <div className="h-4 w-36 animate-pulse rounded bg-orange-100" />
      <div className="mt-3 h-10 w-56 animate-pulse rounded bg-stone-100" />
      <div className="mt-10 space-y-5">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-2xl bg-stone-100"
          />
        ))}
      </div>
    </main>
  );
}
