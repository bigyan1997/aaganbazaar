export default function ProductFilters({
  categories,
  category,
  onSelectCategory,
  priceForm,
  onPriceFieldChange,
  onApplyPrice,
  inStock,
  onInStockChange,
  onSale,
  onOnSaleChange,
  hasActiveFilters,
  onClearAll,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy">Category</h2>
          {hasActiveFilters && (
            <button type="button" onClick={onClearAll} className="text-xs text-orange hover:underline">
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => onSelectCategory("")}
            className={`flex min-h-11 items-center justify-between rounded-lg px-2 text-sm ${
              category === "" ? "bg-orange/10 font-medium text-orange" : "text-navy-light hover:bg-cream"
            }`}
          >
            All categories
          </button>
          {categories?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCategory(c.slug)}
              className={`flex min-h-11 items-center justify-between rounded-lg px-2 text-sm ${
                category === c.slug ? "bg-orange/10 font-medium text-orange" : "text-navy-light hover:bg-cream"
              }`}
            >
              <span className="truncate">{c.name}</span>
              {c.product_count != null && (
                <span className="ml-2 shrink-0 text-xs text-navy/40">{c.product_count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-navy">Price (Rs.)</h2>
        <form onSubmit={onApplyPrice} className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="Min"
            value={priceForm.min}
            onChange={(e) => onPriceFieldChange("min", e.target.value)}
            className="min-h-11 w-0 flex-1 rounded border border-navy/20 px-2 py-1 text-sm"
          />
          <span className="text-navy-light">–</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="Max"
            value={priceForm.max}
            onChange={(e) => onPriceFieldChange("max", e.target.value)}
            className="min-h-11 w-0 flex-1 rounded border border-navy/20 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="min-h-11 shrink-0 rounded border border-navy/20 px-3 text-sm hover:bg-cream"
          >
            Go
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-navy">Availability</h2>
        <div className="flex flex-col gap-1">
          <label className="flex min-h-11 items-center gap-2 text-sm text-navy-light">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => onInStockChange(e.target.checked)}
              className="h-4 w-4"
            />
            In stock only
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-navy-light">
            <input
              type="checkbox"
              checked={onSale}
              onChange={(e) => onOnSaleChange(e.target.checked)}
              className="h-4 w-4"
            />
            On sale
          </label>
        </div>
      </div>
    </div>
  );
}
