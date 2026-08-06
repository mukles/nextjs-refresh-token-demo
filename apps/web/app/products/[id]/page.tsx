import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/product-details";
import { BackendError } from "@/lib/backend";
import { getStoreProduct } from "@/lib/store-server";

export const metadata: Metadata = { title: "Product details" };

async function loadProduct(id: string) {
  try {
    return await getStoreProduct(id);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound();
    throw error;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await loadProduct(id);
  return <ProductDetails product={product} />;
}
