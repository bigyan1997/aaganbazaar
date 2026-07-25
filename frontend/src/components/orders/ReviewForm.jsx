import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { createReview } from "../../api/reviews";
import { extractErrorMessage } from "../../utils/errors";

export default function ReviewForm({ orderItemId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => createReview({ order_item: orderItemId, rating, comment }),
    onSuccess,
  });

  if (mutation.isSuccess) {
    return <p className="text-sm text-green-700">Thanks for your review!</p>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="mt-2 flex flex-col gap-2 rounded bg-cream p-3"
    >
      <div className="flex items-center gap-2">
        <label className="text-sm text-navy">Rating</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded border border-navy/20 px-2 py-1 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts (optional)"
        rows={2}
        className="rounded border border-navy/20 px-2 py-1 text-sm"
      />
      {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="self-start rounded bg-orange px-3 py-1.5 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
      >
        {mutation.isPending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
