import api from "./axios";

export const checkout = (data) => api.post("/api/orders/checkout/", data).then((r) => r.data);
export const getOrders = () => api.get("/api/orders/").then((r) => r.data);
export const getOrder = (orderNumber) => api.get(`/api/orders/${orderNumber}/`).then((r) => r.data);
export const getSellerOrders = (params = {}) => api.get("/api/orders/seller/", { params }).then((r) => r.data);
export const updateSellerOrder = (id, data) => api.patch(`/api/orders/seller/${id}/`, data).then((r) => r.data);
