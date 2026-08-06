"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag, Star } from "lucide-react";
import { formatBDT } from "@/lib/products";
import type { Product } from "@/lib/store-types";
import { useStore } from "./store-provider";

export function ProductCard({
  product,
  eager = false,
}: {
  product: Product;
  eager?: boolean;
}) {
  const { addToCart } = useStore();
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,.09)]">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-stone-100"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          loading={eager ? "eager" : "lazy"}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-stone-700 shadow-sm">
          {product.category}
        </span>
        {product.promoLabel && (
          <span className="absolute right-3 top-3 rounded-full bg-orange-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            {product.promoLabel}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="font-bold leading-snug text-stone-900">
            {product.name}
          </h2>
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-stone-700">
            <Star className="size-3.5 fill-orange-500 text-orange-500" />
            {product.rating}
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-stone-500">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <div>
            <p className="text-lg font-black text-stone-900">
              {formatBDT(product.price)}
            </p>
            {product.originalPrice && (
              <p className="text-xs text-stone-400 line-through">
                {formatBDT(product.originalPrice)}
              </p>
            )}
          </div>
          <span
            className={`text-xs font-semibold ${product.inStock ? "text-emerald-700" : "text-red-600"}`}
          >
            {product.inStock ? "In stock" : "Out of stock"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/products/${product.id}`}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-stone-200 text-sm font-semibold hover:bg-stone-50"
          >
            View Details <ArrowUpRight className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <ShoppingBag className="size-4" /> Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
