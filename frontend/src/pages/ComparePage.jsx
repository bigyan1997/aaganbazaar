import { useQueries } from "@tanstack/react-query";
import { ShoppingBag, X } from "lucide-react";
import { Link } from "react-router-dom";

import { getProduct } from "../api/catalog";
import StarRating from "../components/catalog/StarRating";
import useCompareStore from "../store/compareStore";

const ROWS = [
  { label: "Price", render: (p) => (
    <span className="font-medium text-orange">Rs. {p.discount_percent ? p.sale_price : p.price}</span>
  ) },
  { label: "Category", render: (p) => p.category_name },
  { label: "Seller", render: (p) => (
    <Link to={`/sellers/${p.seller_slug}`} className="text-orange hover:underline">
      {p.seller_name}
    </Link>
  ) },
  { label: "Rating", render: (p) => <StarRating rating={p.average_rating} count={p.review_count} size={13} /> },
  { label: "Stock", render: (p) => (
    <span className={p.in_stock ? "text-navy/70" : "text-red-600"}>
      {p.in_stock ? `${p.stock_quantity} in stock` : "Out of stock"}
    </span>
  ) },
  { label: "Description", render: (p) => (
    <span className="line-clamp-4 text-xs text-navy/70">{p.description || "—"}</span>
  ) },
];

export default function ComparePage() {
  const slugs = useCompareStore((s) => s.slugs);
  const remove = useCompareStore((s) => s.remove);

  const results = useQueries({
    queries: slugs.map((slug) => ({ queryKey: ["product", slug], queryFn: () => getProduct(slug) })),
  });
  const products = results.map((r) => r.data).filter(Boolean);
  const isLoading = results.some((r) => r.isLoading);

  if (slugs.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-navy">Compare products</h1>
        <p className="text-sm text-navy/60">
          Nothing to compare yet - tap the scale icon on a product card to add it here.
        </p>
        <Link to="/products" className="mt-2 inline-block w-fit text-sm text-orange hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-navy">Compare products</h1>

      {isLoading ? (
        <p className="text-navy/60">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `140px repeat(${products.length}, minmax(180px, 1fr))` }}
          >
            <div />
            {products.map((p) => (
              <div key={p.id} className="relative rounded-xl border border-cream-dark bg-white/60 p-3">
                <button
                  type="button"
                  onClick={() => remove(p.slug)}
                  aria-label="Remove from compare"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-navy/50 shadow-sm hover:text-navy"
                >
                  <X size={14} />
                </button>
                <Link to={`/products/${p.slug}`} className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-cream">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0].image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <ShoppingBag size={24} className="text-navy/30" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm font-medium text-navy hover:text-orange">{p.name}</p>
                </Link>
              </div>
            ))}

            {ROWS.map((row) => (
              <div key={row.label} className="contents">
                <div className="flex items-center border-t border-cream-dark py-2 text-xs font-medium text-text-muted">
                  {row.label}
                </div>
                {products.map((p) => (
                  <div key={p.id} className="border-t border-cream-dark py-2 text-sm">
                    {row.render(p)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
