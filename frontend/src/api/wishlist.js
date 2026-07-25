import api from "./axios";

export const getWishlist = () => api.get("/api/wishlist/").then((r) => r.data);
export const addToWishlist = (productId) =>
  api.post("/api/wishlist/", { product: productId }).then((r) => r.data);
export const removeFromWishlist = (itemId) => api.delete(`/api/wishlist/${itemId}/`).then((r) => r.data);
