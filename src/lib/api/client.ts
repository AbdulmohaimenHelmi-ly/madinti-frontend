import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const locale = document.documentElement.lang || "ar";
    config.headers["Accept-Language"] = locale;

    // Anonymous session id — used by the backend's "For You" recommender
    // to personalise results for guests based on their browsing history.
    let sessionId = localStorage.getItem("ajjmal_session_id");
    if (!sessionId) {
      sessionId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("ajjmal_session_id", sessionId);
    }
    config.headers["X-Session-Id"] = sessionId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        window.location.href = "/ar/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
