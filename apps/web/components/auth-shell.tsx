import Link from "next/link";
import { CheckCircle2, ShoppingBag, Sparkles, Store } from "lucide-react";

export function AuthShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen bg-orange-50/40 p-3 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_30px_80px_rgba(0,0,0,.10)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[.9fr_1.1fr]">
        <section className="flex flex-col px-6 py-7 sm:px-10 lg:px-14 lg:py-10">
          <Link
            href="/"
            className="flex w-fit items-center gap-2 font-black tracking-tight text-stone-900"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-orange-600 text-white">
              <Store className="size-5" />
            </span>
            <span className="text-xl">
              Shob<span className="text-orange-600">Shop</span>
            </span>
          </Link>
          <div className="my-auto py-12">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-orange-600">
              Welcome to ShobShop
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-stone-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-md leading-7 text-stone-500">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
          <p className="text-xs leading-5 text-stone-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </section>
        <aside className="relative hidden overflow-hidden bg-stone-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-orange-600/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-300">
              <Sparkles className="size-3.5" /> Everyday made better
            </span>
            <h2 className="mt-8 max-w-md text-5xl font-black leading-[1.08] tracking-[-.04em]">
              Your favourites,
              <br />
              <span className="text-orange-500">one sign-in away.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-stone-400">
              A secure shopping experience powered by short-lived access tokens
              and automatic refresh rotation.
            </p>
          </div>
          <div className="relative grid gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <ShoppingBag className="size-5 text-orange-400" />
              <span className="font-semibold">
                Your cart follows your account
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <CheckCircle2 className="size-5 text-orange-400" />
              <span className="font-semibold">Secure OTP authentication</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
