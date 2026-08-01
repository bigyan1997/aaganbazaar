import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { deleteReview, getMyReviews, updateReview } from "../../api/reviews";
import { StarInput } from "../../components/orders/ReviewForm";
import StarRating from "../../components/catalog/StarRating";
import { extractErrorMessage } from "../../utils/errors";

function EditForm({ review, onDone }) {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => updateReview(review.id, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      onDone();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="mt-2 flex flex-col gap-2 rounded bg-cream p-3"
    >
      <StarInput rating={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="rounded border border-navy/20 px-2 py-1 text-sm"
      />
      {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="min-h-11 rounded bg-orange px-3 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onDone} className="min-h-11 rounded border border-navy/20 px-3 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function MyReviewsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["my-reviews"], queryFn: getMyReviews });
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-reviews"] }),
  });

  if (isLoading) return <p className="text-navy/60">Loading…</p>;

  const reviews = data?.results ?? [];
  if (!reviews.length) {
    return <p className="text-sm text-navy/60">You haven't written any reviews yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-lg border border-cream-dark bg-white/60 p-4">
          <div className="flex items-start gap-3">
            <Link
              to={`/products/${review.product_slug}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream"
            >
              {review.product_image ? (
                <img src={review.product_image} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <ShoppingBag size={18} className="text-navy" strokeWidth={1.75} />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/products/${review.product_slug}`} className="font-medium text-navy hover:underline">
                {review.product_name}
              </Link>
              <StarRating rating={review.rating} size={13} />
              {review.comment && <p className="mt-1 text-sm text-navy/70">{review.comment}</p>}
              <p className="mt-1 text-xs text-navy/40">
                {new Date(review.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setEditingId(editingId === review.id ? null : review.id)}
                aria-label="Edit review"
                className="relative rounded-full p-2 text-navy/50 after:absolute after:-inset-1 after:content-[''] hover:bg-cream"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(review.id)}
                aria-label="Delete review"
                className="relative rounded-full p-2 text-navy/50 after:absolute after:-inset-1 after:content-[''] hover:bg-cream hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {editingId === review.id && <EditForm review={review} onDone={() => setEditingId(null)} />}
        </div>
      ))}
    </div>
  );
}
