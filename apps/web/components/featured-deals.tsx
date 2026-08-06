import Link from "next/link";
import { ArrowRight, BadgePercent, Clock3 } from "lucide-react";
import { getFeaturedProducts } from "@/lib/store-server";
import { ProductCard } from "./product-card";

export async function FeaturedDeals() {
  const products = await getFeaturedProducts();
  return (
    <section
      id="deals"
      className="scroll-mt-28 bg-stone-900 py-14 text-white"
      aria-labelledby="deals-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.18em] text-orange-400">
              <BadgePercent className="size-4" /> Member-only savings
            </p>
            <h2
              id="deals-heading"
              className="mt-2 text-3xl font-black sm:text-4xl"
            >
              Flash deals
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-stone-400">
              <Clock3 className="size-4" /> Fresh offers for signed-in shoppers
            </p>
          </div>
          <Link
            href="/#products"
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300"
          >
            View all products <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedDealsSkeleton() {
  return (
    <section className="bg-stone-900 py-14" aria-label="Loading featured deals">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 h-10 w-56 animate-pulse rounded bg-stone-800" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-96 animate-pulse rounded-2xl bg-stone-800"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
