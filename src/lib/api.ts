import axios from "axios";

// Base API configuration
export const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to append JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const authRaw = localStorage.getItem("srp_auth");
      if (authRaw) {
        try {
          const authData = JSON.parse(authRaw);
          if (authData?.token) {
            config.headers.Authorization = `Bearer ${authData.token}`;
          }
        } catch (e) {
          console.error("Error parsing auth token", e);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("srp_auth");
        window.dispatchEvent(new Event("srp-auth"));
        // Force redirect to login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
