import Link from "next/link";
import { Search } from "lucide-react";
import type { Product } from "@/lib/store-types";
import { ProductCard } from "./product-card";
import { ProductFilters } from "./product-filters";

type ProductGridProps = {
  products: Product[];
  query: string;
  category: string;
  error?: string;
  title?: string;
  description?: string;
  showCategoryFilter?: boolean;
  clearHref?: string;
  eagerFirstImage?: boolean;
};

export function ProductGrid({
  products,
  query,
  category,
  error,
  title = "Everyday favourites",
  description = "Quality finds for better days, delivered across Bangladesh.",
  showCategoryFilter = true,
  clearHref = "/#products",
  eagerFirstImage = false,
}: ProductGridProps) {
  const normalizedQuery = query.trim().toLowerCase();
  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];
  const filtered = products.filter(
    (product) =>
      product.name.toLowerCase().includes(normalizedQuery) &&
      (category === "All" || product.category === category),
  );

  return (
    <section
      id="products"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="products-heading"
    >
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-orange-600">
            Curated for you
          </p>
          <h1
            id="products-heading"
            className="text-3xl font-black tracking-tight text-stone-900 sm:text-4xl"
          >
            {title}
          </h1>
          <p className="mt-2 text-stone-500">{description}</p>
        </div>

        <ProductFilters
          key={`${query}:${category}`}
          initialQuery={query}
          initialCategory={category}
          categories={categories}
          showCategory={showCategoryFilter}
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <h2 className="font-bold text-red-800">Products are unavailable</h2>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <Link
            href="/#products"
            className="mt-4 inline-block rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            Try again
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-stone-500">
            Showing {filtered.length}{" "}
            {filtered.length === 1 ? "product" : "products"}
          </p>
          {filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  eager={eagerFirstImage && index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 py-20 text-center">
              <Search className="mx-auto mb-3 size-8 text-stone-300" />
              <h2 className="font-bold">No products found</h2>
              <p className="mt-1 text-sm text-stone-500">
                Try a different search or category.
              </p>
              <Link
                href={clearHref}
                className="mt-5 inline-block text-sm font-bold text-orange-600 hover:underline"
              >
                Clear filters
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
