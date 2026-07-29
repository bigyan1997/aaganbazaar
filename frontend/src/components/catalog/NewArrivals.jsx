import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

import { getProducts } from "../../api/catalog";

export default function NewArrivals() {
  const { data } = useQuery({
    queryKey: ["products", "new-arrivals"],
    queryFn: () => getProducts({ ordering: "-created_at", page_size: 4 }),
    staleTime: 1000 * 60,
  });

  const products = data?.results ?? [];
  if (!products.length) return null;

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-navy">New arrivals</h2>
      <div className="flex flex-col gap-2">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.slug}`}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-cream"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream">
              {product.primary_image ? (
                <img src={product.primary_image} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <ShoppingBag size={16} className="text-navy" strokeWidth={1.75} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs text-navy-light">{product.name}</p>
              <p className="text-xs font-medium text-navy">
                Rs. {product.discount_percent ? product.sale_price : product.price}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
