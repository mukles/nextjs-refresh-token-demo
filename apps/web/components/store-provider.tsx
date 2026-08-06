"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      Promise.resolve().then(() => {
        setCart([]);
        setHydrated(true);
      });
      return;
    }
    let active = true;
    requestCart()
      .then((items) => {
        if (active) setCart(items);
      })
      .catch(() => toast.error("We couldn't load your cart from the store."))
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      hydrated,
      itemCount: cart.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: cart.reduce(
        (sum, line) => sum + line.product.price * line.quantity,
        0,
      ),
      async addToCart(product, quantity = 1) {
        if (!product.inStock) return;
        try {
          setCart(
            await requestCart("/store/cart/items", {
              method: "POST",
              body: JSON.stringify({ productId: product.id, quantity }),
            }),
          );
          toast.success(`${product.name} added to cart`);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Could not add item",
          );
        }
      },
      async updateQuantity(id, quantity) {
        try {
          setCart(
            await requestCart(`/store/cart/items/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ quantity: Math.max(1, quantity) }),
            }),
          );
        } catch {
          toast.error("Could not update quantity");
        }
      },
      async removeFromCart(id) {
        try {
          setCart(
            await requestCart(`/store/cart/items/${id}`, { method: "DELETE" }),
          );
        } catch {
          toast.error("Could not remove item");
        }
      },
      async clearCart() {
        try {
          setCart(await requestCart("/store/cart", { method: "DELETE" }));
        } catch {
          toast.error("Could not clear cart");
        }
      },
    }),
    [cart, hydrated],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
