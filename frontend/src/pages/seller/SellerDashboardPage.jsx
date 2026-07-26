import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

import { applyBulkDiscount, createProduct, getCategories, getMyProducts, updateProduct } from "../../api/catalog";
import ProductImageManager from "../../components/seller/ProductImageManager";
import { extractErrorMessage } from "../../utils/errors";

const inputClass = "w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

const emptyForm = { category: "", name: "", description: "", price: "", stock_quantity: "" };

export default function SellerDashboardPage() {
  const [form, setForm] = useState(emptyForm);
  const [expandedSlug, setExpandedSlug] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [discountInput, setDiscountInput] = useState("15");
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: products, isLoading } = useQuery({ queryKey: ["my-products"], queryFn: () => getMyProducts() });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      setForm(emptyForm);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ slug, is_active }) => updateProduct(slug, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-products"] }),
  });

  const bulkDiscountMutation = useMutation({
    mutationFn: (discountPercent) => applyBulkDiscount([...selected], discountPercent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      setSelected(new Set());
    },
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div>
        <h1 className="mb-4 text-xl font-semibold text-navy">My Products</h1>

        {selected.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded border border-orange/30 bg-orange/5 p-2.5 text-sm">
            <span className="text-navy">{selected.size} selected</span>
            <input
              type="number"
              min="1"
              max="99"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="w-16 rounded border border-navy/20 px-2 py-1 text-sm"
            />
            <span className="text-navy/60">% off</span>
            <button
              type="button"
              onClick={() => bulkDiscountMutation.mutate(Number(discountInput))}
              disabled={bulkDiscountMutation.isPending}
              className="rounded bg-orange px-3 py-1 text-xs font-medium text-cream hover:opacity-90 disabled:opacity-50"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => bulkDiscountMutation.mutate(null)}
              disabled={bulkDiscountMutation.isPending}
              className="rounded border border-navy/20 px-3 py-1 text-xs text-navy hover:bg-cream"
            >
              Remove discount
            </button>
            {bulkDiscountMutation.isError && (
              <p className="w-full text-xs text-red-600">{extractErrorMessage(bulkDiscountMutation.error)}</p>
            )}
          </div>
        )}

        {isLoading ? (
          <p className="text-navy/60">Loading…</p>
        ) : products?.results?.length ? (
          <ul className="flex flex-col divide-y divide-navy/10 rounded border border-navy/10">
            {products.results.map((product) => (
              <li key={product.id} className="p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleSelected(product.id)}
                      className="h-4 w-4"
                    />
                    {product.primary_image ? (
                      <img
                        src={product.primary_image}
                        alt=""
                        className="h-10 w-10 rounded border border-navy/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded border border-navy/10 bg-cream text-navy/40">
                        <ImageIcon size={16} />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-navy">{product.name}</p>
                      <p className="text-navy/60">
                        {product.discount_percent ? (
                          <>
                            <span className="text-orange">Rs. {product.sale_price}</span>{" "}
                            <span className="line-through">Rs. {product.price}</span>{" "}
                            <span className="rounded bg-orange/10 px-1 text-orange">
                              -{product.discount_percent}%
                            </span>
                          </>
                        ) : (
                          `Rs. ${product.price}`
                        )}{" "}
                        · {product.stock_quantity} in stock
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSlug(expandedSlug === product.slug ? null : product.slug)}
                      className="rounded border border-navy/20 px-2 py-1 text-xs"
                    >
                      {expandedSlug === product.slug ? "Hide images" : "Manage images"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        toggleActiveMutation.mutate({ slug: product.slug, is_active: !product.is_active })
                      }
                      className="rounded border border-navy/20 px-2 py-1 text-xs"
                    >
                      {product.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
                {expandedSlug === product.slug && <ProductImageManager slug={product.slug} />}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-navy/60">You haven't listed any products yet.</p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-navy">Add a product</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-navy">Category</label>
            <select required value={form.category} onChange={update("category")} className={inputClass}>
              <option value="" disabled>
                Select a category
              </option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-navy">Name</label>
            <input required value={form.name} onChange={update("name")} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-navy">Description</label>
            <textarea rows={3} value={form.description} onChange={update("description")} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-navy">Price (Rs.)</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={update("price")} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-navy">Stock</label>
              <input required type="number" min="0" value={form.stock_quantity} onChange={update("stock_quantity")} className={inputClass} />
            </div>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">{extractErrorMessage(createMutation.error)}</p>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded bg-orange px-4 py-2 font-medium text-cream hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating…" : "Create product"}
          </button>
        </form>
      </div>
    </div>
  );
}
