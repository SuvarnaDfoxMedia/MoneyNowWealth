import { axiosApi, axiosInstance, type ApiResponse } from "../../api/axios";
import type { Scheme } from "../schemes/types";
import type {
  LatestNavResponse,
  NavHistoryItem,
  NavScheme,
  NavSchemeQueryParams,
  ReturnsResponse,
  UploadReport,
} from "./types";

export type ListResponse<T> = ApiResponse<T[]> & {
  total?: number;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
};

export const fetchLatestNav = async (role: string, schemeId: string) =>
  axiosApi.get<LatestNavResponse>(`/${role}/nav/${schemeId}/latest`);

export const fetchNavSchemes = async (
  role: string,
  params: NavSchemeQueryParams,
) =>
  axiosApi.get<NavScheme[]>(
    `/${role}/nav/schemes`,
    params,
  ) as Promise<ListResponse<NavScheme>>;

export const fetchNavHistory = async (
  role: string,
  schemeId: string,
  params: { page?: number; limit?: number; fromDate?: string; toDate?: string },
) =>
  axiosApi.get<NavHistoryItem[]>(
    `/${role}/nav/${schemeId}/history`,
    params,
  ) as Promise<ListResponse<NavHistoryItem>>;

export const fetchReturns = async (role: string, schemeId: string) =>
  axiosApi.get<ReturnsResponse>(`/${role}/returns/${schemeId}`);

export const uploadNavFile = async (
  role: string,
  file: File,
  validateOnly: boolean,
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("validateOnly", String(validateOnly));

  const response = await axiosInstance.post<ApiResponse<UploadReport>>(
    `/${role}/nav/upload`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
};

export const exportNavFile = async (role: string) =>
  axiosInstance.get(`/${role}/nav/export`, {
    responseType: "blob",
  });
