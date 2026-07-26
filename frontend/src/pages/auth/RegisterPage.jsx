import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { register } from "../../api/auth";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import useAuthStore from "../../store/authStore";
import { extractErrorMessage } from "../../utils/errors";

const inputClass = "w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", password2: "", first_name: "", last_name: "" });
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      setUser(user);
      navigate("/verify-email", { replace: true });
    },
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-navy">Create an account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-navy">First name</label>
            <input value={form.first_name} onChange={update("first_name")} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-navy">Last name</label>
            <input value={form.last_name} onChange={update("last_name")} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-navy">Email</label>
          <input type="email" required value={form.email} onChange={update("email")} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-navy">Password</label>
          <input
            type="password"
            required
            minLength={10}
            value={form.password}
            onChange={update("password")}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-navy">Confirm password</label>
          <input
            type="password"
            required
            minLength={10}
            value={form.password2}
            onChange={update("password2")}
            className={inputClass}
          />
        </div>

        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-orange px-4 py-2 font-medium text-cream hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-navy/40">
        <div className="h-px flex-1 bg-cream-dark" />
        or
        <div className="h-px flex-1 bg-cream-dark" />
      </div>
      <GoogleLoginButton onSuccess={() => navigate("/", { replace: true })} />

      <p className="mt-4 text-sm text-navy/70">
        Already have an account?{" "}
        <Link to="/login" className="text-orange hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
