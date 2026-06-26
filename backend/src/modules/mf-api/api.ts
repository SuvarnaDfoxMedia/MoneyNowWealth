import { axiosApi, axiosInstance, type ApiResponse } from "../../api/axios";
import type {
  MfApiDashboardSummary,
  MfApiImportReport,
  MfApiListResponse,
  MfApiNavHistoryEntry,
  MfApiScheme,
  MfApiSchemeDetail,
  MfApiSyncLog,
  MfApiSyncResult,
  MfApiTopHolding,
} from "./types";

export const fetchMfApiDashboard = async (role: string) =>
  axiosApi.get<MfApiDashboardSummary>(`/${role}/mf-api/dashboard`);

export const fetchMfApiSchemes = async (
  role: string,
  params: { search?: string; page?: number; limit?: number } = {},
) =>
  axiosApi.get<MfApiScheme[]>(`/${role}/mf-api/schemes`, params) as Promise<
    MfApiListResponse<MfApiScheme>
  >;

export const fetchMfApiScheme = async (role: string, id: string) =>
  axiosApi.get<MfApiSchemeDetail>(`/${role}/mf-api/schemes/${id}`);

export const fetchMfApiSyncLogs = async (
  role: string,
  params: { page?: number; limit?: number; search?: string } = {},
) =>
  axiosApi.get<MfApiSyncLog[]>(`/${role}/mf-api/sync-logs`, params) as Promise<
    MfApiListResponse<MfApiSyncLog>
  >;

export const syncAllMfApiSchemes = async (role: string) =>
  axiosApi.post<MfApiSyncResult>(`/${role}/mf-api/sync-all`, {});

export const syncActiveMfApiSchemes = async (role: string) =>
  axiosApi.post<MfApiSyncResult>(`/${role}/mf-api/sync-active`, {});

export const syncOneMfApiScheme = async (
  role: string,
  payload: { schemeId?: string; schemeName?: string; externalSchemeId?: string },
) => axiosApi.post<MfApiSyncResult>(`/${role}/mf-api/sync-one`, payload);

export const importMfApiData = async (
  role: string,
  file: File,
  validateOnly: boolean,
): Promise<MfApiImportReport> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("validateOnly", String(validateOnly));

  const response = await axiosInstance.post<ApiResponse<MfApiImportReport>>(
    `/${role}/mf-api/import`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  // Return the inner report directly (not the ApiResponse wrapper)
  return (response.data?.data ?? response.data) as MfApiImportReport;
};

export const exportMfApiData = async (role: string, params?: { active_only?: boolean }) =>
  axiosInstance.get(`/${role}/mf-api/export`, {
    params,
    responseType: "blob",
  });

export const toggleMfApiSchemeActive = async (
  role: string,
  id: string,
  is_active: boolean
) => axiosApi.patch(`/${role}/mf-api/schemes/${id}/toggle-active`, { is_active });

export const bulkToggleMfApiSchemes = async (
  role: string,
  ids: string[],
  is_active: boolean
) => axiosApi.post(`/${role}/mf-api/schemes/bulk-toggle`, { ids, is_active });

export const markMfApiSchemesReviewed = async (
  role: string,
  ids: string[]
) => axiosApi.post(`/${role}/mf-api/schemes/mark-reviewed`, { ids });

export const getMfApiTopHoldingsApi = (role: string, id: string) =>
  axiosApi.get<MfApiTopHolding>(`/${role}/mf-api/schemes/${id}/top-holdings`);

export const importMfApiTopHoldingsApi = (role: string, id: string, data: Record<string, unknown>) =>
  axiosApi.post<MfApiTopHolding>(`/${role}/mf-api/schemes/${id}/top-holdings`, data);

export const getMfApiNavHistoryApi = (role: string, id: string, days: number = 365) =>
  axiosApi.get<MfApiNavHistoryEntry[]>(`/${role}/mf-api/schemes/${id}/nav-history?days=${days}`);

export const syncMfApiToManualApi = async (role: string, id: string) =>
  axiosApi.post<any>(`/${role}/mf-api/schemes/${id}/sync-to-manual`, {});

export const resyncAllToManualApi = async (role: string) =>
  axiosApi.post<{ total: number }>(`/${role}/mf-api/resync-to-manual`, {});

export const resumeSyncMfApiApi = async (role: string) =>
  axiosApi.post<{ success: boolean; message: string; logId: string }>(`/${role}/mf-api/sync-resume`, {});

export const fetchUnbridgedSchemesApi = async (role: string) =>
  axiosApi.get<{
    total_active: number;
    total_bridged: number;
    unbridged_count: number;
    unbridged: Array<{ _id: string; scheme_code: string; scheme_name: string; amc_name: string; category: string; sync_status: string; last_sync_error: string }>;
  }>(`/${role}/mf-api/unbridged-schemes`);
