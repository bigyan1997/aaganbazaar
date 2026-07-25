import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { requestPasswordReset } from "../../api/auth";

const inputClass = "w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const mutation = useMutation({ mutationFn: requestPasswordReset });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ email });
  };

  if (mutation.isSuccess) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <h1 className="mb-2 text-xl font-semibold text-navy">Check your email</h1>
        <p className="text-navy/70">If that email is registered, we've sent a password reset link.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-navy">Reset your password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-navy">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-orange px-4 py-2 font-medium text-cream hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
