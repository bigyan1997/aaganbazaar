import { Navigate, useLocation } from "react-router-dom";

import useAuthStore from "../../store/authStore";
import LoadingScreen from "../layout/LoadingScreen";

export default function ProtectedRoute({ children }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "loading") return <LoadingScreen />;
  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
