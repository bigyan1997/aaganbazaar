import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { getCategory, getProducts } from "../api/catalog";
import ProductCard from "../components/catalog/ProductCard";

export default function CategoryDealsPage() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("page") || "1";

  const { data: category, isError: categoryError } = useQuery({
    queryKey: ["category", categorySlug],
    queryFn: () => getCategory(categorySlug),
  });
  const { data, isLoading } = useQuery({
    queryKey: ["products", { category__slug: categorySlug, on_sale: "true", ordering: "-discount_percent", page }],
    queryFn: () =>
      getProducts({ category__slug: categorySlug, on_sale: "true", ordering: "-discount_percent", page }),
    staleTime: 0,
  });

  const goToPage = (n) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", n);
    setSearchParams(next);
  };

  if (categoryError) {
    return (
      <p className="text-sm text-navy/60">
        Category not found. <Link to="/deals" className="text-orange hover:underline">Back to deals</Link>
      </p>
    );
  }

  const hasNext = Boolean(data?.next);
  const hasPrevious = Boolean(data?.previous);
  const maxDiscount = data?.results?.[0]?.discount_percent;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-navy p-6 text-white">
        <p className="text-xs text-cream-dark">Sellout</p>
        <h1 className="text-2xl font-semibold">
          {category?.name ?? "Deals"} Sellout{maxDiscount ? ` — up to ${maxDiscount}% off` : ""}
        </h1>
      </div>

      {isLoading ? (
        <p className="text-navy/60">Loading…</p>
      ) : data?.results?.length ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {data.results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={!hasPrevious}
              onClick={() => goToPage(Number(page) - 1)}
              className="rounded border border-navy/20 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-navy/70">Page {page}</span>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => goToPage(Number(page) + 1)}
              className="rounded border border-navy/20 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-navy/60">
          No active deals in this category right now. <Link to="/deals" className="text-orange hover:underline">See other deals</Link>
        </p>
      )}
    </div>
  );
}
