import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { login } from "../../api/auth";
import logoIcon from "../../assets/logo-icon.png";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import PasswordInput from "../../components/auth/PasswordInput";
import useAuthStore from "../../store/authStore";
import { extractErrorMessage } from "../../utils/errors";

const inputBaseClass =
  "w-full rounded-lg border border-navy/15 py-2.5 pl-10 text-sm focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const location = useLocation();

  const goToDestination = () => navigate(location.state?.from?.pathname || "/", { replace: true });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      setUser(user);
      goToDestination();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-6">
      <img src={logoIcon} alt="" className="mb-3 h-11 w-11" />
      <h1 className="text-2xl font-semibold text-navy">Welcome back</h1>
      <p className="mb-6 text-sm text-navy-light">Log in to continue to Aaganbazaar</p>

      <div className="w-full rounded-2xl border border-cream-dark bg-white/70 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputBaseClass} pr-3`}
            />
          </div>
          <PasswordInput
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputBaseClass} pr-10`}
          />

          {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-1 rounded-lg bg-orange py-2.5 font-medium text-cream hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-navy/40">
          <div className="h-px flex-1 bg-cream-dark" />
          or
          <div className="h-px flex-1 bg-cream-dark" />
        </div>
        <GoogleLoginButton onSuccess={goToDestination} />

        <Link to="/forgot-password" className="mt-4 block text-center text-sm text-navy/70 hover:text-orange">
          Forgot password?
        </Link>
      </div>

      <p className="mt-5 text-sm text-navy/70">
        New to Aaganbazaar?{" "}
        <Link to="/register" className="font-medium text-orange hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
