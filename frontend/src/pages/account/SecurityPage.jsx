import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { changePassword, fetchMe } from "../../api/auth";
import PasswordInput from "../../components/auth/PasswordInput";
import { extractErrorMessage } from "../../utils/errors";

const passwordInputClass =
  "min-h-11 w-full rounded border border-navy/20 px-3 py-2 pl-10 pr-10 text-sm focus:border-orange focus:outline-none";

const EMPTY_FORM = { current_password: "", new_password: "", new_password2: "" };

export default function SecurityPage() {
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const [form, setForm] = useState(EMPTY_FORM);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  if (isLoading || !user) return <p className="text-navy/60">Loading…</p>;

  if (user.auth_provider === "google") {
    return (
      <div className="rounded-lg border border-cream-dark bg-white/60 p-5">
        <p className="text-sm font-medium text-navy">Password</p>
        <p className="mt-2 text-sm text-navy/70">
          Your account signs in with Google, so there's no Aaganbazaar password to change.
        </p>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="rounded-lg border border-cream-dark bg-white/60 p-5">
      <p className="mb-4 text-sm font-medium text-navy">Change password</p>
      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
        <PasswordInput
          required
          placeholder="Current password"
          value={form.current_password}
          onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
          className={passwordInputClass}
        />
        <PasswordInput
          required
          minLength={10}
          placeholder="New password"
          value={form.new_password}
          onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
          className={passwordInputClass}
        />
        <PasswordInput
          required
          minLength={10}
          placeholder="Confirm new password"
          value={form.new_password2}
          onChange={(e) => setForm((f) => ({ ...f, new_password2: e.target.value }))}
          className={passwordInputClass}
        />

        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}
        {success && <p className="text-sm text-green-700">Password changed.</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="min-h-11 self-start rounded bg-orange px-4 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
