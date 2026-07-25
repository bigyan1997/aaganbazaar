import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { applyAsSeller, getMySellerProfile } from "../../api/sellers";
import { extractErrorMessage } from "../../utils/errors";

const inputClass = "w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

const STATUS_MESSAGES = {
  pending: "Your seller application is pending review.",
  approved: "You're an approved seller.",
  rejected: "Your seller application was not approved.",
  suspended: "Your seller account is currently suspended.",
};

export default function SellerApplyPage() {
  const [form, setForm] = useState({ store_name: "", description: "", contact_phone: "" });
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-seller-profile"],
    queryFn: getMySellerProfile,
    retry: false,
    throwOnError: false,
  });

  const mutation = useMutation({
    mutationFn: applyAsSeller,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-seller-profile"] }),
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  if (isLoading) return <p className="text-navy/60">Loading…</p>;

  if (profile) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <h1 className="mb-2 text-xl font-semibold text-navy">{profile.store_name}</h1>
        <p className="text-navy/70">{STATUS_MESSAGES[profile.status] ?? profile.status}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-semibold text-navy">Become a Seller</h1>
      <p className="mb-6 text-sm text-navy/60">
        Tell us about your store. An admin reviews every application before you can list products.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label className="mb-1 block text-sm text-navy">Store name</label>
          <input required value={form.store_name} onChange={update("store_name")} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-navy">Description</label>
          <textarea rows={3} value={form.description} onChange={update("description")} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-navy">Contact phone</label>
          <input value={form.contact_phone} onChange={update("contact_phone")} className={inputClass} />
        </div>

        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-orange px-4 py-2 font-medium text-cream hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}
