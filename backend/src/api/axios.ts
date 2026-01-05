


import axios, { AxiosInstance } from "axios";
import { refreshAuthUser, logoutAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

export interface QueryParams {
  [key: string]: string | number | boolean | undefined | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE;

/* -------------------- AXIOS INSTANCE -------------------- */
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // Axios will automatically choose:
  // - application/json for normal objects
  // - multipart/form-data for FormData 
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await refreshAuthUser();
      } catch {
        await logoutAuth();
        toast.error("Session expired. Please login again.");
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

/* -------------------- HANDLER -------------------- */
const handleRequest = async <T>(request: Promise<any>): Promise<ApiResponse<T>> => {
  const res = await request;
  return res.data;
};

/* -------------------- API HELPERS -------------------- */
export const axiosApi = {
  get: <T>(endpoint: string, params?: QueryParams) =>
    handleRequest<T>(axiosInstance.get(endpoint, { params })),

  getList: <T>(endpoint: string, params?: QueryParams) => {
    const qp = { ...params };
    if ("searchValue" in qp) {
      qp.search = qp.searchValue;
      delete qp.searchValue;
    }
    return handleRequest<T>(axiosInstance.get(endpoint, { params: qp }));
  },

  getOne: <T>(endpoint: string) =>
    handleRequest<T>(axiosInstance.get(endpoint)),

  post: <T>(endpoint: string, payload: any) =>
    handleRequest<T>(axiosInstance.post(endpoint, payload)),

  create: <T>(endpoint: string, payload: any) => {
    const isFormData = payload instanceof FormData;
    console.log("AXIOS CREATE METHOD CALLED - NEW VERSION");
    console.log("Axios create - isFormData:", isFormData);
    console.log("Axios create - payload:", payload);
    console.log("Axios create - payload type:", typeof payload);
    
    const headers = isFormData
      ? { "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundary" }
      : { "Content-Type": "application/json" };
    
    console.log("🔍 Axios create - headers:", headers);
    
    if (isFormData) {
      console.log("🔍 Bypassing handleRequest for FormData");
      return axiosInstance.post(endpoint, payload, { headers });
    }
    
    return handleRequest<T>(
      axiosInstance.post(endpoint, payload, { headers })
    );
  },

  update: <T>(endpoint: string, payload: any) =>
    handleRequest<T>(axiosInstance.put(endpoint, payload)),

  patch: <T>(endpoint: string, payload: any) =>
    handleRequest<T>(axiosInstance.patch(endpoint, payload)),

  remove: <T>(endpoint: string) =>
    handleRequest<T>(axiosInstance.delete(endpoint)),
};

export default axiosInstance;
