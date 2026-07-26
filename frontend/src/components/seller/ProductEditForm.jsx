import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { getCategories, updateProduct } from "../../api/catalog";
import { extractErrorMessage } from "../../utils/errors";

const inputClass = "w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

export default function ProductEditForm({ product, onDone }) {
  const [form, setForm] = useState({
    category: product.category,
    name: product.name,
    description: product.description || "",
    price: product.price,
    stock_quantity: product.stock_quantity,
  });
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  const mutation = useMutation({
    mutationFn: () => updateProduct(product.slug, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onDone();
    },
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="mt-3 flex flex-col gap-3 rounded border border-navy/10 bg-cream/60 p-3"
    >
      <div>
        <label className="mb-1 block text-xs text-navy">Category</label>
        <select required value={form.category} onChange={update("category")} className={inputClass}>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-navy">Name</label>
        <input required value={form.name} onChange={update("name")} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-navy">Description</label>
        <textarea rows={2} value={form.description} onChange={update("description")} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-navy">Price (Rs.)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={update("price")}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy">Stock</label>
          <input
            required
            type="number"
            min="0"
            value={form.stock_quantity}
            onChange={update("stock_quantity")}
            className={inputClass}
          />
        </div>
      </div>

      {mutation.isError && <p className="text-xs text-red-600">{extractErrorMessage(mutation.error)}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-orange px-3 py-1.5 text-xs font-medium text-cream hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded border border-navy/20 px-3 py-1.5 text-xs text-navy hover:bg-cream-dark"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
