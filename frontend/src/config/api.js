import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor Request: adjunta JWT y x-tenant-id (si SuperAdmin está inspeccionando un club)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cd_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const impersonatedTenantId = sessionStorage.getItem(
      "cd_impersonate_tenant_id",
    );
    if (impersonatedTenantId) {
      config.headers["x-tenant-id"] = impersonatedTenantId;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor Response: limpia sesión si vence el token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("cd_token");
      localStorage.removeItem("cd_user");
    }
    return Promise.reject(error);
  },
);

export default api;
