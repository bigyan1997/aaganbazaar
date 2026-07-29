import api from "./axios";

export const applyAsSeller = (data) => api.post("/api/sellers/apply/", data).then((r) => r.data);
export const getMySellerProfile = () => api.get("/api/sellers/me/").then((r) => r.data);
export const getSellerPublicProfile = (slug) => api.get(`/api/sellers/${slug}/`).then((r) => r.data);
export const getSellers = (params = {}) => api.get("/api/sellers/", { params }).then((r) => r.data);
