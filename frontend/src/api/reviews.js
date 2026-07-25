import api from "./axios";

export const getReviewableOrderItem = (slug) =>
  api.get(`/api/products/${slug}/reviewable-item/`).then((r) => r.data);
export const createReview = (data) => api.post("/api/reviews/", data).then((r) => r.data);
export const updateReview = (id, data) => api.patch(`/api/reviews/${id}/`, data).then((r) => r.data);
export const deleteReview = (id) => api.delete(`/api/reviews/${id}/`).then((r) => r.data);
