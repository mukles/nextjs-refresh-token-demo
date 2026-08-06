"use client";

import Link from "next/link";
import { CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/checkout-schema";
import { formatBDT } from "@/lib/products";
import { normalizeBangladeshMobile } from "@/lib/mobile-number";
import { useCheckout } from "@/hooks/use-checkout";
import { useStore } from "./store-provider";

export function CheckoutForm() {
  const { cart, subtotal, hydrated } = useStore();
  const { state, mutate, isPending } = useCheckout();
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      mobileNumber: "",
      deliveryAddress: "",
      paymentMethod: undefined,
    },
  });
  const order = state.order;

  function submit(values: CheckoutFormValues) {
    mutate({
      ...values,
      mobileNumber: normalizeBangladeshMobile(values.mobileNumber),
    });
  }

  if (order)
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-emerald-50">
          <CheckCircle2 className="size-10 text-emerald-600" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-emerald-700">
          Order confirmed
        </p>
        <h1 className="mt-2 text-4xl font-black">Thank you!</h1>
        <p className="mt-3 leading-7 text-stone-500">
          Your order has been placed successfully. We&apos;ll contact you to
          confirm delivery.
        </p>
        <div className="mt-7 w-full rounded-2xl bg-stone-50 p-5">
          <p className="text-xs uppercase tracking-wider text-stone-400">
            Order number
          </p>
          <p className="mt-1 text-xl font-black text-orange-600">
            {order.orderNumber}
          </p>
          <p className="mt-3 text-sm text-stone-500">
            Total: {formatBDT(order.total)}
          </p>
        </div>
        <Link
          href="/"
          className="mt-7 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700"
        >
          Continue Shopping
        </Link>
      </main>
    );
  if (!hydrated)
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="h-96 animate-pulse rounded-2xl bg-stone-100" />
      </main>
    );
  if (!cart.length)
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-black">Nothing to checkout</h1>
        <p className="mt-2 text-stone-500">Your cart is currently empty.</p>
        <Link
          href="/"
          className="mt-6 font-bold text-orange-600 hover:underline"
        >
          Browse products
        </Link>
      </main>
    );
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-orange-600"
      >
        <ChevronLeft className="size-4" /> Back to cart
      </Link>
      <h1 className="mt-5 text-3xl font-black sm:text-4xl">Checkout</h1>
      <div className="mt-8 grid items-start gap-7 lg:grid-cols-[1fr_320px]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            noValidate
            className="rounded-2xl border border-stone-200 p-5 sm:p-7"
          >
            <h2 className="text-xl font-black">Delivery details</h2>
            {state.status === "error" && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {state.message}
              </p>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="name"
                        className="h-11 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
                        autoComplete="tel"
                        className="h-11 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="deliveryAddress"
              render={({ field }) => (
                <FormItem className="mt-5">
                  <FormLabel>Delivery address</FormLabel>
                  <FormControl>
                    <textarea
                      autoComplete="street-address"
                      rows={4}
                      className="w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Payment method</FormLabel>
                  <FormControl>
                    <fieldset className="grid gap-3 sm:grid-cols-2">
                      {(["Cash on Delivery", "bKash"] as const).map(
                        (method) => (
                          <label
                            key={method}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-4 hover:border-orange-300"
                          >
                            <input
                              type="radio"
                              value={method}
                              checked={field.value === method}
                              onChange={() => field.onChange(method)}
                              className="accent-orange-600"
                            />
                            <span className="font-semibold">{method}</span>
                          </label>
                        ),
                      )}
                    </fieldset>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              disabled={isPending}
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending
                ? "Placing order..."
                : `Place order · ${formatBDT(subtotal)}`}
            </button>
          </form>
        </Form>
        <aside className="rounded-2xl bg-stone-50 p-6">
          <h2 className="font-black">Your order</h2>
          <div className="mt-4 space-y-3">
            {cart.map((line) => (
              <div
                key={line.product.id}
                className="flex justify-between gap-4 text-sm"
              >
                <span className="text-stone-600">
                  {line.product.name} × {line.quantity}
                </span>
                <span className="shrink-0 font-semibold">
                  {formatBDT(line.product.price * line.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="my-5 border-t border-stone-200" />
          <div className="flex justify-between font-black">
            <span>Total</span>
            <span>{formatBDT(subtotal)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
