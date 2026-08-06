"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export type MutationState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type MutationAction<State, Payload> = (
  previousState: Awaited<State>,
  payload: Payload,
) => State | Promise<State>;

export type MutationResult<State, Payload> = {
  state: State;
  mutate: (payload: Payload) => void;
  isPending: boolean;
};

export type MutationOptions<State> = {
  onSuccess?: (state: State) => void;
  onError?: (state: State) => void;
  showToast?: boolean;
};

export function useMutation<State extends MutationState, Payload>(
  action: MutationAction<State, Payload>,
  initialState: Awaited<State>,
  options: MutationOptions<Awaited<State>> = {},
): MutationResult<Awaited<State>, Payload> {
  const [state, mutate, isPending] = useActionState<State, Payload>(
    action,
    initialState,
  );
  const { onSuccess, onError, showToast = true } = options;

  useEffect(() => {
    if (state.status === "success") {
      if (showToast && state.message) toast.success(state.message);
      onSuccess?.(state);
    }

    if (state.status === "error") {
      if (showToast && state.message) toast.error(state.message);
      onError?.(state);
    }
  }, [onError, onSuccess, showToast, state]);

  return {
    state,
    mutate,
    isPending,
  };
}
