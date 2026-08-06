"use client";

import { useCallback } from "react";
import { useStore } from "@/components/store-provider";
import { useMutation, type MutationState } from "@/hooks/use-mutation";
import { storeRequest } from "@/lib/store-api";

export type CheckoutInput = {
  customerName: string;
  mobileNumber: string;
  deliveryAddress: string;
  paymentMethod: string;
};

type CheckoutState = MutationState & {
  order: { orderNumber: string; total: number } | null;
};

const initialState: CheckoutState = {
  status: "idle",
  message: "",
  order: null,
};

export function useCheckout() {
  const { clearCart } = useStore();
  const checkout = useCallback(
    async (
      _previous: CheckoutState,
      input: CheckoutInput,
    ): Promise<CheckoutState> => {
      try {
        const order = await storeRequest<NonNullable<CheckoutState["order"]>>(
          "/checkout",
          { method: "POST", body: JSON.stringify(input) },
        );
        await clearCart();
        return {
          status: "success",
          message: "Order placed successfully",
          order,
        };
      } catch (error) {
        return {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Checkout failed. Please try again.",
          order: null,
        };
      }
    },
    [clearCart],
  );

  return useMutation(checkout, initialState, { showToast: false });
}
