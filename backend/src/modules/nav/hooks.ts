import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  fetchLatestNav,
  fetchNavSchemes,
  fetchNavHistory,
  fetchReturns,
  uploadNavFile,
} from "./api";

export const useLatestNav = (role: string, schemeId: string) =>
  useQuery({
    queryKey: [role, "nav", schemeId, "latest"],
    queryFn: () => fetchLatestNav(role, schemeId),
    enabled: Boolean(schemeId),
  });

export const useNavSchemes = (
  role: string,
  params: { search?: string; page?: number; limit?: number; all?: boolean },
) =>
  useQuery({
    queryKey: [role, "nav-schemes", params],
    queryFn: () => fetchNavSchemes(role, params),
    placeholderData: keepPreviousData,
  });

export const useNavHistory = (
  role: string,
  schemeId: string,
  params: { page?: number; limit?: number; fromDate?: string; toDate?: string },
) =>
  useQuery({
    queryKey: [role, "nav", schemeId, "history", params],
    queryFn: () => fetchNavHistory(role, schemeId, params),
    enabled: Boolean(schemeId),
    placeholderData: keepPreviousData,
  });

export const useReturns = (role: string, schemeId: string) =>
  useQuery({
    queryKey: [role, "returns", schemeId],
    queryFn: () => fetchReturns(role, schemeId),
    enabled: Boolean(schemeId),
  });

export const useNavUpload = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      validateOnly,
    }: {
      file: File;
      validateOnly: boolean;
    }) => uploadNavFile(role, file, validateOnly),
    onSuccess: (response) => {
      toast.success(response.message || "NAV upload completed");
      void queryClient.invalidateQueries({ queryKey: [role, "nav"] });
      void queryClient.invalidateQueries({ queryKey: [role, "nav-schemes"] });
      void queryClient.invalidateQueries({ queryKey: [role, "returns"] });
      void queryClient.invalidateQueries({ queryKey: [role, "schemes"] });
    },
    onError: (error: unknown) => {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message === "string"
          ? (error as { response: { data: { message: string } } }).response.data.message
          : "NAV upload failed";
      toast.error(message);
    },
  });
};
