"use client";

import Link from "next/link";
import { LogOut, ShoppingBag, Store } from "lucide-react";
import { useStore } from "./store-provider";
import { useAuth } from "@/features/auth/auth-context";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessTokenCountdown } from "./access-token-countdown";

const categories = ["Electronics", "Accessories", "Home", "Bags", "Footwear"];

export function Navbar() {
  const { itemCount, hydrated } = useStore();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash);
    queueMicrotask(syncHash);
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/dashboard")
  )
    return null;
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-black tracking-tight text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-orange-600 text-white">
            <Store aria-hidden="true" className="size-5" />
          </span>
          <span className="text-xl">
            Shob<span className="text-orange-600">Shop</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-6">
          <Link
            href="/#products"
            className="hidden text-sm font-semibold text-stone-600 hover:text-orange-600 sm:block"
          >
            Products
          </Link>
          {user && (
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm text-stone-500">
                Hi, <strong className="text-stone-800">{user.name}</strong>
              </span>
              <AccessTokenCountdown variant="compact" />
            </div>
          )}
          <Link
            href="/cart"
            className="relative inline-flex h-10 items-center gap-2 rounded-full border border-stone-200 px-4 text-sm font-semibold text-stone-800 transition hover:border-orange-200 hover:bg-orange-50"
            aria-label={`Cart with ${hydrated ? itemCount : 0} items`}
          >
            <ShoppingBag className="size-4" aria-hidden="true" /> Cart
            <span className="grid min-w-5 place-items-center rounded-full bg-orange-600 px-1 text-xs leading-5 text-white">
              {hydrated ? itemCount : 0}
            </span>
          </Link>
          {user ? (
            <button
              type="button"
              onClick={logout}
              className="grid size-10 place-items-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-red-600"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          ) : (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
              className="text-sm font-bold text-orange-600"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
      <nav
        className="border-t border-stone-100 bg-stone-50/90"
        aria-label="Product categories"
      >
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-6 overflow-x-auto px-4 text-xs font-bold text-stone-600 sm:px-6">
          <Link
            href="/#deals"
            onClick={() => setActiveHash("#deals")}
            aria-current={
              pathname === "/" && activeHash === "#deals" ? "page" : undefined
            }
            className={`shrink-0 border-b-2 py-2.5 transition-colors ${pathname === "/" && activeHash === "#deals" ? "border-orange-600 text-orange-600" : "border-transparent hover:text-orange-600"}`}
          >
            Flash Deals
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/categories/${category.toLowerCase()}`}
              onClick={() => setActiveHash("")}
              aria-current={
                pathname === `/categories/${category.toLowerCase()}`
                  ? "page"
                  : undefined
              }
              className={`shrink-0 border-b-2 py-2.5 transition-colors ${pathname === `/categories/${category.toLowerCase()}` ? "border-orange-600 text-orange-600" : "border-transparent hover:text-orange-600"}`}
            >
              {category}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
