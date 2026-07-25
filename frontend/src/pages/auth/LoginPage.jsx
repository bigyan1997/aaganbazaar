import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { login } from "../../api/auth";
import useAuthStore from "../../store/authStore";
import { extractErrorMessage } from "../../utils/errors";

const inputClass = "w-full rounded border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const location = useLocation();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      setUser(user);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-navy">Log in</h1>
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
        <div>
          <label className="mb-1 block text-sm text-navy">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-orange px-4 py-2 font-medium text-cream hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="mt-4 flex justify-between text-sm text-navy/70">
        <Link to="/forgot-password" className="hover:text-orange">
          Forgot password?
        </Link>
        <Link to="/register" className="hover:text-orange">
          Create an account
        </Link>
      </div>
    </div>
  );
}
