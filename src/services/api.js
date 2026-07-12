import axios from "axios";

// When the real backend is ready, point this at its base URL (e.g. via
// import.meta.env.VITE_API_BASE_URL) and set USE_MOCKS to false in each
// service file. No component ever imports axios directly — only files in
// src/services/ do, so swapping mock -> live is a services-only change.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("transitops_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("transitops_token");
      localStorage.removeItem("transitops_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Small helper so mock services can simulate network latency consistently.
export const mockDelay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export default api;
