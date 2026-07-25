import axios from "axios";

import useAuthStore from "../store/authStore";

// Auth is HttpOnly-cookie based (not a bearer token) - the browser attaches
// the cookies automatically, we just need withCredentials on every request.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let queue = [];

const flushQueue = (error) => {
  queue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  queue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const status = response?.status;
    const url = config?.url ?? "";
    const isAuthEndpoint = ["/auth/login", "/auth/register", "/auth/refresh"].some((p) => url.includes(p));

    if (status !== 401 || isAuthEndpoint || config._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject })).then(() => api(config));
    }

    config._retry = true;
    isRefreshing = true;
    try {
      await api.post("/api/auth/refresh/");
      flushQueue(null);
      return api(config);
    } catch (refreshError) {
      flushQueue(refreshError);
      useAuthStore.getState().clear();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
