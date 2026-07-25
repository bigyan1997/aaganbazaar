import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="flex flex-col overflow-hidden rounded border border-navy/10 bg-white transition hover:shadow-md"
    >
      <div className="flex aspect-square items-center justify-center bg-cream">
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-navy/40">No image</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-navy">{product.name}</h3>
        <p className="text-xs text-navy/60">{product.seller_name}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-orange">Rs. {product.price}</span>
          {!product.in_stock && <span className="text-xs text-red-600">Out of stock</span>}
        </div>
      </div>
    </Link>
  );
}
