import axios from "axios";

// Base URL comes from the .env file so the same code works locally
// and against a deployed backend URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ---- Reviews ----------------------------------------------------------
export const submitTextReview = (title, text) =>
  api.post("/reviews", { title, text }).then((res) => res.data);

export const submitFileReview = (file) => {
  const formData = new FormData();
  formData.append("leaseFile", file);
  return api
    .post("/reviews/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};

export const getReviews = () => api.get("/reviews").then((res) => res.data);

export const getReviewById = (id) => api.get(`/reviews/${id}`).then((res) => res.data);

export const deleteReview = (id) => api.delete(`/reviews/${id}`).then((res) => res.data);

// ---- Standards ----------------------------------------------------------
export const getStandards = () => api.get("/standards").then((res) => res.data);

export const createStandard = (standard) =>
  api.post("/standards", standard).then((res) => res.data);

export const updateStandard = (id, standard) =>
  api.put(`/standards/${id}`, standard).then((res) => res.data);

export const deleteStandard = (id) =>
  api.delete(`/standards/${id}`).then((res) => res.data);

export default api;
