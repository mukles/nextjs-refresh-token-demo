"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/store-types";
import { QuantitySelector } from "./quantity-selector";
import { useStore } from "./store-provider";

export function ProductPurchaseActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useStore();
  const router = useRouter();

  async function buyNow() {
    await addToCart(product, quantity);
    router.push("/checkout");
  }

  return (
    <div>
      <div className="mt-8">
        <p className="mb-2 text-sm font-bold">Quantity</p>
        <QuantitySelector value={quantity} onChange={setQuantity} />
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!product.inStock}
          onClick={() => addToCart(product, quantity)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-orange-600 font-bold text-orange-600 hover:bg-orange-50 disabled:border-stone-300 disabled:text-stone-400"
        >
          <ShoppingBag className="size-4" /> Add to Cart
        </button>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={buyNow}
          className="h-12 rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700 disabled:bg-stone-300"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
