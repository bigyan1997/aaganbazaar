import { useQuery } from "@tanstack/react-query";

import { getCategoryDeals } from "../api/catalog";
import DealCategoryTile from "../components/home/DealCategoryTile";

export default function DealsHubPage() {
  const { data, isLoading } = useQuery({ queryKey: ["category-deals"], queryFn: getCategoryDeals });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-navy">Deals</h1>
        <p className="text-sm text-navy-light">Discounted products, grouped by category</p>
      </div>

      {isLoading ? (
        <p className="text-navy/60">Loading…</p>
      ) : data?.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {data.map((category) => (
            <DealCategoryTile key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-navy/60">No active deals right now - check back soon.</p>
      )}
    </div>
  );
}
