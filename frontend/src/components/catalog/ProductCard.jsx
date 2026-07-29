import { Scale, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

import useCompareStore, { MAX_COMPARE } from "../../store/compareStore";
import StarRating from "./StarRating";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product }) {
  const compared = useCompareStore((s) => s.isCompared(product.slug));
  const compareCount = useCompareStore((s) => s.slugs.length);
  const toggleCompare = useCompareStore((s) => s.toggle);

  const handleCompareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(product.slug);
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="overflow-hidden rounded-xl border border-cream-dark bg-white/60 transition hover:shadow-md"
    >
      <div className="relative flex h-28 items-center justify-center bg-cream">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <ShoppingBag size={22} className="text-navy" strokeWidth={1.75} />
        )}
        <WishlistButton productId={product.id} size={14} className="absolute right-1.5 top-1.5" />
        <button
          type="button"
          onClick={handleCompareClick}
          disabled={!compared && compareCount >= MAX_COMPARE}
          aria-label={compared ? "Remove from compare" : "Add to compare"}
          title={!compared && compareCount >= MAX_COMPARE ? `You can compare up to ${MAX_COMPARE} items` : undefined}
          className={`absolute bottom-1.5 right-1.5 rounded-full p-1.5 shadow-sm after:absolute after:-inset-2.5 after:content-[''] disabled:cursor-not-allowed disabled:opacity-40 ${
            compared ? "bg-orange text-white" : "bg-white/80 text-navy/50 hover:bg-white"
          }`}
        >
          <Scale size={14} />
        </button>
        {product.discount_percent && (
          <span className="absolute left-1.5 top-1.5 rounded bg-orange px-1.5 py-0.5 text-[10px] font-medium text-white">
            -{product.discount_percent}%
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="mb-1 line-clamp-2 text-xs text-navy-light">{product.name}</p>
        {product.review_count > 0 && (
          <div className="mb-1">
            <StarRating rating={product.average_rating} count={product.review_count} size={11} />
          </div>
        )}
        <div className="flex items-center justify-between">
          {product.discount_percent ? (
            <p className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-orange">Rs. {product.sale_price}</span>
              <span className="text-xs text-navy-light line-through">Rs. {product.price}</span>
            </p>
          ) : (
            <p className="text-sm font-medium text-navy">Rs. {product.price}</p>
          )}
          {!product.in_stock && <span className="text-[10px] text-red-600">Out of stock</span>}
        </div>
      </div>
    </Link>
  );
}
