import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

import StarRating from "./StarRating";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="overflow-hidden rounded-xl border border-cream-dark bg-white/60 transition hover:shadow-md"
    >
      <div className="relative flex h-28 items-center justify-center bg-cream">
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <ShoppingBag size={22} className="text-navy" strokeWidth={1.75} />
        )}
        <WishlistButton productId={product.id} size={14} className="absolute right-1.5 top-1.5" />
      </div>
      <div className="p-2.5">
        <p className="mb-1 line-clamp-2 text-xs text-navy-light">{product.name}</p>
        {product.review_count > 0 && (
          <div className="mb-1">
            <StarRating rating={product.average_rating} count={product.review_count} size={11} />
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-navy">Rs. {product.price}</p>
          {!product.in_stock && <span className="text-[10px] text-red-600">Out of stock</span>}
        </div>
      </div>
    </Link>
  );
}
