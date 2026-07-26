import { Navigate, useLocation } from "react-router-dom";

import useAuthStore from "../../store/authStore";
import LoadingScreen from "../layout/LoadingScreen";

// Requires not just login but an approved seller profile (user.role ===
// "seller" - kept in sync server-side by apps.sellers.signals).
export default function SellerRoute({ children }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (status === "loading") return <LoadingScreen />;
  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.role !== "seller") {
    return <Navigate to="/sell" replace />;
  }
  return children;
}
