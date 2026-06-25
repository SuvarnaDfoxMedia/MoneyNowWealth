import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  exportMfApiData,
  fetchMfApiDashboard,
  fetchMfApiScheme,
  fetchMfApiSchemes,
  fetchMfApiSyncLogs,
  getMfApiNavHistoryApi,
  getMfApiTopHoldingsApi,
  importMfApiData,
  importMfApiTopHoldingsApi,
  syncAllMfApiSchemes,
  syncActiveMfApiSchemes,
  syncOneMfApiScheme,
  toggleMfApiSchemeActive,
  bulkToggleMfApiSchemes,
  markMfApiSchemesReviewed,
  syncMfApiToManualApi,
  resyncAllToManualApi,
} from "./api";
import type { MfApiImportReport, MfApiSyncResult } from "./types";

export const useMfApiDashboard = (role: string, options?: { refetchInterval?: number }) =>
  useQuery({
    queryKey: [role, "mf-api", "dashboard"],
    queryFn: () => fetchMfApiDashboard(role),
    refetchInterval: options?.refetchInterval,
  });

export const useMfApiSchemes = (
  role: string,
  params: { search?: string; page?: number; limit?: number } = {},
  options?: { refetchInterval?: number },
) =>
  useQuery({
    queryKey: [role, "mf-api", "schemes", params],
    queryFn: () => fetchMfApiSchemes(role, params),
    placeholderData: keepPreviousData,
    refetchInterval: options?.refetchInterval,
  });


export const useMfApiScheme = (role: string, id?: string, options?: { refetchInterval?: number }) =>
  useQuery({
    queryKey: [role, "mf-api", "scheme", id],
    queryFn: () => fetchMfApiScheme(role, id || ""),
    enabled: Boolean(id),
    refetchInterval: options?.refetchInterval,
  });

export const useMfApiSyncLogs = (
  role: string,
  params: { page?: number; limit?: number; search?: string } = {},
) =>
  useQuery({
    queryKey: [role, "mf-api", "sync-logs", params],
    queryFn: () => fetchMfApiSyncLogs(role, params),
    placeholderData: keepPreviousData,
  });

export const useMfApiSyncAll = (role: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncAllMfApiSchemes(role),
    onSuccess: (response) => {
      // Fix C: warn instead of success when the API rate-limited the sync
      if ((response as any)?.status === "rate_limited") {
        toast(
          response.message || "Sync paused — API rate limited. Queued schemes will resume on next run.",
          { icon: "⚠️" },
        );
      } else {
        toast.success(response.message || "MF API sync started");
      }
      void queryClient.invalidateQueries({ queryKey: [role, "mf-api"] });
    },
    onError: () => {
      toast.error("Failed to start MF API sync");
    },
  });
};

export const useMfApiSyncActive = (role: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncActiveMfApiSchemes(role),
    onSuccess: (response) => {
      // Fix C: warn instead of success when rate-limited
      if ((response as any)?.status === "rate_limited") {
        toast(
          response.message || "Sync paused — API rate limited. Queued schemes will resume on next run.",
          { icon: "⚠️" },
        );
      } else {
        toast.success(response.message || "Active MF API sync started");
      }
      void queryClient.invalidateQueries({ queryKey: [role, "mf-api"] });
    },
    onError: () => {
      toast.error("Failed to start active MF API sync");
    },
  });
};

export const useMfApiSyncOne = (role: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      schemeId?: string;
      schemeName?: string;
      externalSchemeId?: string;
    }) => syncOneMfApiScheme(role, payload),
    onSuccess: (response, payload) => {
      toast.success(response.message || "Scheme sync started");
      void queryClient.invalidateQueries({ queryKey: [role, "mf-api"] });
      if (payload.schemeId) {
        void queryClient.invalidateQueries({
          queryKey: [role, "mf-api", "scheme", payload.schemeId],
        });
      }
    },
    onError: () => {
      toast.error("Scheme sync could not complete");
    },
  });
};

