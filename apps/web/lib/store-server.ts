import "server-only";

import { connection } from "next/server";
import { backendFetch } from "@/lib/backend";
import { createServerBackendTransport } from "@/lib/backend-server";
import type { DetailedProduct, Product } from "@/lib/store-types";

export async function getStoreProducts() {
  await connection();
  const transport = await createServerBackendTransport();
  const result = await backendFetch<Product[]>(
    transport,
    "/store/products",
    undefined,
    "Products are unavailable",
  );

  if (!result.ok) throw result.error;
  return result.data;
}

async function getProductsFromPath(path: string, fallback: string) {
  await connection();
  const transport = await createServerBackendTransport();
  const result = await backendFetch<Product[]>(
    transport,
    path,
    undefined,
    fallback,
  );
  if (!result.ok) throw result.error;
  return result.data;
}

export function getFeaturedProducts() {
  return getProductsFromPath(
    "/store/products/featured",
    "Featured deals are unavailable",
  );
}

export function getCategoryProducts(category: string) {
  return getProductsFromPath(
    `/store/categories/${encodeURIComponent(category)}`,
    "Category products are unavailable",
  );
}

export async function getStoreProduct(id: string) {
  await connection();
  const transport = await createServerBackendTransport();
  const result = await backendFetch<DetailedProduct>(
    transport,
    `/store/products/${encodeURIComponent(id)}`,
    undefined,
    "Product is unavailable",
  );
  if (!result.ok) throw result.error;
  return result.data;
}
