import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
}

export interface ApiMessage {
  success?: boolean;
  message?: string;
  data?: any;
}

export interface CrudResponse<T> {
  total?: number;
  limit?: number;
  currentPage?: number;
  totalPages?: number;
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
}: CommonCrudProps) => {
  const queryClient = useQueryClient();
  const defaultListKey = listKey ?? `${module}s`;
  const queryKey = [
    module,
    "list",
    { page, limit, searchValue, sortField, sortOrder },
  ];

  const extractListFromData = (data?: CrudResponse<T>): T[] => {
    if (!data) return [];
    const list = data[defaultListKey] ?? data.items ?? data.data ?? [];
    return Array.isArray(list) ? list : [];
  };

  /* ------------------ FETCH LIST ------------------ */
  const { data, isLoading, refetch } = useQuery<CrudResponse<T>>({
    queryKey,
    queryFn: async () => {
      const endpoint = role ? `/${role}/${module}` : `/${module}`;
      const res = await axiosApi.getList<CrudResponse<T>>(endpoint, {
        page,
        limit,
        searchValue,
        sortField,
        sortOrder,
      });
      return (
        res ?? {
          total: 0,
          limit,
          currentPage: page,
          totalPages: 1,
          [defaultListKey]: [],
        }
      );
    },
    placeholderData: {
      total: 0,
      limit,
      currentPage: page,
      totalPages: 1,
      [defaultListKey]: [],
    },
    retry: false,
    enabled,
  });

  /* ------------------ FETCH ONE ------------------ */
  const getOne = async (id: string) => {
    try {
      const endpoint = role ? `/${role}/${module}/${id}` : `/${module}/${id}`;
      return await axiosApi.getOne<T>(endpoint);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch record";
      toast.error(errorMessage);
      throw err;
    }
  };

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
      const errorMessage =
        err?.response?.data?.message || err?.message || "Create failed";
      toast.error(errorMessage);
    },
  });

  const createRecord = (payload: any) => createMutation.mutateAsync(payload);

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
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message || "Update failed";
      toast.error(errorMessage);
    },
  });

  const updateRecord = (id: string, payload: any) =>
    updateMutation.mutateAsync({ id, payload });

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
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message || "Delete failed";
      toast.error(errorMessage);
    },
  });

  const deleteRecord = (id: string) => deleteMutation.mutateAsync(id);

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
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message || "Failed to update status";
      toast.error(errorMessage);
    },
  });

  const toggleStatus = (id: string, status: boolean) =>
    toggleStatusMutation.mutateAsync({ id, status });

  return {
    data,
    extractList: extractListFromData(data),
    isLoading,
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