export const useMfApiImport = (role: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      validateOnly,
    }: {
      file: File;
      validateOnly: boolean;
    }) => importMfApiData(role, file, validateOnly),
    onSuccess: (report: MfApiImportReport) => {
      const parts: string[] = [];
      if (report.validateOnly) {
        parts.push(`Validated ${report.totalRows ?? 0} rows`);
        if ((report.errors?.length ?? 0) > 0) parts.push(`${report.errors!.length} issues found`);
      } else {
        if (report.inserted) parts.push(`${report.inserted} new`);
        if (report.updated) parts.push(`${report.updated} updated`);
        if (report.activated) parts.push(`${report.activated} bridged to manual`);
        if (report.rejected) parts.push(`${report.rejected} rejected`);
        if (!parts.length) parts.push("Import completed");
      }
      toast.success(parts.join(" · "));
      void queryClient.invalidateQueries({ queryKey: [role, "mf-api"] });
    },
    onError: () => {
      toast.error("MF API import failed");
    },
  });
};

export const useMfApiExport = (role: string) =>
  useMutation({
    mutationFn: () => exportMfApiData(role),
    onError: () => {
      toast.error("MF API export failed");
    },
  });

export const useMfApiToggleActive = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleMfApiSchemeActive(role, id, is_active),
    onSuccess: (_, { id, is_active }) => {
      toast.success(`Scheme ${is_active ? "activated" : "deactivated"}`);
      // Immediate invalidation
      void queryClient.invalidateQueries({ queryKey: [role, "mf-api"] });
    },
    onError: () => toast.error("Failed to update scheme"),
  });
};

export const useMfApiBulkToggle = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, is_active }: { ids: string[]; is_active: boolean }) =>
      bulkToggleMfApiSchemes(role, ids, is_active),
    onSuccess: (_, { ids, is_active }) => {
      toast.success(`${ids.length} schemes ${is_active ? "activated" : "deactivated"}`);
      // Immediate invalidation
      void queryClient.invalidateQueries({ queryKey: [role, "mf-api"] });
    },
    onError: () => toast.error("Failed to bulk update schemes"),
  });
};

export const useMfApiMarkReviewed = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => markMfApiSchemesReviewed(role, ids),
    onSuccess: () => {
      toast.success("Marked as reviewed");
      void queryClient.invalidateQueries({ queryKey: [role, "mf-api"] });
    },
  });
};

// ─── Top Holdings ───────────────────────────────────────────────────────────

export const useMfApiTopHoldings = (role: string, id: string) =>
  useQuery({
    queryKey: [role, "mf-api", "schemes", id, "top-holdings"],
    queryFn: () => getMfApiTopHoldingsApi(role, id).then((r) => (r as any)?.data),
    enabled: !!id,
  });

export const useMfApiImportTopHoldings = (role: string, id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => importMfApiTopHoldingsApi(role, id, data),
    onSuccess: () => {
      toast.success("Top holdings imported successfully");
      void queryClient.invalidateQueries({
        queryKey: [role, "mf-api", "schemes", id, "top-holdings"],
      });
    },
    onError: () => toast.error("Failed to import top holdings"),
  });
};

// ─── NAV History ────────────────────────────────────────────────────────────

export const useMfApiNavHistory = (role: string, id: string, days: number = 365) =>
  useQuery({
    queryKey: [role, "mf-api", "schemes", id, "nav-history", days],
    queryFn: () => getMfApiNavHistoryApi(role, id, days).then((r) => (r as any)?.data ?? []),
    enabled: !!id,
  });

export const useMfApiSyncToManual = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => syncMfApiToManualApi(role, id),
    onSuccess: (response: any) => {
      const msg = response?.data?.message || response?.message || "Manual fund sync complete";
      toast.success(msg);
      void queryClient.invalidateQueries({ queryKey: [role, "mf-api"] });
      void queryClient.invalidateQueries({ queryKey: [role, "mf-api", "scheme"] });
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || err?.message || "Bridge sync failed";
      toast.error(errMsg);
    },
  });
};

export const useMfApiResyncToManual = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resyncAllToManualApi(role),
    onSuccess: (response: any) => {
      const total = response?.data?.total ?? response?.total ?? 0;
      toast.success(`Re-sync started for ${total} active schemes → manual module`);
      void queryClient.invalidateQueries({ queryKey: [role, "mf-api"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Re-sync failed");
    },
  });
};

export type { MfApiSyncResult };
