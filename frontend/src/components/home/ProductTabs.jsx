import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getProducts } from "../../api/catalog";
import ProductCard from "../catalog/ProductCard";

const TABS = [
  { key: "new", label: "New Arrivals", ordering: "-created_at" },
  { key: "top-rated", label: "Top Rated", ordering: "-average_rating" },
  { key: "best-deals", label: "Best Deals", ordering: "-discount_percent" },
  { key: "budget", label: "Budget Picks", ordering: "price" },
];

export default function ProductTabs() {
  const [activeKey, setActiveKey] = useState(TABS[0].key);
  const active = TABS.find((t) => t.key === activeKey);

  const { data, isLoading } = useQuery({
    queryKey: ["products", { page_size: 10, ordering: active.ordering }],
    queryFn: () => getProducts({ page_size: 10, ordering: active.ordering }),
    staleTime: 1000 * 30,
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5 border-b border-cream-dark pb-2.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveKey(tab.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              tab.key === activeKey
                ? "bg-orange text-white"
                : "bg-white/60 text-navy-light hover:bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-navy/60">Loading…</p>
      ) : data?.results?.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
          {data.results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-navy/60">No products yet — check back soon.</p>
      )}
    </div>
  );
}
