import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getSellers } from "../api/sellers";
import StarRating from "../components/catalog/StarRating";

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
        <p className="text-sm text-navy-light">
          {typeof data?.count === "number"
            ? `${data.count} local ${data.count === 1 ? "store" : "stores"} on Aaganbazaar`
            : "Browse local sellers on Aaganbazaar"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex max-w-sm gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search stores by name"
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stores.map((seller) => (
            <div
              key={seller.id}
              className="flex flex-col gap-3 rounded-xl border border-cream-dark bg-white/60 p-4 transition hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream text-orange">
                  {seller.logo ? (
                    <img src={seller.logo} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <Store size={24} strokeWidth={1.75} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-text-muted">
                    Since {new Date(seller.created_at).getFullYear()}
                  </p>
                  <p className="truncate font-medium text-navy">{seller.store_name}</p>
                  {seller.average_rating != null && (
                    <StarRating rating={seller.average_rating} size={12} />
                  )}
                </div>
              </div>

              {seller.description && (
                <p className="line-clamp-2 text-sm text-navy/70">{seller.description}</p>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-cream-dark pt-3">
                <span className="rounded bg-cream px-2 py-1 text-xs font-medium text-navy">
                  {seller.product_count} {seller.product_count === 1 ? "product" : "products"}
                </span>
                <Link
                  to={`/sellers/${seller.slug}`}
                  className="flex min-h-11 items-center rounded-lg bg-orange px-3 text-sm font-medium text-cream hover:opacity-90"
                >
                  Visit Store →
                </Link>
              </div>
            </div>
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
