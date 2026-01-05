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
  const queryKey = [module, "list", { page, limit, searchValue, sortField, sortOrder }];

  const extractListFromData = (data?: CrudResponse<T>): T[] => {
    if (!data) return [];
    const list = data[defaultListKey] ?? data.items ?? [];
    return Array.isArray(list) ? list : [];
  };

  /* ------------------ FETCH LIST ------------------ */
  const { data, isLoading, refetch } = useQuery<CrudResponse<T>>({
    queryKey,
    queryFn: async () => {
      const res = await axiosApi.getList<CrudResponse<T>>(`/${module}`, {
        page,
        limit,
        search: searchValue,
        sortBy: sortField,
        sortOrder,
      });
      return res ?? { total: 0, limit, currentPage: page, totalPages: 1, [defaultListKey]: [] };
    },
    placeholderData: { total: 0, limit, currentPage: page, totalPages: 1, [defaultListKey]: [] },
    retry: false,
    enabled,
  });

  /* ------------------ FETCH ONE ------------------ */
  const getOne = async (id: string) => {
    try {
      return await axiosApi.getOne<T>(`/${module}/${id}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch record");
      throw err;
    }
  };

  /* ------------------ CREATE ------------------ */
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = role ? `/${role}/${module}/create` : `/${module}/create`;
      console.log("🔍 Creating at URL:", url);
      console.log("🔍 Payload:", payload);
      return axiosApi.create<ApiMessage>(url, payload);
    },
    onSuccess: () => {
      toast.success("Created successfully");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      console.log("Create Error:", err);
      console.log("Error Response:", err.response?.data);
      console.log("Error Status:", err.response?.status);
      console.log("Error Message:", err.message);
      console.log("Full Error Object:", JSON.stringify(err, null, 2));
      toast.error(err.response?.data?.message || err.message || "Create failed");
    },
  });

  const createRecord = (payload: any) => createMutation.mutateAsync(payload);

  /* ------------------ UPDATE ------------------ */
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const url = role ? `/${role}/${module}/edit/${id}` : `/${module}/edit/${id}`;
      return axiosApi.update<ApiMessage>(url, payload);
    },
    onSuccess: () => {
      toast.success("Updated successfully");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => toast.error(err?.message || "Update failed"),
  });

  const updateRecord = (id: string, payload: any) =>
    updateMutation.mutateAsync({ id, payload });

  /* ------------------ DELETE ------------------ */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const url = role ? `/${role}/${module}/delete/${id}` : `/${module}/delete/${id}`;
      return axiosApi.remove<ApiMessage>(url);
    },
    onSuccess: () => {
      toast.success("Deleted successfully");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => toast.error(err?.message || "Delete failed"),
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
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update status"),
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
  };
};

export default useCommonCrud;
