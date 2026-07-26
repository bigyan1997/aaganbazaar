import { useMutation } from "@tanstack/react-query";
import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { register } from "../../api/auth";
import logoIcon from "../../assets/logo-icon.png";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import useAuthStore from "../../store/authStore";
import { extractErrorMessage } from "../../utils/errors";

const inputClass =
  "w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange";
const iconInputClass = `${inputClass} pl-10`;

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
    <div className="mx-auto flex max-w-sm flex-col items-center py-6">
      <img src={logoIcon} alt="" className="mb-3 h-11 w-11" />
      <h1 className="text-2xl font-semibold text-navy">Create an account</h1>
      <p className="mb-6 text-sm text-navy-light">Join Aaganbazaar and start shopping local</p>

      <div className="w-full rounded-2xl border border-cream-dark bg-white/70 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="First name"
              value={form.first_name}
              onChange={update("first_name")}
              className={inputClass}
            />
            <input
              placeholder="Last name"
              value={form.last_name}
              onChange={update("last_name")}
              className={inputClass}
            />
          </div>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={update("email")}
              className={iconInputClass}
            />
          </div>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="password"
              required
              minLength={10}
              placeholder="Password"
              value={form.password}
              onChange={update("password")}
              className={iconInputClass}
            />
          </div>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="password"
              required
              minLength={10}
              placeholder="Confirm password"
              value={form.password2}
              onChange={update("password2")}
              className={iconInputClass}
            />
          </div>

          {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-1 rounded-lg bg-orange py-2.5 font-medium text-cream hover:opacity-90 disabled:opacity-50"
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
      </div>

      <p className="mt-5 text-sm text-navy/70">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-orange hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
