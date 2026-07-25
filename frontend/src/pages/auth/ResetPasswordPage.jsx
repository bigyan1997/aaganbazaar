import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { confirmPasswordReset } from "../../api/auth";
import { extractErrorMessage } from "../../utils/errors";

const inputClass = "w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: () => navigate("/login", { replace: true }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ uid, token, new_password: newPassword, new_password2: newPassword2 });
  };

  if (!uid || !token) {
    return <p className="mx-auto max-w-sm text-center text-red-600">Invalid reset link.</p>;
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-navy">Set a new password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-navy">New password</label>
          <input
            type="password"
            required
            minLength={10}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-navy">Confirm new password</label>
          <input
            type="password"
            required
            minLength={10}
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            className={inputClass}
          />
        </div>

        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-orange px-4 py-2 font-medium text-cream hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Reset password"}
        </button>
      </form>
    </div>
  );
}
