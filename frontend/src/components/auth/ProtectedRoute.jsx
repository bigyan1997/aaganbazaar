import { Navigate, useLocation } from "react-router-dom";

import useAuthStore from "../../store/authStore";

export default function ProtectedRoute({ children }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "loading") return null;
  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
