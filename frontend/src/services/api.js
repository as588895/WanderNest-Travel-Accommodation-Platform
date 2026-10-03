import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});
export const auth = {
  me: () => api.get("/auth/me"),
  login: (d) => api.post("/auth/login", d),
  signup: (d) => api.post("/auth/signup", d),
  logout: () => api.post("/auth/logout"),
  changePassword: (d) => api.post("/auth/change-password", d),
  forgotPassword: (d) => api.post("/auth/forgot-password", d),
  resetPassword: (token, d) => api.post(`/auth/reset-password/${token}`, d),
};
export const listings = {
  all: (p) => api.get("/listings", { params: p }),
  one: (id) => api.get(`/listings/${id}`),
  wishlist: () => api.get("/listings/wishlist"),
  add: (id) => api.post(`/listings/${id}/wishlist`),
  remove: (id) => api.delete(`/listings/${id}/wishlist`),
  create: (d) =>
    api.post("/listings", d, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, d) =>
    api.put(`/listings/${id}`, d, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  removeListing: (id) => api.delete(`/listings/${id}`),
};
export const orders = {
  all: () => api.get("/orders"),
  one: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  remove: (id) => api.delete(`/bookings/${id}`),
};
export const reviews = {
  add: (id, d) => api.post(`/listings/${id}/reviews`, d),
  remove: (id, rid) => api.delete(`/listings/${id}/reviews/${rid}`),
};
export const booking = {
  createOrder: (id, d) => api.post(`/listings/${id}/book/create-order`, d),
  confirm: (id, d) => api.post(`/listings/${id}/book/confirm`, d),
};
export const feedback = {
  // Get feedback for a booking
  get: (id) => api.get(`/bookings/${id}/reality-check-feedback`),

  // Submit feedback for a completed booking
  add: (id, d) =>
    api.post(`/bookings/${id}/reality-check-feedback`, d),

  // Update existing feedback
  update: (id, d) =>
    api.put(`/reality-check-feedback/${id}`, d),

  // Get all Reality Check feedback for a listing
  listing: (id) =>
    api.get(`/listings/${id}/reality-check-feedback`),
};
export const ai = { chat: (message) => api.post("/ai/chat", { message }) };
export default api;
