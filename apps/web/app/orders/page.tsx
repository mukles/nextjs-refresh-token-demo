import type { Metadata } from "next";
import Link from "next/link";
import { PackageCheck, ShoppingBag } from "lucide-react";
import { formatBDT } from "@/lib/products";
import { getStoreOrders } from "@/lib/store-server";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const orders = await getStoreOrders();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-orange-600">
        Purchase history
      </p>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">Your orders</h1>
      <p className="mt-2 text-stone-500">
        Review your placed orders and delivery details.
      </p>

      {!orders.length ? (
        <section className="mt-10 rounded-3xl border border-dashed border-stone-300 px-6 py-16 text-center">
          <ShoppingBag className="mx-auto size-10 text-stone-300" />
          <h2 className="mt-4 text-xl font-black">No orders yet</h2>
          <p className="mt-2 text-stone-500">
            Your completed purchases will appear here.
          </p>
          <Link
            href="/#products"
            className="mt-6 inline-flex rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700"
          >
            Start shopping
          </Link>
        </section>
      ) : (
        <div className="mt-10 space-y-5">
          {orders.map((order) => (
            <article
              key={order.orderNumber}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
            >
              <header className="flex flex-wrap items-start justify-between gap-4 bg-stone-50 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <PackageCheck className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-black text-stone-900">
                      {order.orderNumber}
                    </h2>
                    <p className="text-sm text-stone-500">
                      {new Intl.DateTimeFormat("en-BD", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Dhaka",
                      }).format(new Date(order.createdAt))}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-black text-orange-600">
                  {formatBDT(order.total)}
                </p>
              </header>

              <div className="grid gap-6 p-5 sm:grid-cols-[1fr_260px] sm:p-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400">
                    Items
                  </h3>
                  <ul className="mt-3 divide-y divide-stone-100">
                    {order.items.map((item, index) => (
                      <li
                        key={`${item.name}-${index}`}
                        className="flex justify-between gap-4 py-3 first:pt-0"
                      >
                        <span className="text-stone-700">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="shrink-0 font-semibold">
                          {formatBDT(item.unitPrice * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <dl className="space-y-3 rounded-xl bg-orange-50/60 p-4 text-sm">
                  <div>
                    <dt className="text-stone-500">Customer</dt>
                    <dd className="font-semibold text-stone-800">
                      {order.customerName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Payment</dt>
                    <dd className="font-semibold text-stone-800">
                      {order.paymentMethod}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Delivery address</dt>
                    <dd className="font-semibold leading-6 text-stone-800">
                      {order.deliveryAddress}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
