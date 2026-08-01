import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, X } from "lucide-react";
import { useState } from "react";

import { createReview, deleteReviewImage, uploadReviewImage } from "../../api/reviews";
import { extractErrorMessage } from "../../utils/errors";

const MAX_IMAGES = 2;

export function StarInput({ rating, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          className="p-1.5"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            size={22}
            className={n <= (hovered || rating) ? "fill-orange text-orange" : "text-cream-dark"}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewImageStep({ reviewId, onDone }) {
  const [images, setImages] = useState([]);
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: (file) => uploadReviewImage(reviewId, file),
    onSuccess: (data) => setImages((prev) => [...prev, data]),
  });

  const remove = useMutation({
    mutationFn: (imageId) => deleteReviewImage(imageId),
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) upload.mutate(file);
  };

  const handleRemove = (imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    remove.mutate(imageId);
  };

  const finish = () => {
    queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
    onDone();
  };

  return (
    <div className="mt-2 flex flex-col gap-2 rounded bg-cream p-3">
      <p className="text-sm text-green-700">Thanks for your review! Add up to {MAX_IMAGES} photos (optional).</p>
      <div className="flex items-center gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded border border-navy/20">
            <img src={img.image} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(img.id)}
              className="absolute right-0.5 top-0.5 rounded-full bg-navy/70 p-1 text-cream"
              aria-label="Remove photo"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded border border-dashed border-navy/30 text-xs text-navy/60 hover:border-navy/50">
            {upload.isPending ? "…" : "+ Photo"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={upload.isPending} />
          </label>
        )}
      </div>
      {upload.isError && <p className="text-sm text-red-600">{extractErrorMessage(upload.error)}</p>}
      <button
        type="button"
        onClick={finish}
        className="min-h-11 self-start rounded bg-orange px-3 py-1.5 text-sm font-medium text-cream hover:opacity-90"
      >
        Done
      </button>
    </div>
  );
}

export default function ReviewForm({ orderItemId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createReview({ order_item: orderItemId, rating, comment }),
  });

  if (done) {
    return <p className="text-sm text-green-700">Review posted.</p>;
  }

  if (mutation.isSuccess) {
    return (
      <ReviewImageStep
        reviewId={mutation.data.id}
        onDone={() => {
          setDone(true);
          onSuccess?.();
        }}
      />
    );
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
        <StarInput rating={rating} onChange={setRating} />
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
        className="min-h-11 self-start rounded bg-orange px-3 py-1.5 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
      >
        {mutation.isPending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
