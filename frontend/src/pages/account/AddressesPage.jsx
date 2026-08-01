import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2 } from "lucide-react";
import { useState } from "react";

import { createAddress, deleteAddress, getAddresses, updateAddress } from "../../api/addresses";
import { PROVINCES } from "../../utils/constants";
import { extractErrorMessage } from "../../utils/errors";

const inputClass =
  "min-h-11 w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

const EMPTY_FORM = {
  full_name: "",
  phone: "",
  address_line: "",
  city: "",
  district: "",
  province: PROVINCES[0],
};

export default function AddressesPage() {
  const { data: addresses, isLoading } = useQuery({ queryKey: ["addresses"], queryFn: getAddresses });
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["addresses"] });

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      invalidate();
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (id) => updateAddress(id, { is_default: true }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: invalidate,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  if (isLoading) return <p className="text-navy/60">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      {addresses?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="flex flex-col gap-2 rounded-lg border border-cream-dark bg-white/60 p-4">
              <div className="flex items-start justify-between">
                <p className="font-medium text-navy">{addr.full_name}</p>
                {addr.is_default && (
                  <span className="flex items-center gap-1 text-xs font-medium text-orange">
                    <Star size={12} className="fill-orange" /> Default
                  </span>
                )}
              </div>
              <p className="text-sm text-navy-light">
                {addr.address_line}, {addr.city}, {addr.district}, {addr.province}
              </p>
              <p className="text-sm text-navy-light">{addr.phone}</p>
              <div className="mt-2 flex items-center gap-3 border-t border-cream-dark pt-3 text-sm">
                {!addr.is_default && (
                  <button
                    type="button"
                    onClick={() => defaultMutation.mutate(addr.id)}
                    className="text-orange hover:underline"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(addr.id)}
                  className="ml-auto flex items-center gap-1 text-navy/50 hover:text-red-600"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-navy/60">No saved addresses yet.</p>
      )}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-lg border border-cream-dark bg-white/60 p-4"
        >
          <p className="text-sm font-medium text-navy">New address</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className={inputClass}
            />
            <input
              required
              type="tel"
              inputMode="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
            />
          </div>
          <input
            required
            placeholder="Address"
            value={form.address_line}
            onChange={(e) => setForm((f) => ({ ...f, address_line: e.target.value }))}
            className={inputClass}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className={inputClass}
            />
            <input
              required
              placeholder="District"
              value={form.district}
              onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
              className={inputClass}
            />
            <select
              value={form.province}
              onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
              className={inputClass}
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">{extractErrorMessage(createMutation.error)}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="min-h-11 rounded bg-orange px-4 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-h-11 rounded border border-navy/20 px-4 text-sm hover:bg-cream"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="min-h-11 self-start rounded border border-navy/20 px-4 text-sm hover:bg-cream"
        >
          + Add a new address
        </button>
      )}
    </div>
  );
}
