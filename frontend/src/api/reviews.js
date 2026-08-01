import api from "./axios";

export const getMyReviews = () => api.get("/api/reviews/").then((r) => r.data);
export const getReviewableOrderItem = (slug) =>
  api.get(`/api/products/${slug}/reviewable-item/`).then((r) => r.data);
export const createReview = (data) => api.post("/api/reviews/", data).then((r) => r.data);
export const updateReview = (id, data) => api.patch(`/api/reviews/${id}/`, data).then((r) => r.data);
export const deleteReview = (id) => api.delete(`/api/reviews/${id}/`).then((r) => r.data);

export const uploadReviewImage = (reviewId, file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api
    .post(`/api/reviews/${reviewId}/images/`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};
export const deleteReviewImage = (imageId) => api.delete(`/api/reviews/images/${imageId}/`).then((r) => r.data);
