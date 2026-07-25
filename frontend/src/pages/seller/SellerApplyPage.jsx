import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ClipboardList, Package, Percent, ShoppingBag, Store } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { applyAsSeller, getMySellerProfile } from "../../api/sellers";
import useAuthStore from "../../store/authStore";
import { extractErrorMessage } from "../../utils/errors";

const inputClass = "w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

const STATUS_MESSAGES = {
  pending: "Your application is pending review. We'll let you know as soon as it's decided.",
  approved: "You're an approved seller.",
  rejected: "Your seller application was not approved.",
  suspended: "Your seller account is currently suspended.",
};

const BENEFITS = [
  { icon: Package, title: "List products in minutes", body: "Add photos, pricing, and stock from a simple dashboard." },
  { icon: ClipboardList, title: "Track every order", body: "Confirm, ship, and mark delivered - all in one place." },
  { icon: Bell, title: "Get notified instantly", body: "An email lands the moment someone buys from you." },
  { icon: Store, title: "Your own storefront", body: "A public page showcasing everything you sell." },
  { icon: ShoppingBag, title: "Reach buyers nationwide", body: "Every buyer on Aaganbazaar is looking for local sellers." },
  { icon: Percent, title: "Transparent commission", body: "One clear rate, no hidden fees." },
];

const STEPS = [
  { title: "Create your Aaganbazaar account", body: "Register with your email - takes less than a minute." },
  { title: "Apply to become a seller", body: "Tell us your store name and a bit about what you sell." },
  { title: "Get approved by our team", body: "We review every application before you can list anything." },
  { title: "List your products and start selling", body: "Add your catalog and buyers can find you right away." },
];

function SignupCard() {
  const status = useAuthStore((s) => s.status);
  const [form, setForm] = useState({ store_name: "", description: "", contact_phone: "" });
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-seller-profile"],
    queryFn: getMySellerProfile,
    enabled: status === "authenticated",
    retry: false,
    throwOnError: false,
  });

  const mutation = useMutation({
    mutationFn: applyAsSeller,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-seller-profile"] }),
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <div className="rounded-2xl bg-white p-6 shadow-xl">Loading…</div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-navy">Sign up to sell</h2>
        <p className="mb-4 text-sm text-text-muted">Create a buyer account first, then apply to sell - it's quick.</p>
        <Link
          to="/register"
          className="block rounded-lg bg-orange px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-dark"
        >
          Create an account
        </Link>
        <p className="mt-3 text-center text-xs text-text-muted">
          Already have one?{" "}
          <Link to="/login" state={{ from: { pathname: "/sell" } }} className="text-orange hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  if (profile) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-navy">{profile.store_name}</h2>
        <p className="text-sm text-text-muted">{STATUS_MESSAGES[profile.status] ?? profile.status}</p>
        {profile.status === "approved" && (
          <Link
            to="/seller/dashboard"
            className="mt-4 block rounded-lg bg-orange px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-dark"
          >
            Go to dashboard
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="mb-1 text-lg font-semibold text-navy">Sign up as a seller</h2>
      <p className="mb-4 text-sm text-text-muted">An admin reviews every application before you can list products.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
        className="flex flex-col gap-3"
      >
        <input
          required
          placeholder="Store name"
          value={form.store_name}
          onChange={update("store_name")}
          className={inputClass}
        />
        <textarea
          rows={2}
          placeholder="What do you sell? (optional)"
          value={form.description}
          onChange={update("description")}
          className={inputClass}
        />
        <input
          placeholder="Contact phone (optional)"
          value={form.contact_phone}
          onChange={update("contact_phone")}
          className={inputClass}
        />

        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-orange px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-dark disabled:opacity-50"
        >
          {mutation.isPending ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}

export default function SellerApplyPage() {
  return (
    <div className="-mx-4 flex flex-col">
      {/* Hero */}
      <div className="bg-navy px-4 py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
              Grow your business with Aaganbazaar
            </h1>
            <p className="mt-4 text-cream-dark">
              Join local sellers reaching buyers across Nepal - list your products, manage orders, and get paid for
              what you sell.
            </p>
          </div>
          <SignupCard />
        </div>
      </div>

      {/* Benefits */}
      <div className="mx-auto w-full max-w-5xl px-4 py-14">
        <h2 className="mb-8 text-center text-2xl font-semibold text-navy">New Seller Benefits</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-dark">
                <Icon size={22} className="text-orange" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-medium text-navy">{title}</p>
              <p className="mt-1 text-xs text-text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-cream-dark px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-semibold text-navy">Steps to Start Selling</h2>
          <ol className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-lg bg-white p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-navy">{step.title}</p>
                  <p className="text-xs text-text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
