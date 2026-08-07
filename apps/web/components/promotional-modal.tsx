"use client";

import Link from "next/link";
import { BadgePercent, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

const PROMOTION_STORAGE_KEY = "shobshop:promotion:last-shown";

function getLocalDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PromotionalModal() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const shown = useRef<string | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!user || pathname === "/login" || pathname === "/register")
      return;

    const today = getLocalDateKey();
    const displayKey = `${PROMOTION_STORAGE_KEY}:${today}`;
    if (shown.current === displayKey) return;

    try {
      if (window.localStorage.getItem(PROMOTION_STORAGE_KEY) === today) {
        shown.current = displayKey;
        return;
      }
    } catch {
      // The in-memory guard still prevents repeats when storage is unavailable.
    }

    shown.current = displayKey;
    const timeout = setTimeout(() => {
      try {
        window.localStorage.setItem(PROMOTION_STORAGE_KEY, today);
      } catch {
        // The promotion can still be shown when storage is unavailable.
      }
      setOpen(true);
    }, 700);
    return () => clearTimeout(timeout);
  }, [pathname, user]);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-stone-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-title"
        aria-describedby="offer-description"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <button
          ref={closeButton}
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-stone-600 shadow-sm hover:bg-white hover:text-stone-900"
          aria-label="Close promotional offer"
        >
          <X className="size-5" />
        </button>
        <div className="bg-orange-600 px-7 py-8 text-white sm:px-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest">
            <BadgePercent className="size-4" /> Signed-in member offer
          </span>
          <h2
            id="offer-title"
            className="mt-5 text-4xl font-black leading-tight"
          >
            Save up to 20%
            <br />
            on today&apos;s favourites.
          </h2>
          <p
            id="offer-description"
            className="mt-3 max-w-md leading-7 text-orange-100"
          >
            Welcome back, {user?.name}. Limited-time prices are live across
            selected bags, electronics, home and accessories.
          </p>
        </div>
        <div className="p-7 sm:p-9">
          <div className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4 text-sm text-orange-900">
            <ShieldCheck className="size-5 shrink-0 text-orange-600" />
            <span>
              Deals are available only inside your authenticated shopping
              session.
            </span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-12 rounded-xl border border-stone-200 font-bold text-stone-700 hover:bg-stone-50"
            >
              Maybe later
            </button>
            <Link
              href="/#deals"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700"
            >
              Shop flash deals
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
