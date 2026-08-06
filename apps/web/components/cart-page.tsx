"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { formatBDT } from "@/lib/products";
import { useStore } from "./store-provider";
import { CartItem } from "./cart-item";

export function CartPage() {
  const { cart, subtotal, clearCart, hydrated } = useStore();
  if (!hydrated)
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="h-10 w-44 animate-pulse rounded bg-stone-100" />
        <div className="mt-8 h-72 animate-pulse rounded-2xl bg-stone-100" />
      </main>
    );
  if (!cart.length)
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-orange-50">
          <ShoppingBag className="size-9 text-orange-600" />
        </span>
        <h1 className="mt-6 text-3xl font-black">Your cart is empty</h1>
        <p className="mt-2 leading-7 text-stone-500">
          Looks like you haven&apos;t added anything yet. Let&apos;s find
          something you&apos;ll love.
        </p>
        <Link
          href="/#products"
          className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-5 font-bold text-white hover:bg-orange-700"
        >
          Continue Shopping <ArrowRight className="size-4" />
        </Link>
      </main>
    );
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/#products"
        className="inline-flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-orange-600"
      >
        <ArrowLeft className="size-4" /> Continue Shopping
      </Link>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Shopping cart</h1>
          <p className="mt-2 text-sm text-stone-500">
            {cart.length} unique {cart.length === 1 ? "item" : "items"} in your
            cart
          </p>
        </div>
        <button
          onClick={clearCart}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
        >
          <Trash2 className="size-4" /> Clear cart
        </button>
      </div>
      <div className="mt-8 grid items-start gap-7 lg:grid-cols-[1fr_340px]">
        <section
          className="rounded-2xl border border-stone-200 bg-white px-4 shadow-sm sm:px-6"
          aria-label="Cart items"
        >
          {cart.map((line) => (
            <CartItem key={line.product.id} line={line} />
          ))}
        </section>
        <aside className="rounded-2xl border border-stone-200 bg-stone-50 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-black">Order summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatBDT(subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>
          </div>
          <div className="my-5 border-t border-stone-200" />
          <div className="flex items-center justify-between">
            <span className="font-bold">Total</span>
            <span className="text-2xl font-black">{formatBDT(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700"
          >
            Proceed to Checkout <ArrowRight className="size-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-stone-400">
            No payment will be charged online.
          </p>
        </aside>
      </div>
    </main>
  );
}
