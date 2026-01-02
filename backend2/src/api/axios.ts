


// import axios, { AxiosInstance } from "axios";
// import { refreshAuthUser, logoutAuth } from "../context/AuthContext";
// import { toast } from "react-hot-toast";

// export interface QueryParams {
//   [key: string]: string | number | boolean | undefined | null;
// }

// export interface ApiResponse<T = any> {
//   success: boolean;
//   message?: string;
//   data?: T;
//   total?: number;
// }

// const API_BASE_URL = import.meta.env.VITE_API_BASE;

// // Axios instance with cookies
// export const axiosInstance: AxiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true, // crucial for cookie auth
//   headers: { "Content-Type": "application/json" },
// });

// // Response interceptor: auto-refresh or logout
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401) {
//       try {
//         await refreshAuthUser(); // try to refresh session
//         return Promise.reject(error); // optionally retry request after refresh
//       } catch {
//         await logoutAuth(); // logout if refresh fails
//         toast.error("Session expired. Please login again.");
//         window.location.href = "/signin";
//       }
//     }
//     const message = error?.response?.data?.message || error.message || "Network error";
//     return Promise.reject(new Error(message));
//   }
// );

// // Central request handler
// const handleRequest = async <T>(request: Promise<any>): Promise<ApiResponse<T>> => {
//   try {
//     const res = await request;
//     return res.data;
//   } catch (err: any) {
//     throw new Error(err?.response?.data?.message || err.message || "Request failed");
//   }
// };

// // Axios helper
// export const axiosApi = {
//   get: <T>(endpoint: string, params?: QueryParams) =>
//     handleRequest<T>(axiosInstance.get(endpoint, { params })),

//   getList: <T>(endpoint: string, params?: QueryParams) => {
//     const queryParams = { ...params };
//     if ("searchValue" in queryParams) {
//       queryParams.search = queryParams.searchValue;
//       delete queryParams.searchValue;
//     }
//     return handleRequest<T>(axiosInstance.get(endpoint, { params: queryParams }));
//   },

//   getOne: <T>(endpoint: string) => handleRequest<T>(axiosInstance.get(endpoint)),

//   create: <T>(endpoint: string, payload: any) => {
//     const isFormData = payload instanceof FormData;
//     return handleRequest<T>(
//       axiosInstance.post(endpoint, payload, {
//         headers: isFormData
//           ? { "Content-Type": "multipart/form-data" }
//           : { "Content-Type": "application/json" },
//       })
//     );
//   },

//   post: <T>(endpoint: string, payload: any) => axiosApi.create<T>(endpoint, payload),

//   update: <T>(endpoint: string, payload: any) => {
//     const isFormData = payload instanceof FormData;
//     return handleRequest<T>(
//       axiosInstance.put(endpoint, payload, {
//         headers: isFormData
//           ? { "Content-Type": "multipart/form-data" }
//           : { "Content-Type": "application/json" },
//       })
//     );
//   },

//   patch: <T>(endpoint: string, payload: any) =>
//     handleRequest<T>(
//       axiosInstance.patch(endpoint, payload, { headers: { "Content-Type": "application/json" } })
//     ),

//   remove: <T>(endpoint: string) => handleRequest<T>(axiosInstance.delete(endpoint)),
// };

// export default axiosInstance;


// import axios, { AxiosInstance } from "axios";
// import { refreshAuthUser, logoutAuth } from "../context/AuthContext";
// import { toast } from "react-hot-toast";

// export interface QueryParams {
//   [key: string]: string | number | boolean | undefined | null;
// }

// export interface ApiResponse<T = any> {
//   success: boolean;
//   message?: string;
//   data?: T;
//   total?: number;
// }

// const API_BASE_URL = import.meta.env.VITE_API_BASE;

// /* -------------------- AXIOS INSTANCE -------------------- */
// export const axiosInstance: AxiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true,
//   headers: { "Content-Type": "application/json" },
// });

// /* -------------------- INTERCEPTOR -------------------- */
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401) {
//       try {
//         await refreshAuthUser();
//       } catch {
//         await logoutAuth();
//         toast.error("Session expired. Please login again.");
//         window.location.href = "/signin";
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// /* -------------------- HANDLER -------------------- */
// const handleRequest = async <T>(request: Promise<any>): Promise<ApiResponse<T>> => {
//   const res = await request;
//   return res.data;
// };

// /* -------------------- API HELPERS -------------------- */
// export const axiosApi = {
//   get: <T>(endpoint: string, params?: QueryParams) =>
//     handleRequest<T>(axiosInstance.get(endpoint, { params })),

//   getList: <T>(endpoint: string, params?: QueryParams) => {
//     const qp = { ...params };
//     if ("searchValue" in qp) {
//       qp.search = qp.searchValue;
//       delete qp.searchValue;
//     }
//     return handleRequest<T>(axiosInstance.get(endpoint, { params: qp }));
//   },

//   getOne: <T>(endpoint: string) =>
//     handleRequest<T>(axiosInstance.get(endpoint)),

//   post: <T>(endpoint: string, payload: any) =>
//     handleRequest<T>(axiosInstance.post(endpoint, payload)),

//   create: <T>(endpoint: string, payload: any) =>
//     handleRequest<T>(axiosInstance.post(endpoint, payload)),

//   update: <T>(endpoint: string, payload: any) =>
//     handleRequest<T>(axiosInstance.put(endpoint, payload)),

//   patch: <T>(endpoint: string, payload: any) =>
//     handleRequest<T>(axiosInstance.patch(endpoint, payload)),

//   remove: <T>(endpoint: string) =>
//     handleRequest<T>(axiosInstance.delete(endpoint)),
// };

// export default axiosInstance;




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
  // - multipart/form-data for FormData (with boundary)
});

/* -------------------- RESPONSE INTERCEPTOR -------------------- */
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

  create: <T>(endpoint: string, payload: any) =>
    handleRequest<T>(axiosInstance.post(endpoint, payload)),

  update: <T>(endpoint: string, payload: any) =>
    handleRequest<T>(axiosInstance.put(endpoint, payload)),

  patch: <T>(endpoint: string, payload: any) =>
    handleRequest<T>(axiosInstance.patch(endpoint, payload)),

  remove: <T>(endpoint: string) =>
    handleRequest<T>(axiosInstance.delete(endpoint)),
};

export default axiosInstance;
