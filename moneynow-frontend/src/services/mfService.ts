import { API } from "@/app/api/axios";

export interface MfListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

type MfQueryParams = Record<string, unknown>;

export const mfService = {
  getMainCategories: async (params?: MfQueryParams) => {
    const { data } = await API.get("/api/mf/main-categories", { params });
    return data;
  },
  getCategories: async (params?: MfQueryParams) => {
    const { data } = await API.get("/api/mf/categories", { params });
    return data;
  },
  getFunds: async (params?: MfQueryParams) => {
    const { data } = await API.get("/api/mf/funds", { params });
    return data;
  },
  getFundById: async (id: string) => {
    const { data } = await API.get(`/api/mf/funds/${id}`);
    return data;
  },
  getPopularFunds: async (params?: MfQueryParams) => {
    const { data } = await API.get("/api/mf/popular-funds", { params });
    return data;
  },
  getNfos: async (params?: MfQueryParams) => {
    const { data } = await API.get("/api/mf/nfo", { params });
    return data;
  },
  getIndexSnapshots: async (params?: MfQueryParams) => {
    const { data } = await API.get("/api/mf/index-snapshots", { params });
    return data;
  },
  getDiscover: async (params?: MfQueryParams) => {
    const { data } = await API.get("/api/mf/discover", { params });
    return data;
  },
  getHome: async () => {
    const { data } = await API.get("/api/mf/home");
    return data;
  },
  getFilters: async (params?: MfQueryParams) => {
    const { data } = await API.get("/api/mf/filters", { params });
    return data;
  },
  getMfApiSchemes: async (params?: MfQueryParams) => {
    const { data } = await API.get("/api/mf-api/schemes", { params });
    return data;
  },
};
