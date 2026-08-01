import api from "./axios";

export const register = (data) => api.post("/api/auth/register/", data).then((r) => r.data);
export const login = (data) => api.post("/api/auth/login/", data).then((r) => r.data);
export const googleLogin = (data) => api.post("/api/auth/google/", data).then((r) => r.data);
export const logout = () => api.post("/api/auth/logout/").then((r) => r.data);
export const fetchMe = () => api.get("/api/auth/me/").then((r) => r.data);
export const updateProfile = (data) => api.patch("/api/auth/me/", data).then((r) => r.data);
export const changePassword = (data) => api.post("/api/auth/change-password/", data).then((r) => r.data);
export const verifyEmail = (data) => api.post("/api/auth/verify-email/", data).then((r) => r.data);
export const resendVerification = () => api.post("/api/auth/resend-verification/").then((r) => r.data);
export const requestPasswordReset = (data) => api.post("/api/auth/password-reset/", data).then((r) => r.data);
export const confirmPasswordReset = (data) =>
  api.post("/api/auth/password-reset/confirm/", data).then((r) => r.data);
