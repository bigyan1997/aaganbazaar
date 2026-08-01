import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchMe, resendVerification, updateProfile } from "../../api/auth";
import Avatar from "../../components/layout/Avatar";
import { extractErrorMessage } from "../../utils/errors";

const ROLE_LABELS = { buyer: "Buyer", seller: "Seller", admin: "Admin" };
const inputClass =
  "min-h-11 w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

export default function ProfilePage() {
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const queryClient = useQueryClient();
  const [resendMessage, setResendMessage] = useState("");
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user && !form) {
      setForm({ first_name: user.first_name, last_name: user.last_name, phone_number: user.phone_number });
    }
  }, [user, form]);

  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: () => setResendMessage("Verification email sent."),
  });

  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading || !user || !form) return <p className="text-navy/60">Loading…</p>;

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-cream-dark bg-white/60 p-5">
        <p className="mb-4 text-sm font-medium text-navy">My details</p>
        <div className="mb-4 flex items-center gap-3">
          <Avatar user={user} size={48} />
          <div>
            <p className="font-medium text-navy">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-text-muted">{user.email}</p>
            {user.auth_provider === "google" && (
              <p className="mt-0.5 text-xs text-navy/50">Signed up with Google</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 border-t border-cream-dark pt-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-navy">First name</label>
            <input
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-navy">Last name</label>
            <input
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-navy">
              Phone number
              {user.phone_number && (
                <span
                  className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    user.is_phone_verified ? "bg-green-100 text-green-700" : "bg-cream-dark text-navy-light"
                  }`}
                >
                  {user.is_phone_verified ? "Verified" : "Unverified"}
                </span>
              )}
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={form.phone_number}
              onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <p className="mb-1 text-sm text-text-muted">Email status</p>
            <p className="text-navy">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  user.is_email_verified ? "bg-green-100 text-green-700" : "bg-cream-dark text-navy-light"
                }`}
              >
                {user.is_email_verified ? "Verified" : "Unverified"}
              </span>
              {!user.is_email_verified && (
                <button
                  type="button"
                  onClick={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending}
                  className="ml-2 text-xs text-orange hover:underline disabled:opacity-50"
                >
                  {resendMutation.isPending ? "Sending…" : "Resend link"}
                </button>
              )}
            </p>
            {resendMessage && <p className="mt-1 text-xs text-navy/60">{resendMessage}</p>}
          </div>

          {saveMutation.isError && (
            <p className="text-sm text-red-600 sm:col-span-2">{extractErrorMessage(saveMutation.error)}</p>
          )}

          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="min-h-11 rounded bg-orange px-4 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving…" : "Save changes"}
            </button>
            {saved && <span className="text-sm text-navy/60">Saved.</span>}
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-cream-dark bg-white/60 p-5">
        <p className="mb-4 text-sm font-medium text-navy">Account</p>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-text-muted">Account type</p>
            <p className="text-navy">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
          <div>
            <p className="text-text-muted">Member since</p>
            <p className="text-navy">
              {new Date(user.date_joined).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
            </p>
          </div>
        </div>
        {user.role !== "seller" && (
          <p className="mt-4 text-sm text-navy/70">
            Want to sell on Aaganbazaar?{" "}
            <Link to="/sell" className="text-orange hover:underline">
              Apply here
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
