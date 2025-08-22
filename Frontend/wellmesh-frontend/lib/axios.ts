// lib/axios.ts
"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { authLoadingHandler } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    authLoadingHandler(true);

    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    authLoadingHandler(false);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    authLoadingHandler(false);
    return response;
  },
  async (error) => {
    authLoadingHandler(false);

    const originalRequest = error.config;

    // Handle timeout
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      console.error("⏳ Request timed out. Redirecting home.");
      window.location.href = "/";
      return Promise.reject(error);
    }

    // If login/register fails, don't try to refresh
    if (
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    // Handle 401 → try refresh token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = Cookies.get("refreshToken");
        if (!refresh) throw new Error("No refresh token");
        console.log(refresh);
        const res = await axios.post(
          `${API}/auth/token/refresh`,
          { refreshToken: refresh },
          { headers: { Authorization: `Bearer ${Cookies.get("accessToken")}` } }
        );

        Cookies.set("accessToken", res.data.accessToken, { expires: 1 });
        Cookies.set("refreshToken", res.data.refreshToken, { expires: 1 });
        Cookies.set("user", JSON.stringify(res.data.user), { expires: 1 });

        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;

        return api(originalRequest); // retry original request
      } catch (refreshError) {
        console.error("❌ Refresh token failed:", refreshError);
        Cookies.remove("user");
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
