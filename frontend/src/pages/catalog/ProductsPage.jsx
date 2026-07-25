import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { getCategories, getProducts } from "../../api/catalog";
import ProductCard from "../../components/catalog/ProductCard";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category__slug") || "";
  const ordering = searchParams.get("ordering") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const inStock = searchParams.get("in_stock") === "true";
  const page = searchParams.get("page") || "1";

  const [priceForm, setPriceForm] = useState({ min: minPrice, max: maxPrice });

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data, isLoading } = useQuery({
    queryKey: ["products", { search, category, ordering, minPrice, maxPrice, inStock, page }],
    queryFn: () =>
      getProducts({
        ...(search && { search }),
        ...(category && { category__slug: category }),
        ...(ordering && { ordering }),
        ...(minPrice && { min_price: minPrice }),
        ...(maxPrice && { max_price: maxPrice }),
        ...(inStock && { in_stock: "true" }),
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

  const applyPriceFilter = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (priceForm.min) next.set("min_price", priceForm.min);
    else next.delete("min_price");
    if (priceForm.max) next.set("max_price", priceForm.max);
    else next.delete("max_price");
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

      <div className="flex flex-wrap items-center gap-3 rounded border border-navy/10 bg-white/60 p-3">
        <form onSubmit={applyPriceFilter} className="flex items-center gap-2">
          <span className="text-sm text-navy-light">Price</span>
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceForm.min}
            onChange={(e) => setPriceForm((f) => ({ ...f, min: e.target.value }))}
            className="w-20 rounded border border-navy/20 px-2 py-1 text-sm"
          />
          <span className="text-navy-light">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceForm.max}
            onChange={(e) => setPriceForm((f) => ({ ...f, max: e.target.value }))}
            className="w-20 rounded border border-navy/20 px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded border border-navy/20 px-3 py-1 text-sm hover:bg-cream">
            Apply
          </button>
        </form>

        <label className="flex items-center gap-1.5 text-sm text-navy-light">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParam("in_stock", e.target.checked ? "true" : "")}
          />
          In stock only
        </label>
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
