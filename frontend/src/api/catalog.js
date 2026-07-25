import api from "./axios";

export const getCategories = () => api.get("/api/categories/").then((r) => r.data);
export const getCategory = (slug) => api.get(`/api/categories/${slug}/`).then((r) => r.data);
export const getProducts = (params = {}) => api.get("/api/products/", { params }).then((r) => r.data);
export const getMyProducts = (params = {}) =>
  api.get("/api/products/", { params: { ...params, mine: "true" } }).then((r) => r.data);
export const getProduct = (slug) => api.get(`/api/products/${slug}/`).then((r) => r.data);
export const createProduct = (data) => api.post("/api/products/", data).then((r) => r.data);
export const updateProduct = (slug, data) => api.patch(`/api/products/${slug}/`, data).then((r) => r.data);
export const deleteProduct = (slug) => api.delete(`/api/products/${slug}/`).then((r) => r.data);
export const getProductReviews = (slug, params = {}) =>
  api.get(`/api/products/${slug}/reviews/`, { params }).then((r) => r.data);
export const getProductImages = (slug) => api.get(`/api/products/${slug}/images/`).then((r) => r.data);
export const uploadProductImage = (slug, file, { isPrimary = false, altText = "" } = {}) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("is_primary", isPrimary ? "true" : "false");
  if (altText) formData.append("alt_text", altText);
  return api
    .post(`/api/products/${slug}/images/`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};
export const deleteProductImage = (id) => api.delete(`/api/products/images/${id}/`).then((r) => r.data);

export const getStockAlertStatus = (slug) => api.get(`/api/products/${slug}/notify-me/`).then((r) => r.data);
export const subscribeStockAlert = (slug) => api.post(`/api/products/${slug}/notify-me/`).then((r) => r.data);
export const unsubscribeStockAlert = (slug) => api.delete(`/api/products/${slug}/notify-me/`).then((r) => r.data);
