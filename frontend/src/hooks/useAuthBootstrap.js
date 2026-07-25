import { useEffect } from "react";

import { fetchMe } from "../api/auth";
import useAuthStore from "../store/authStore";

// Runs once on app mount. There's no client-visible token to check, so the
// only way to know if a session is live is to ask the API.
export default function useAuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    fetchMe().then(setUser).catch(clear);
  }, [setUser, clear]);

  return status;
}
