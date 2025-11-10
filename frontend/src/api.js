import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5000"
      : import.meta.env.VITE_API_URL || "https://fintech-dashboard-xm3z.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Token’ı otomatik ekle (her sayfada ayrı ayrı yazmana gerek kalmaz)
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;