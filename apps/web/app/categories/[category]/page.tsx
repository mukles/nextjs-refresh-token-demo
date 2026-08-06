import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-grid";
import { getCategoryProducts } from "@/lib/store-server";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ query?: string | string[] }>;
};

function categoryName(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  return { title: `${categoryName(category)} products` };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ category }, queryParams] = await Promise.all([params, searchParams]);
  const name = categoryName(category);
  const query = typeof queryParams.query === "string" ? queryParams.query : "";
  let products;
  try {
    products = await getCategoryProducts(category);
  } catch {
    notFound();
  }
  return (
    <main>
      <div className="border-b border-stone-200 bg-orange-50/50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <nav
            className="flex items-center gap-1 text-sm text-stone-500"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-orange-600">
              Home
            </Link>
            <ChevronRight className="size-4" />
            <span>{name}</span>
          </nav>
          <div className="mt-6 flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-orange-600 text-white">
              <LayoutGrid className="size-6" />
            </span>
            <div>
              <h1 className="text-3xl font-black sm:text-4xl">{name}</h1>
              <p className="mt-1 text-stone-500">
                Explore authenticated member picks in {name.toLowerCase()}.
              </p>
            </div>
          </div>
        </div>
      </div>
      <ProductGrid
        products={products}
        query={query}
        category="All"
        title={`Shop ${name}`}
        description={`${products.length} curated products in ${name.toLowerCase()}.`}
        showCategoryFilter={false}
        clearHref={`/categories/${category}#products`}
        eagerFirstImage
      />
    </main>
  );
}
