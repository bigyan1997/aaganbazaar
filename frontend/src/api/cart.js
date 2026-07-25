import api from "./axios";

export const getCart = () => api.get("/api/cart/").then((r) => r.data);
export const clearCart = () => api.delete("/api/cart/").then((r) => r.data);
export const addCartItem = (data) => api.post("/api/cart/items/", data).then((r) => r.data);
export const updateCartItem = (id, data) => api.patch(`/api/cart/items/${id}/`, data).then((r) => r.data);
export const removeCartItem = (id) => api.delete(`/api/cart/items/${id}/`).then((r) => r.data);
