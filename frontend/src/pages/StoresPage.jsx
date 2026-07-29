import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getSellers } from "../api/sellers";

export default function StoresPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);

  const { data, isLoading } = useQuery({
    queryKey: ["sellers", { search }],
    queryFn: () => getSellers({ ...(search && { search }) }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set("search", searchInput.trim());
    else next.delete("search");
    setSearchParams(next);
  };

  const stores = data?.results ?? data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy">Stores</h1>
        <p className="text-sm text-navy-light">Browse local sellers on Aaganbazaar</p>
      </div>

      <form onSubmit={handleSubmit} className="flex max-w-sm gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search stores"
          className="min-h-11 flex-1 rounded border border-navy/20 px-3 py-1.5 text-sm focus:border-orange focus:outline-none"
        />
        <button
          type="submit"
          className="min-h-11 rounded border border-navy/20 px-3 py-1.5 text-sm hover:bg-cream"
        >
          Search
        </button>
      </form>

      {isLoading ? (
        <p className="text-navy/60">Loading…</p>
      ) : stores.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {stores.map((seller) => (
            <Link
              key={seller.id}
              to={`/sellers/${seller.slug}`}
              className="flex flex-col gap-2 rounded-xl border border-cream-dark bg-white/60 p-4 transition hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-orange">
                  <Store size={20} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{seller.store_name}</p>
                  <p className="text-xs text-navy-light">
                    {seller.product_count} {seller.product_count === 1 ? "product" : "products"}
                  </p>
                </div>
              </div>
              {seller.description && (
                <p className="line-clamp-2 text-sm text-navy/70">{seller.description}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-navy/60">
          {search ? `No stores match "${search}".` : "No stores yet - check back soon."}
        </p>
      )}
    </div>
  );
}
