import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getCategories, getProducts } from "../../api/catalog";
import NewArrivals from "../../components/catalog/NewArrivals";
import ProductCard from "../../components/catalog/ProductCard";
import ProductFilters from "../../components/catalog/ProductFilters";

const PAGE_SIZE_OPTIONS = ["20", "50", "100"];

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const withGaps = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) withGaps.push("…");
    withGaps.push(p);
  });
  return withGaps;
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const ordering = searchParams.get("ordering") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const inStock = searchParams.get("in_stock") === "true";
  const onSale = searchParams.get("on_sale") === "true";
  const pageSize = searchParams.get("page_size") || "20";
  const page = searchParams.get("page") || "1";

  const [priceForm, setPriceForm] = useState({ min: minPrice, max: maxPrice });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data, isLoading } = useQuery({
    queryKey: ["products", { search, category, ordering, minPrice, maxPrice, inStock, onSale, pageSize, page }],
    queryFn: () =>
      getProducts({
        ...(search && { search }),
        ...(category && { category }),
        ...(ordering && { ordering }),
        ...(minPrice && { min_price: minPrice }),
        ...(maxPrice && { max_price: maxPrice }),
        ...(inStock && { in_stock: "true" }),
        ...(onSale && { on_sale: "true" }),
        page_size: pageSize,
        page,
      }),
    staleTime: 1000 * 30,
  });

  const updateParam = (key, value, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage) next.delete("page");
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
    setFiltersOpen(false);
  };

  const clearAllFilters = () => {
    setPriceForm({ min: "", max: "" });
    const next = new URLSearchParams(searchParams);
    ["category", "min_price", "max_price", "in_stock", "on_sale", "page"].forEach((k) => next.delete(k));
    setSearchParams(next);
    setFiltersOpen(false);
  };

  const goToPage = (n) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", n);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasNext = Boolean(data?.next);
  const hasPrevious = Boolean(data?.previous);
  const totalPages = data?.count ? Math.max(1, Math.ceil(data.count / Number(pageSize))) : 1;
  const currentPage = Number(page);
  const pageRange = buildPageRange(currentPage, totalPages);

  const activeCategory = categories?.find((c) => c.slug === category);
  const hasActiveFilters = Boolean(category || minPrice || maxPrice || inStock || onSale);

  const filterProps = {
    categories,
    category,
    onSelectCategory: (slug) => updateParam("category", slug),
    priceForm,
    onPriceFieldChange: (field, value) => setPriceForm((f) => ({ ...f, [field]: value })),
    onApplyPrice: applyPriceFilter,
    inStock,
    onInStockChange: (checked) => updateParam("in_stock", checked ? "true" : ""),
    onSale,
    onOnSaleChange: (checked) => updateParam("on_sale", checked ? "true" : ""),
    hasActiveFilters,
    onClearAll: clearAllFilters,
  };

  return (
    <div className="flex flex-col gap-6">
      {activeCategory ? (
        <div className="overflow-hidden rounded-2xl bg-navy">
          <div className="flex flex-col gap-2 p-6">
            <nav className="text-xs text-cream/70">
              <Link to="/" className="hover:text-cream">
                Home
              </Link>{" "}
              /{" "}
              <Link to="/products" className="hover:text-cream">
                Products
              </Link>{" "}
              / <span className="text-cream">{activeCategory.name}</span>
            </nav>
            <h1 className="text-2xl font-semibold text-cream">{activeCategory.name}</h1>
            {activeCategory.description && (
              <p className="max-w-xl text-sm text-cream/70">{activeCategory.description}</p>
            )}
          </div>
        </div>
      ) : (
        <h1 className="text-xl font-semibold text-navy">{search ? `Results for "${search}"` : "All Products"}</h1>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-sm text-navy-light">
          {isLoading ? "Loading…" : `${data?.count ?? 0} ${data?.count === 1 ? "item" : "items"} found`}
        </p>

        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex min-h-11 items-center gap-1.5 rounded border border-navy/20 px-3 text-sm lg:hidden"
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-orange" />}
        </button>

        <select
          value={pageSize}
          onChange={(e) => updateParam("page_size", e.target.value)}
          className="min-h-11 rounded border border-navy/20 px-2 py-1.5 text-sm"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              Show {n}
            </option>
          ))}
        </select>

        <select
          value={ordering}
          onChange={(e) => updateParam("ordering", e.target.value)}
          className="min-h-11 rounded border border-navy/20 px-2 py-1.5 text-sm"
        >
          <option value="">Sort: Newest</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="-average_rating">Top Rated</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-6">
          {isLoading ? (
            <p className="text-navy/60">Loading products…</p>
          ) : data?.results?.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {data.results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button
                  type="button"
                  disabled={!hasPrevious}
                  onClick={() => goToPage(currentPage - 1)}
                  aria-label="Previous page"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded border border-navy/20 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {pageRange.map((p, i) =>
                  p === "…" ? (
                    <span key={`gap-${i}`} className="px-1 text-navy/40">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(p)}
                      aria-current={p === currentPage ? "page" : undefined}
                      className={`flex min-h-11 min-w-11 items-center justify-center rounded text-sm ${
                        p === currentPage ? "bg-orange text-white" : "border border-navy/20 hover:bg-cream"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => goToPage(currentPage + 1)}
                  aria-label="Next page"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded border border-navy/20 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <p className="text-navy/60">No products found.</p>
          )}
        </div>

        <aside className="hidden lg:flex lg:flex-col lg:gap-8">
          <ProductFilters {...filterProps} />
          <NewArrivals />
        </aside>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-navy/40"
          />
          <div className="absolute inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-cream p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-navy after:absolute after:-inset-1 after:content-['']"
              >
                <X size={18} />
              </button>
            </div>
            <ProductFilters {...filterProps} />
          </div>
        </div>
      )}
    </div>
  );
}
