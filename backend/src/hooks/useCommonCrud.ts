import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { axiosApi } from "../api/axios";
import { toast } from "react-hot-toast";

export interface CommonCrudProps {
  module: string;
  role?: string;
  searchValue?: string;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  listKey?: string;
  enabled?: boolean;
  liveIntervalMs?: number;
  extraParams?: Record<string, string | number | boolean | undefined | null>;
}

export interface ApiMessage {
  success?: boolean;
  message?: string;
  data?: any;
}

export interface CrudResponse<T = unknown> {
  total?: number;
  limit?: number;
  currentPage?: number;
  totalPages?: number;
  items?: T[];
  data?: T[] | T;
  [key: string]: any;
}

export const useCommonCrud = <T>({
  module,
  role,
  page = 1,
  limit = 10,
  searchValue = "",
  sortField = "",
  sortOrder = "asc",
  listKey,
  enabled = true,
  liveIntervalMs = 0,
  extraParams,
}: CommonCrudProps) => {
  const queryClient = useQueryClient();
  const defaultListKey = listKey ?? `${module}s`;
  const queryKey = [
    role || "public",
    module,
    "list",
    { page, limit, searchValue, sortField, sortOrder, ...(extraParams || {}) },
  ];

  /* ------------------ FETCH LIST ------------------ */
  const { data, isLoading, isFetching, refetch } = useQuery<CrudResponse<T>>({
    queryKey,
    queryFn: async () => {
      const endpoint = role ? `/${role}/${module}` : `/${module}`;
      const res = await axiosApi.getList<CrudResponse<T>>(endpoint, {
        page,
        limit,
        searchValue,
        sortField,
        sortOrder,
        ...(extraParams || {}),
      });
      return res ?? { total: 0, limit, currentPage: page, totalPages: 1, [defaultListKey]: [] };
    },
    placeholderData: keepPreviousData,
    retry: false,
    enabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
    refetchInterval: liveIntervalMs > 0 ? liveIntervalMs : false,
  });

  /* ------------------ FETCH ONE ------------------ */
  const getOne = useCallback(async (id: string) => {
    const endpoint = role ? `/${role}/${module}/${id}` : `/${module}/${id}`;
    return axiosApi.getOne<T>(endpoint);
  }, [module, role]);

  /* ------------------ CREATE ------------------ */
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = role ? `/${role}/${module}/create` : `/${module}/create`;
      return axiosApi.create<ApiMessage>(url, payload);
    },
    onSuccess: (response) => {
      const message =
        (response as ApiMessage)?.message || "Created successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      console.error("Create Error:", err);
    },
  });

  const createRecord = useCallback(
    (payload: any) => createMutation.mutateAsync(payload),
    [createMutation],
  );

  /* ------------------ UPDATE ------------------ */
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const url = role
        ? `/${role}/${module}/edit/${id}`
        : `/${module}/edit/${id}`;
      return axiosApi.update<ApiMessage>(url, payload);
    },
    onSuccess: (response) => {
      const message =
        (response as ApiMessage)?.message || "Updated successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateRecord = useCallback(
    (id: string, payload: any) => updateMutation.mutateAsync({ id, payload }),
    [updateMutation],
  );

  /* ------------------ DELETE ------------------ */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const url = role
        ? `/${role}/${module}/delete/${id}`
        : `/${module}/delete/${id}`;
      return axiosApi.remove<ApiMessage>(url);
    },
    onSuccess: (response) => {
      const message =
        (response as ApiMessage)?.message || "Deleted successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteRecord = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  );

  /* ------------------ TOGGLE STATUS ------------------ */
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const url = role
        ? `/${role}/${module}/toggle-status/${id}`
        : `/${module}/toggle-status/${id}`;
      return axiosApi.patch<ApiMessage>(url, { is_active: status ? 1 : 0 });
    },
    onSuccess: (response) => {
      const message = (response as ApiMessage)?.message || "Status updated";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleStatus = useCallback(
    (id: string, status: boolean) =>
      toggleStatusMutation.mutateAsync({ id, status }),
    [toggleStatusMutation],
  );

  const extractList = useMemo<T[]>(() => {
    if (!data) return [];
    const list = data[defaultListKey] ?? data.items ?? data.data ?? [];
    return Array.isArray(list) ? list : [];
  }, [data, defaultListKey]);

  return {
    data,
    extractList,
    isLoading,
    isFetching,
    refetch,
    getOne,
    createRecord,
    updateRecord,
    deleteRecord,
    toggleStatus,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export default useCommonCrud;
