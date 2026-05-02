import { axiosApi, type ApiResponse } from "../../api/axios";
import type { Scheme } from "./types";

export type SchemeListResponse = ApiResponse<Scheme[]> & {
  total?: number;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
};

export const fetchSchemes = async (
  role: string,
  params: { search?: string; page?: number; limit?: number },
) => axiosApi.get<Scheme[]>(`/${role}/schemes`, params) as Promise<SchemeListResponse>;

export const fetchSchemeById = async (role: string, id: string) =>
  axiosApi.get<Scheme>(`/${role}/schemes/${id}`);
