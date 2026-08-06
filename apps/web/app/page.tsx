import Link from "next/link";
import { ArrowDown, ShieldCheck, Truck } from "lucide-react";
import { Suspense } from "react";
import {
  ProductCatalog,
  type ProductSearchParams,
} from "@/components/product-catalog";
import { ProductGridSkeleton } from "@/components/product-grid-skeleton";
import {
  FeaturedDeals,
  FeaturedDealsSkeleton,
} from "@/components/featured-deals";

type HomeProps = {
  searchParams: ProductSearchParams;
};

export default function Home({ searchParams }: HomeProps) {
  return (
    <main>
      <section className="border-b border-stone-200 bg-orange-50/50">
        <div className="mx-auto grid min-h-[500px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <span className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-orange-700">
              Thoughtful goods, fair prices
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.05] tracking-[-.045em] text-stone-900 sm:text-6xl lg:text-7xl">
              Good things for
              <br />
              <span className="text-orange-600">everyday living.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
              Discover useful, well-made favourites selected to fit your day—and
              your budget.
            </p>
            <Link
              href="#products"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
            >
              Shop the collection <ArrowDown className="size-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-stone-900 p-7 text-white">
              <p className="text-sm text-stone-400">This week&apos;s promise</p>
              <p className="mt-3 text-2xl font-bold">
                Simple shopping.
                <br />
                Zero fuss.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-orange-200 bg-white p-5">
                <Truck className="mb-8 size-7 text-orange-600" />
                <p className="font-bold">Nationwide delivery</p>
                <p className="mt-1 text-sm text-stone-500">
                  Right to your door
                </p>
              </div>
              <div className="rounded-3xl border border-orange-200 bg-white p-5">
                <ShieldCheck className="mb-8 size-7 text-orange-600" />
                <p className="font-bold">Quality checked</p>
                <p className="mt-1 text-sm text-stone-500">Chosen with care</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Suspense fallback={<FeaturedDealsSkeleton />}>
        <FeaturedDeals />
      </Suspense>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductCatalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
