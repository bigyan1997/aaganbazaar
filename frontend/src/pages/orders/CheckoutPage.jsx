import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createAddress, getAddresses } from "../../api/addresses";
import { getCart } from "../../api/cart";
import { checkout } from "../../api/orders";
import { PROVINCES } from "../../utils/constants";
import { extractErrorMessage } from "../../utils/errors";

const inputClass =
  "min-h-11 w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

const EMPTY_FORM = {
  shipping_full_name: "",
  shipping_phone: "",
  shipping_address_line: "",
  shipping_city: "",
  shipping_district: "",
  shipping_province: PROVINCES[0],
};

export default function CheckoutPage() {
  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: getCart });
  const { data: addresses } = useQuery({ queryKey: ["addresses"], queryFn: getAddresses });

  const [selectedAddressId, setSelectedAddressId] = useState(null); // null while undecided, "new", or an address id
  const [form, setForm] = useState(EMPTY_FORM);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [saveAddress, setSaveAddress] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedAddressId !== null || !addresses) return;
    const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];
    setSelectedAddressId(defaultAddress ? defaultAddress.id : "new");
  }, [addresses, selectedAddressId]);

  const mutation = useMutation({
    mutationFn: checkout,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate(`/orders/${order.order_number}`, { replace: true });
    },
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    let shipping;
    if (selectedAddressId === "new") {
      shipping = form;
      if (saveAddress) {
        createAddress({
          full_name: form.shipping_full_name,
          phone: form.shipping_phone,
          address_line: form.shipping_address_line,
          city: form.shipping_city,
          district: form.shipping_district,
          province: form.shipping_province,
        }).then(() => queryClient.invalidateQueries({ queryKey: ["addresses"] }));
      }
    } else {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      shipping = {
        shipping_full_name: addr.full_name,
        shipping_phone: addr.phone,
        shipping_address_line: addr.address_line,
        shipping_city: addr.city,
        shipping_district: addr.district,
        shipping_province: addr.province,
      };
    }

    mutation.mutate({ ...shipping, payment_method: paymentMethod });
  };

  if (!cart?.items?.length) {
    return <p className="text-navy/60">Your cart is empty — nothing to check out.</p>;
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-navy">Shipping details</h1>

        {addresses?.length > 0 && (
          <div className="flex flex-col gap-2">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex min-h-11 cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                  selectedAddressId === addr.id ? "border-orange bg-orange/5" : "border-navy/15"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span>
                  <span className="font-medium text-navy">{addr.full_name}</span>
                  {addr.is_default && <span className="ml-2 text-xs text-orange">Default</span>}
                  <br />
                  <span className="text-navy-light">
                    {addr.address_line}, {addr.city}, {addr.district}, {addr.province} — {addr.phone}
                  </span>
                </span>
              </label>
            ))}
            <label
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${
                selectedAddressId === "new" ? "border-orange bg-orange/5" : "border-navy/15"
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selectedAddressId === "new"}
                onChange={() => setSelectedAddressId("new")}
                className="h-4 w-4"
              />
              <span className="font-medium text-navy">+ Ship to a new address</span>
            </label>
          </div>
        )}

        {selectedAddressId === "new" && (
          <div className="flex flex-col gap-4 border-t border-navy/10 pt-4">
            <div>
              <label className="mb-1 block text-sm text-navy">Full name</label>
              <input
                required
                value={form.shipping_full_name}
                onChange={update("shipping_full_name")}
                className={inputClass}
              />
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
              <input
                required
                value={form.shipping_address_line}
                onChange={update("shipping_address_line")}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-navy">City</label>
                <input required value={form.shipping_city} onChange={update("shipping_city")} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-navy">District</label>
                <input
                  required
                  value={form.shipping_district}
                  onChange={update("shipping_district")}
                  className={inputClass}
                />
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
            <label className="flex min-h-11 items-center gap-2 text-sm text-navy-light">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-4 w-4"
              />
              Save this address for next time
            </label>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-navy">Payment method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
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
        <p className="mt-4 text-right text-xs text-navy/50">
          <Link to="/account/addresses" className="hover:underline">
            Manage saved addresses
          </Link>
        </p>
      </div>
    </div>
  );
}
