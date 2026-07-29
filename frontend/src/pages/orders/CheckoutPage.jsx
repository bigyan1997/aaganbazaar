import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCart } from "../../api/cart";
import { checkout } from "../../api/orders";
import { extractErrorMessage } from "../../utils/errors";

const inputClass =
  "min-h-11 w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

const PROVINCES = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];

export default function CheckoutPage() {
  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: getCart });
  const [form, setForm] = useState({
    shipping_full_name: "",
    shipping_phone: "",
    shipping_address_line: "",
    shipping_city: "",
    shipping_district: "",
    shipping_province: PROVINCES[0],
    payment_method: "cod",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: checkout,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate(`/orders/${order.order_number}`, { replace: true });
    },
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (!cart?.items?.length) {
    return <p className="text-navy/60">Your cart is empty — nothing to check out.</p>;
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-navy">Shipping details</h1>

        <div>
          <label className="mb-1 block text-sm text-navy">Full name</label>
          <input required value={form.shipping_full_name} onChange={update("shipping_full_name")} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-navy">Phone</label>
          <input
            required
            type="tel"
            inputMode="tel"
            value={form.shipping_phone}
            onChange={update("shipping_phone")}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-navy">Address</label>
          <input required value={form.shipping_address_line} onChange={update("shipping_address_line")} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-navy">City</label>
            <input required value={form.shipping_city} onChange={update("shipping_city")} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-navy">District</label>
            <input required value={form.shipping_district} onChange={update("shipping_district")} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-navy">Province</label>
          <select value={form.shipping_province} onChange={update("shipping_province")} className={inputClass}>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-navy">Payment method</label>
          <select value={form.payment_method} onChange={update("payment_method")} className={inputClass}>
            <option value="cod">Cash on delivery</option>
            <option value="esewa">eSewa</option>
            <option value="khalti">Khalti</option>
          </select>
        </div>

        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="min-h-11 rounded bg-orange px-4 py-2 font-medium text-cream hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Placing order…" : "Place order"}
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-navy">Order summary</h2>
        <ul className="flex flex-col divide-y divide-navy/10 rounded border border-navy/10">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between p-3 text-sm">
              <span className="text-navy">
                {item.product_name} × {item.quantity}
              </span>
              <span className="font-medium text-orange">Rs. {item.line_total}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between text-lg font-semibold text-navy">
          <span>Total</span>
          <span>Rs. {cart.total}</span>
        </div>
        {Number(cart.total_savings) > 0 && (
          <p className="text-right text-sm text-orange">You saved Rs. {cart.total_savings}</p>
        )}
      </div>
    </div>
  );
}
