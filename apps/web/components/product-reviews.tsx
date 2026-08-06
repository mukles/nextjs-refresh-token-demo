"use client";

import { useState } from "react";
import type { ProductComment } from "@/lib/store-types";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

export function ProductReviews({
  productId,
  initialComments,
}: {
  productId: string;
  initialComments: ProductComment[];
}) {
  const [comments, setComments] = useState(initialComments);

  return (
    <section
      className="mt-20 border-t border-stone-200 pt-12"
      aria-labelledby="reviews-title"
    >
      <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <h2 id="reviews-title" className="mb-6 text-2xl font-black">
            Customer reviews{" "}
            <span className="text-stone-400">({comments.length})</span>
          </h2>
          <CommentList comments={comments} />
        </div>
        <CommentForm
          productId={productId}
          onAdded={(comment) => setComments((current) => [comment, ...current])}
        />
      </div>
    </section>
  );
}
