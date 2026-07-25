import { create } from "zustand";

// Auth tokens live in HttpOnly cookies, invisible to JS by design - so
// there is nothing to persist client-side. Source of truth is always a
// GET /api/auth/me/ call (see hooks/useAuthBootstrap.js), not localStorage.
const useAuthStore = create((set) => ({
  user: null,
  status: "loading", // "loading" | "authenticated" | "guest"

  setUser: (user) => set({ user, status: "authenticated" }),
  clear: () => set({ user: null, status: "guest" }),
}));

export default useAuthStore;
