export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-16"
      aria-label="Loading page"
    >
      <div className="h-10 w-1/3 animate-pulse rounded-lg bg-stone-100" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-2xl bg-stone-100"
          />
        ))}
      </div>
    </main>
  );
}
