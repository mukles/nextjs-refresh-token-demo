"use client";

import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type ProductFiltersProps = {
  initialQuery: string;
  initialCategory: string;
  categories: string[];
  showCategory?: boolean;
};

export function ProductFilters({
  initialQuery,
  initialCategory,
  categories,
  showCategory = true,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [isPending, startTransition] = useTransition();
  const debouncedQuery = useDebouncedValue(query.trim(), 400);
  const isSearching = query.trim() !== debouncedQuery || isPending;

  useEffect(() => {
    const currentQuery = searchParams.get("query") ?? "";
    const currentCategory = searchParams.get("category") ?? "All";
    if (debouncedQuery === currentQuery && category === currentCategory) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery) params.set("query", debouncedQuery);
    else params.delete("query");
    if (category !== "All") params.set("category", category);
    else params.delete("category");

    const nextUrl = params.size ? `${pathname}?${params}` : pathname;
    startTransition(() =>
      router.replace(`${nextUrl}#products`, { scroll: false }),
    );
  }, [category, debouncedQuery, pathname, router, searchParams]);

  return (
    <div
      className={`grid gap-3 transition-opacity ${showCategory ? "sm:grid-cols-[224px_180px]" : "sm:grid-cols-[224px]"} ${isPending ? "opacity-60" : ""}`}
      aria-busy={isPending}
    >
      <label className="relative">
        <span className="sr-only">Search products by name</span>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products..."
          className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-10 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
        {isSearching && (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-orange-600"
            aria-label="Updating products"
          />
        )}
      </label>
      {showCategory && (
        <label className="relative">
          <span className="sr-only">Filter by category</span>
          <SlidersHorizontal className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-stone-200 bg-white pl-9 pr-8 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
