"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CartLine, Product } from "@/lib/store-types";
import { storeRequest } from "@/lib/store-api";
import { useAuth } from "@/features/auth/auth-context";

type StoreContextValue = {
  cart: CartLine[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
async function requestCart(
  path = "/store/cart",
  init?: RequestInit,
): Promise<CartLine[]> {
  return storeRequest<CartLine[]>(path.replace(/^\/store/, ""), init);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const cartRef = useRef<CartLine[]>([]);
  const mutationQueue = useRef<Promise<unknown>>(Promise.resolve());
  const latestMutation = useRef(0);

  function updateCart(next: CartLine[] | ((cart: CartLine[]) => CartLine[])) {
    const value = typeof next === "function" ? next(cartRef.current) : next;
    cartRef.current = value;
    setCart(value);
  }

  function mutateCart(
    optimisticUpdate: (cart: CartLine[]) => CartLine[],
    request: () => Promise<CartLine[]>,
    errorMessage: string,
  ) {
    const previousCart = cartRef.current;
    const mutationId = ++latestMutation.current;
    updateCart(optimisticUpdate);

    const mutation = mutationQueue.current.then(async () => {
      try {
        const confirmedCart = await request();
        if (mutationId === latestMutation.current) updateCart(confirmedCart);
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : errorMessage);
        if (mutationId === latestMutation.current) {
          try {
            updateCart(await requestCart());
          } catch {
            updateCart(previousCart);
          }
        }
        return false;
      }
    });
    mutationQueue.current = mutation;
    return mutation;
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      Promise.resolve().then(() => {
        updateCart([]);
        setHydrated(true);
      });
      return;
    }
    let active = true;
    requestCart()
      .then((items) => {
        if (active) updateCart(items);
      })
      .catch(() => toast.error("We couldn't load your cart from the store."))
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const value: StoreContextValue = {
    cart,
    hydrated,
    itemCount: cart.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: cart.reduce(
      (sum, line) => sum + line.product.price * line.quantity,
      0,
    ),
    async addToCart(product, quantity = 1) {
      if (!product.inStock) return;
      const added = await mutateCart(
        (items) => {
          const existing = items.find((line) => line.product.id === product.id);
          return existing
            ? items.map((line) =>
                line.product.id === product.id
                  ? { ...line, quantity: line.quantity + quantity }
                  : line,
              )
            : [...items, { product, quantity }];
        },
        () =>
          requestCart("/store/cart/items", {
            method: "POST",
            body: JSON.stringify({ productId: product.id, quantity }),
          }),
        "Could not add item",
      );
      if (added) toast.success(`${product.name} added to cart`);
    },
    async updateQuantity(id, quantity) {
      const nextQuantity = Math.max(1, quantity);
      await mutateCart(
        (items) =>
          items.map((line) =>
            line.product.id === id ? { ...line, quantity: nextQuantity } : line,
          ),
        () =>
          requestCart(`/store/cart/items/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ quantity: nextQuantity }),
          }),
        "Could not update quantity",
      );
    },
    async removeFromCart(id) {
      await mutateCart(
        (items) => items.filter((line) => line.product.id !== id),
        () => requestCart(`/store/cart/items/${id}`, { method: "DELETE" }),
        "Could not remove item",
      );
    },
    async clearCart() {
      await mutateCart(
        () => [],
        () => requestCart("/store/cart", { method: "DELETE" }),
        "Could not clear cart",
      );
    },
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
