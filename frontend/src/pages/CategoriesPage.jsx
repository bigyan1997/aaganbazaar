import { useQuery } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";

import { getCategories } from "../api/catalog";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy">All Categories</h1>
        <p className="text-sm text-navy-light">Browse everything on Aaganbazaar by category.</p>
      </div>

      {isLoading ? (
        <p className="text-navy/60">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="flex flex-col overflow-hidden rounded-xl border border-cream-dark bg-white/60 transition hover:shadow-md"
            >
              <div className="flex h-28 items-center justify-center bg-cream">
                {category.image ? (
                  <img src={category.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <LayoutGrid size={26} className="text-navy" strokeWidth={1.5} />
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-navy">{category.name}</p>
                {category.product_count != null && (
                  <p className="text-xs text-navy/50">
                    {category.product_count} {category.product_count === 1 ? "product" : "products"}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
