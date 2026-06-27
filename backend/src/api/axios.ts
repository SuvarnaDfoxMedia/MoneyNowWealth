import axios, { AxiosInstance } from "axios";
import { logoutAuth } from "../context/authSession";

export interface QueryParams {
  [key: string]: string | number | boolean | undefined | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || "/api";

/* -------------------- AXIOS INSTANCE -------------------- */
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // Axios will automatically choose:
  // - application/json for normal objects
  // - multipart/form-data for FormData
});

let isLoggingOut = false;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isLoggingOut) {
      isLoggingOut = true;
      try {
        await logoutAuth();
      } finally {
        isLoggingOut = false;
        if (typeof window !== "undefined") {
          window.location.href = "/signin";
        }
      }
    }
    return Promise.reject(error);
  },
);

/* -------------------- HANDLER -------------------- */
const handleRequest = async <T>(
  request: Promise<{ data: ApiResponse<T> }>,
): Promise<ApiResponse<T>> => {
  const res = await request;
  if (!res || typeof res.data !== "object" || res.data === null) {
    throw new Error(
      "Invalid API response. Check VITE_API_BASE and backend API availability.",
    );
  }
  return res.data;
};

/* -------------------- API HELPERS -------------------- */
export const axiosApi = {
  get: <T>(endpoint: string, params?: QueryParams) =>
    handleRequest<T>(axiosInstance.get(endpoint, { params })),

  getList: <T>(endpoint: string, params?: QueryParams) => {
    const qp = { ...params };
    // Transform parameters to match backend expectations
    if ("searchValue" in qp) {
      qp.search = qp.searchValue;
      delete qp.searchValue;
    }
    if ("sortField" in qp) {
      qp.sortBy = qp.sortField; // Backend expects sortBy
      delete qp.sortField;
    }
    return handleRequest<T>(axiosInstance.get(endpoint, { params: qp }));
  },

  getOne: <T>(endpoint: string) =>
    handleRequest<T>(axiosInstance.get(endpoint)),

  post: <T>(endpoint: string, payload: unknown) =>
    handleRequest<T>(axiosInstance.post(endpoint, payload)),

  create: <T>(endpoint: string, payload: unknown) => {
    const isFormData = payload instanceof FormData;

    const headers = isFormData
      ? { "Content-Type": "multipart/form-data" }
      : { "Content-Type": "application/json" };

    return handleRequest<T>(axiosInstance.post(endpoint, payload, { headers }));
  },

  update: <T>(endpoint: string, payload: unknown) =>
    handleRequest<T>(axiosInstance.put(endpoint, payload)),

  patch: <T>(endpoint: string, payload: unknown) =>
    handleRequest<T>(axiosInstance.patch(endpoint, payload)),

  remove: <T>(endpoint: string) =>
    handleRequest<T>(axiosInstance.delete(endpoint)),
};

export default axiosInstance;
