"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { CartLine } from "@/lib/store-types";
import { formatBDT } from "@/lib/products";
import { QuantitySelector } from "./quantity-selector";
import { useStore } from "./store-provider";

export function CartItem({ line }: { line: CartLine }) {
  const { updateQuantity, removeFromCart } = useStore();
  return (
    <article className="grid grid-cols-[88px_1fr] gap-4 border-b border-stone-200 py-5 last:border-0 sm:grid-cols-[112px_1fr_auto] sm:items-center">
      <Link
        href={`/products/${line.product.id}`}
        className="relative aspect-square overflow-hidden rounded-xl bg-stone-100"
      >
        <Image
          src={line.product.image}
          alt={line.product.name}
          fill
          sizes="112px"
          className="object-cover"
        />
      </Link>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
          {line.product.category}
        </p>
        <Link
          href={`/products/${line.product.id}`}
          className="mt-1 block truncate font-bold hover:text-orange-600"
        >
          {line.product.name}
        </Link>
        <p className="mt-1 text-sm text-stone-500">
          {formatBDT(line.product.price)} each
        </p>
        <div className="mt-3 sm:hidden">
          <QuantitySelector
            value={line.quantity}
            onChange={(value) => updateQuantity(line.product.id, value)}
          />
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:gap-7">
        <div className="hidden sm:block">
          <QuantitySelector
            value={line.quantity}
            onChange={(value) => updateQuantity(line.product.id, value)}
          />
        </div>
        <p className="font-black sm:w-24 sm:text-right">
          {formatBDT(line.product.price * line.quantity)}
        </p>
        <button
          type="button"
          onClick={() => removeFromCart(line.product.id)}
          className="grid size-10 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600"
          aria-label={`Remove ${line.product.name}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  );
}
