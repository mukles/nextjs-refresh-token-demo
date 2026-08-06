"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ProductComment } from "@/lib/store-types";
import { storeRequest } from "@/lib/store-api";
import { useAuth } from "@/features/auth/auth-context";

export function CommentForm({
  productId,
  onAdded,
}: {
  productId: string;
  onAdded: (comment: ProductComment) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const data = {
      name: user?.name ?? "",
      rating: Number(form.get("rating")),
      comment: String(form.get("comment") ?? "").trim(),
    };
    const next: Record<string, string> = {};
    if (data.name.length < 2) next.name = "Please enter at least 2 characters.";
    if (data.rating < 1 || data.rating > 5)
      next.rating = "Choose a rating from 1 to 5.";
    if (data.comment.length < 3)
      next.comment = "Please enter at least 3 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      const body = await storeRequest<ProductComment>(
        `/products/${productId}/comments`,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      onAdded({ ...body, date: body.date ?? new Date().toISOString() });
      formElement.reset();
      setErrors({});
      toast.success("Thank you! Your review is now live.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit review",
      );
    } finally {
      setSubmitting(false);
    }
  }
  const field =
    "mt-1.5 h-11 w-full rounded-xl border border-stone-200 px-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-2xl bg-stone-50 p-5 sm:p-6"
    >
      <h3 className="text-lg font-bold">Write a review</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Your name
          <input
            name="name"
            value={user?.name ?? ""}
            readOnly
            className={field}
            aria-invalid={!!errors.name}
            aria-describedby="name-error"
          />
          {errors.name && (
            <span id="name-error" className="mt-1 block text-xs text-red-600">
              {errors.name}
            </span>
          )}
        </label>
        <label className="text-sm font-semibold">
          Rating
          <select
            name="rating"
            defaultValue=""
            className={field}
            aria-invalid={!!errors.rating}
          >
            <option value="" disabled>
              Select 1–5
            </option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n !== 1 && "s"}
              </option>
            ))}
          </select>
          {errors.rating && (
            <span className="mt-1 block text-xs text-red-600">
              {errors.rating}
            </span>
          )}
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold">
        Comment
        <textarea
          name="comment"
          rows={4}
          className="mt-1.5 w-full resize-y rounded-xl border border-stone-200 p-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          aria-invalid={!!errors.comment}
        />
        {errors.comment && (
          <span className="mt-1 block text-xs text-red-600">
            {errors.comment}
          </span>
        )}
      </label>
      <button
        disabled={submitting}
        className="mt-4 h-11 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
