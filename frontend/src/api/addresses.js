import api from "./axios";

export const getAddresses = () => api.get("/api/auth/addresses/").then((r) => r.data);
export const createAddress = (data) => api.post("/api/auth/addresses/", data).then((r) => r.data);
export const updateAddress = (id, data) => api.patch(`/api/auth/addresses/${id}/`, data).then((r) => r.data);
export const deleteAddress = (id) => api.delete(`/api/auth/addresses/${id}/`).then((r) => r.data);
