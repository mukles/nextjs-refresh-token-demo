import { ProductGrid } from "@/components/product-grid";
import { getStoreProducts } from "@/lib/store-server";
import type { Product } from "@/lib/store-types";

export type ProductSearchParams = Promise<{
  query?: string | string[];
  category?: string | string[];
}>;

export async function ProductCatalog({
  searchParams,
}: {
  searchParams: ProductSearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.query === "string" ? params.query : "";
  const category =
    typeof params.category === "string" ? params.category : "All";

  let products: Product[] = [];
  let productError: string | undefined;

  try {
    products = await getStoreProducts();
  } catch (error) {
    productError =
      error instanceof Error ? error.message : "Could not load products";
  }

  return (
    <ProductGrid
      products={products}
      query={query}
      category={category}
      error={productError}
    />
  );
}
