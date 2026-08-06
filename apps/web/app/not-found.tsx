import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
        404 error
      </p>
      <h1 className="mt-3 text-4xl font-black">We couldn&apos;t find that.</h1>
      <p className="mt-3 text-stone-500">The product or page may have moved.</p>
      <Link
        href="/"
        className="mt-7 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700"
      >
        Back to products
      </Link>
    </main>
  );
}
