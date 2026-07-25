import { Navigate } from "react-router-dom";

import useAuthStore from "../../store/authStore";

// Wraps pages that only make sense when logged out (login/register).
export default function GuestRoute({ children }) {
  const status = useAuthStore((s) => s.status);

  if (status === "loading") return null;
  if (status === "authenticated") return <Navigate to="/" replace />;
  return children;
}
