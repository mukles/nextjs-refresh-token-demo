import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Star, X } from "lucide-react";
import { formatBDT } from "@/lib/products";
import type { DetailedProduct } from "@/lib/store-types";
import { ProductPurchaseActions } from "./product-purchase-actions";
import { ProductReviews } from "./product-reviews";

export function ProductDetails({ product }: { product: DetailedProduct }) {
  const { comments, ...purchaseProduct } = product;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-7 inline-flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-orange-600"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-stone-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            loading="eager"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <section className="py-2">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-orange-600">
            {product.category} · ID {product.id}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">
            {product.name}
          </h1>
          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-black">
              {formatBDT(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-stone-400 line-through">
                {formatBDT(product.originalPrice)}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-sm font-bold">
              <Star className="size-4 fill-orange-500 text-orange-500" />
              {product.rating}
            </span>
            {product.promoLabel && (
              <span className="rounded-full bg-orange-600 px-2.5 py-1 text-xs font-bold text-white">
                {product.promoLabel}
              </span>
            )}
          </div>
          <p className="mt-7 text-lg leading-8 text-stone-600">
            {product.description}
          </p>
          <div
            className={`mt-6 flex items-center gap-2 text-sm font-bold ${product.inStock ? "text-emerald-700" : "text-red-600"}`}
          >
            {product.inStock ? (
              <Check className="size-4" />
            ) : (
              <X className="size-4" />
            )}
            {product.inStock
              ? "In stock and ready to ship"
              : "Currently out of stock"}
          </div>
          <ProductPurchaseActions product={purchaseProduct} />
        </section>
      </div>
      <ProductReviews productId={product.id} initialComments={comments} />
    </main>
  );
}
