import { Star } from "lucide-react";

export default function StarRating({ rating, count, size = 14 }) {
  if (rating == null) {
    return <span className="text-xs text-text-muted">No reviews yet</span>;
  }
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={size} className={n <= filled ? "fill-orange text-orange" : "text-cream-dark"} />
        ))}
      </div>
      <span className="text-xs text-text-muted">
        {rating.toFixed(1)}
        {count != null && ` (${count})`}
      </span>
    </div>
  );
}
