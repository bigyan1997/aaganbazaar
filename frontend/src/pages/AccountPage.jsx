import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { fetchMe, resendVerification } from "../api/auth";

const ROLE_LABELS = { buyer: "Buyer", seller: "Seller", admin: "Admin" };

export default function AccountPage() {
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const [resendMessage, setResendMessage] = useState("");
  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: () => setResendMessage("Verification email sent."),
  });

  if (isLoading) return <p className="text-navy/60">Loading…</p>;
  if (!user) return null;

  const initial = (user.first_name || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-navy">My Account</h1>

      <div className="rounded-lg border border-cream-dark bg-white/60 p-5">
        <p className="mb-4 text-sm font-medium text-navy">My details</p>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-dark text-lg font-medium text-navy">
            {initial}
          </span>
          <div>
            <p className="font-medium text-navy">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-text-muted">{user.email}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 border-t border-cream-dark pt-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-text-muted">Phone number</p>
            <p className="text-navy">
              {user.phone_number || "Not set"}
              {user.phone_number && (
                <span
                  className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    user.is_phone_verified ? "bg-green-100 text-green-700" : "bg-cream-dark text-navy-light"
                  }`}
                >
                  {user.is_phone_verified ? "Verified" : "Unverified"}
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-text-muted">Email status</p>
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
          </div>
        </div>
        {resendMessage && <p className="mt-2 text-xs text-navy/60">{resendMessage}</p>}
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
