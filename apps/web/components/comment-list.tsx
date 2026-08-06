import { MessageSquare, Star } from "lucide-react";
import type { ProductComment } from "@/lib/store-types";

export function CommentList({ comments }: { comments: ProductComment[] }) {
  if (!comments.length)
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 py-12 text-center">
        <MessageSquare className="mx-auto mb-3 size-7 text-stone-300" />
        <p className="font-bold">No reviews yet</p>
        <p className="mt-1 text-sm text-stone-500">
          Be the first to share your experience.
        </p>
      </div>
    );
  return (
    <div className="space-y-4">
      {comments.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-stone-200 p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold">{item.name}</h3>
              <div
                className="mt-1 flex"
                aria-label={`${item.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`size-3.5 ${i < item.rating ? "fill-orange-500 text-orange-500" : "text-stone-200"}`}
                  />
                ))}
              </div>
            </div>
            <time className="text-xs text-stone-400" dateTime={item.date}>
              {new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(
                new Date(item.date),
              )}
            </time>
          </div>
          <p className="mt-4 leading-7 text-stone-600">{item.comment}</p>
        </article>
      ))}
    </div>
  );
}
