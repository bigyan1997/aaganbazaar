import api from "./axios";

export const getBanners = () => api.get("/api/banners/").then((r) => r.data);
