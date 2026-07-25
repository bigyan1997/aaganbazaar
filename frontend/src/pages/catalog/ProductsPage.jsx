import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getCategories, getProducts } from "../../api/catalog";
import ProductCard from "../../components/catalog/ProductCard";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category__slug") || "";
  const ordering = searchParams.get("ordering") || "";
  const page = searchParams.get("page") || "1";

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data, isLoading } = useQuery({
    queryKey: ["products", { search, category, ordering, page }],
    queryFn: () =>
      getProducts({
        ...(search && { search }),
        ...(category && { category__slug: category }),
        ...(ordering && { ordering }),
        page,
      }),
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const goToPage = (n) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", n);
    setSearchParams(next);
  };

  const hasNext = Boolean(data?.next);
  const hasPrevious = Boolean(data?.previous);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold text-navy">
          {search ? `Results for "${search}"` : "All Products"}
        </h1>

        <select
          value={category}
          onChange={(e) => updateParam("category__slug", e.target.value)}
          className="rounded border border-navy/20 px-2 py-1.5 text-sm"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={ordering}
          onChange={(e) => updateParam("ordering", e.target.value)}
          className="rounded border border-navy/20 px-2 py-1.5 text-sm"
        >
          <option value="">Sort: Newest</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-navy/60">Loading products…</p>
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
        <p className="text-navy/60">No products found.</p>
      )}
    </div>
  );
}
