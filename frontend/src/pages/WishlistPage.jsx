import { useQuery } from "@tanstack/react-query";

import { getWishlist } from "../api/wishlist";
import ProductCard from "../components/catalog/ProductCard";

export default function WishlistPage() {
  const { data, isLoading } = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });

  if (isLoading) return <p className="text-navy/60">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-navy">Wishlist</h1>
      {data?.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {data.map((item) => (
            <ProductCard key={item.id} product={item.product_detail} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-navy/60">
          Nothing saved yet - tap the heart icon on a product to add it here.
        </p>
      )}
    </div>
  );
}
