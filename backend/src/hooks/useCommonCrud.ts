




// // src/hooks/useCommonCrud.ts
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { axiosApi } from "../api/axios";
// import { toast } from "react-hot-toast";

// export interface CommonCrudProps {
//   module: string;                // e.g., "cluster", "article"
//   role?: string;                 // optional role for admin/editor routes
//   searchValue?: string;
//   page?: number;
//   limit?: number;
//   sortField?: string;
//   sortOrder?: "asc" | "desc";
//   listKey?: string;              // optional override for array key in response
// }

// export interface ApiMessage {
//   success?: boolean;
//   message?: string;
//   data?: any;
// }

// export interface CrudResponse<T> {
//   total?: number;
//   limit?: number;
//   currentPage?: number;
//   totalPages?: number;
//   [key: string]: any; // dynamic keys like clusters, articles, items
// }

// export const useCommonCrud = <T>({
//   module,
//   role,
//   page = 1,
//   limit = 10,
//   searchValue = "",
//   sortField = "",
//   sortOrder = "asc",
//   listKey,
// }: CommonCrudProps) => {
//   const queryClient = useQueryClient();
//   const defaultListKey = listKey ?? `${module}s`;
//   const queryKey = [module, "list", { page, limit, searchValue, sortField, sortOrder }];

//   const extractListFromData = (data?: CrudResponse<T>): T[] => {
//     if (!data) return [];
//     const list = data[defaultListKey] ?? data.items ?? [];
//     return Array.isArray(list) ? (list as T[]) : [];
//   };

//   // ------------------ FETCH LIST ------------------
//   const { data, isLoading, refetch } = useQuery<CrudResponse<T>>({
//     queryKey,
//     queryFn: async () => {
//       const res = await axiosApi.getList<CrudResponse<T>>(`/${module}`, {
//         page,
//         limit,
//         search: searchValue,
//         sortBy: sortField,
//         sortOrder,
//       });
//       return res ?? { total: 0, limit, currentPage: page, totalPages: 1, [defaultListKey]: [] };
//     },
//     placeholderData: { total: 0, limit, currentPage: page, totalPages: 1, [defaultListKey]: [] },
//     retry: false,
//   });

//   // ------------------ FETCH ONE ------------------
//   const getOne = async (id: string) => {
//     try {
//       const res = await axiosApi.getOne<T>(`/${module}/${id}`);
//       return res ?? null;
//     } catch (err: any) {
//       toast.error(err?.message || "Failed to fetch record");
//       throw err;
//     }
//   };

//   // ------------------ CREATE ------------------
//   const createMutation = useMutation({
//     mutationFn: async (payload: any) => {
//       const url = role ? `/${role}/${module}/create` : `/${module}/create`;
//       return axiosApi.post<ApiMessage>(url, payload);
//     },
//     onSuccess: (res) => {
//       toast.success(res?.message || "Created successfully");
//       queryClient.invalidateQueries({ queryKey });
//     },
//     onError: (err: any) => toast.error(err?.message || "Create failed"),
//   });

//   const createRecord = (payload: any) => createMutation.mutateAsync(payload);

//   // ------------------ UPDATE ------------------
//   const updateMutation = useMutation({
//     mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
//       const url = role ? `/${role}/${module}/edit/${id}` : `/${module}/edit/${id}`;
//       return axiosApi.update<ApiMessage>(url, payload);
//     },
//     onSuccess: (res) => {
//       toast.success(res?.message || "Updated successfully");
//       queryClient.invalidateQueries({ queryKey });
//     },
//     onError: (err: any) => toast.error(err?.message || "Update failed"),
//   });

//   const updateRecord = (id: string, payload: any) => updateMutation.mutateAsync({ id, payload });

//   // ------------------ DELETE ------------------
//   const deleteMutation = useMutation({
//     mutationFn: async (id: string) => {
//       const url = role ? `/${role}/${module}/delete/${id}` : `/${module}/delete/${id}`;
//       return axiosApi.remove<ApiMessage>(url);
//     },
//     onMutate: async (id) => {
//       await queryClient.cancelQueries({ queryKey });
//       const previous = queryClient.getQueryData<CrudResponse<T>>(queryKey);
//       queryClient.setQueryData(queryKey, (old: any) => {
//         if (!old) return old;
//         const updated = extractListFromData(old).filter((item: any) => item._id !== id);
//         return { ...old, [defaultListKey]: updated, total: Math.max((old.total || 1) - 1, 0) };
//       });
//       return { previous };
//     },
//     onError: (err, _id, ctx) => {
//       toast.error(err?.message || "Delete failed");
//       if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
//     },
//     onSettled: () => queryClient.invalidateQueries({ queryKey }),
//   });

//   const deleteRecord = async (id: string) => {
//     try {
//       const res = await deleteMutation.mutateAsync(id);
//       return { success: true, data: res };
//     } catch (err: any) {
//       return { success: false, message: err?.message };
//     }
//   };

//   // ------------------ TOGGLE STATUS ------------------
//   const toggleStatusMutation = useMutation({
//     mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
//       const url = role ? `/${role}/${module}/toggle-status/${id}` : `/${module}/toggle-status/${id}`;
//       return axiosApi.patch<ApiMessage>(url, { is_active: status ? 1 : 0 });
//     },
//     onMutate: async ({ id, status }) => {
//       await queryClient.cancelQueries({ queryKey });
//       const previous = queryClient.getQueryData(queryKey);
//       queryClient.setQueryData(queryKey, (old: any) => {
//         if (!old) return old;
//         const updated = extractListFromData(old).map((item: any) =>
//           item._id === id ? { ...item, is_active: status ? 1 : 0 } : item
//         );
//         return { ...old, [defaultListKey]: updated };
//       });
//       return { previous };
//     },
//     onError: (err: any, _vars, ctx) => {
//       toast.error(err?.message || "Failed to update status");
//       if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
//     },
//     onSuccess: (res) => toast.success(res?.message || "Status updated"),
//     onSettled: () => queryClient.invalidateQueries({ queryKey }),
//   });

//   const toggleStatus = (id: string, status: boolean) =>
//     toggleStatusMutation.mutateAsync({ id, status });

//   return {
//     data: data ?? { total: 0, limit, currentPage: page, totalPages: 1, [defaultListKey]: [] },
//     extractList: extractListFromData(data),
//     isLoading,
//     refetch,
//     getOne,
//     createRecord,
//     updateRecord,
//     deleteRecord,
//     toggleStatus,
    
//   };
// };

// export default useCommonCrud;



// // src/hooks/useCommonCrud.ts
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { axiosApi } from "../api/axios";
// import { toast } from "react-hot-toast";

// export interface CommonCrudProps {
//   module: string;                // e.g., "cluster", "article"
//   role?: string;                 // optional role for admin/editor routes
//   searchValue?: string;
//   page?: number;
//   limit?: number;
//   sortField?: string;
//   sortOrder?: "asc" | "desc";
//   listKey?: string;              // optional override for array key in response
//   enabled?: boolean;             // new: allow conditional fetching
// }

// export interface ApiMessage {
//   success?: boolean;
//   message?: string;
//   data?: any;
// }

// export interface CrudResponse<T> {
//   total?: number;
//   limit?: number;
//   currentPage?: number;
//   totalPages?: number;
//   [key: string]: any; // dynamic keys like clusters, articles, items
// }

// export const useCommonCrud = <T>({
//   module,
//   role,
//   page = 1,
//   limit = 10,
//   searchValue = "",
//   sortField = "",
//   sortOrder = "asc",
//   listKey,
//   enabled = true, //  default to true
// }: CommonCrudProps) => {
//   const queryClient = useQueryClient();
//   const defaultListKey = listKey ?? `${module}s`;
//   const queryKey = [module, "list", { page, limit, searchValue, sortField, sortOrder }];

//   const extractListFromData = (data?: CrudResponse<T>): T[] => {
//     if (!data) return [];
//     const list = data[defaultListKey] ?? data.items ?? [];
//     return Array.isArray(list) ? (list as T[]) : [];
//   };

//   // ------------------ FETCH LIST ------------------
//   const { data, isLoading, refetch } = useQuery<CrudResponse<T>>({
//     queryKey,
//     queryFn: async () => {
//       const res = await axiosApi.getList<CrudResponse<T>>(`/${module}`, {
//         page,
//         limit,
//         search: searchValue,
//         sortBy: sortField,
//         sortOrder,
//       });
//       return res ?? { total: 0, limit, currentPage: page, totalPages: 1, [defaultListKey]: [] };
//     },
//     placeholderData: { total: 0, limit, currentPage: page, totalPages: 1, [defaultListKey]: [] },
//     retry: false,
//     enabled, // conditional fetch
//   });

//   // ------------------ FETCH ONE ------------------
//   const getOne = async (id: string) => {
//     try {
//       const res = await axiosApi.getOne<T>(`/${module}/${id}`);
//       return res ?? null;
//     } catch (err: any) {
//       toast.error(err?.message || "Failed to fetch record");
//       throw err;
//     }
//   };

//   // ------------------ CREATE ------------------
//   const createMutation = useMutation({
//     mutationFn: async (payload: any) => {
//       const url = role ? `/${role}/${module}/create` : `/${module}/create`;
//       return axiosApi.post<ApiMessage>(url, payload);
//     },
//     onSuccess: (res) => {
//       toast.success(res?.message || "Created successfully");
//       queryClient.invalidateQueries({ queryKey });
//     },
//     onError: (err: any) => toast.error(err?.message || "Create failed"),
//   });

//   const createRecord = (payload: any) => createMutation.mutateAsync(payload);

//   // ------------------ UPDATE ------------------
//   // const updateMutation = useMutation({
//   //   mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
//   //     const url = role ? `/${role}/${module}/edit/${id}` : `/${module}/edit/${id}`;
//   //     return axiosApi.update<ApiMessage>(url, payload);
//   //   },
//   //   onSuccess: (res) => {
//   //     toast.success(res?.message || "Updated successfully");
//   //     queryClient.invalidateQueries({ queryKey });
//   //   },
//   //   onError: (err: any) => toast.error(err?.message || "Update failed"),
//   // });

// const updateMutation = useMutation({
//   mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
//     const url = role ? `/${role}/${module}/edit/${id}` : `/${module}/edit/${id}`;
//     // Add multipart/form-data header if payload is FormData
//     const headers =
//       payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
//     return axiosApi.update<ApiMessage>(url, payload, { headers });
//   },
//   onSuccess: (res) => {
//     toast.success(res?.message || "Updated successfully");
//     queryClient.invalidateQueries([module, "list"]); // simplified stable key
//   },
//   onError: (err: any) => toast.error(err?.message || "Update failed"),
// });


//   const updateRecord = (id: string, payload: any) => updateMutation.mutateAsync({ id, payload });

//   // ------------------ DELETE ------------------
//   const deleteMutation = useMutation({
//     mutationFn: async (id: string) => {
//       const url = role ? `/${role}/${module}/delete/${id}` : `/${module}/delete/${id}`;
//       return axiosApi.remove<ApiMessage>(url);
//     },
//     onMutate: async (id) => {
//       await queryClient.cancelQueries({ queryKey });
//       const previous = queryClient.getQueryData<CrudResponse<T>>(queryKey);
//       queryClient.setQueryData(queryKey, (old: any) => {
//         if (!old) return old;
//         const updated = extractListFromData(old).filter((item: any) => item._id !== id);
//         return { ...old, [defaultListKey]: updated, total: Math.max((old.total || 1) - 1, 0) };
//       });
//       return { previous };
//     },
//     onError: (err, _id, ctx) => {
//       toast.error(err?.message || "Delete failed");
//       if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
//     },
//     onSettled: () => queryClient.invalidateQueries({ queryKey }),
//   });

//   const deleteRecord = async (id: string) => {
//     try {
//       const res = await deleteMutation.mutateAsync(id);
//       return { success: true, data: res };
//     } catch (err: any) {
//       return { success: false, message: err?.message };
//     }
//   };

//   // ------------------ TOGGLE STATUS ------------------
//   const toggleStatusMutation = useMutation({
//     mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
//       const url = role ? `/${role}/${module}/toggle-status/${id}` : `/${module}/toggle-status/${id}`;
//       return axiosApi.patch<ApiMessage>(url, { is_active: status ? 1 : 0 });
//     },
//     onMutate: async ({ id, status }) => {
//       await queryClient.cancelQueries({ queryKey });
//       const previous = queryClient.getQueryData(queryKey);
//       queryClient.setQueryData(queryKey, (old: any) => {
//         if (!old) return old;
//         const updated = extractListFromData(old).map((item: any) =>
//           item._id === id ? { ...item, is_active: status ? 1 : 0 } : item
//         );
//         return { ...old, [defaultListKey]: updated };
//       });
//       return { previous };
//     },
//     onError: (err: any, _vars, ctx) => {
//       toast.error(err?.message || "Failed to update status");
//       if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
//     },
//     onSuccess: (res) => toast.success(res?.message || "Status updated"),
//     onSettled: () => queryClient.invalidateQueries({ queryKey }),
//   });

//   const toggleStatus = (id: string, status: boolean) =>
//     toggleStatusMutation.mutateAsync({ id, status });

//   return {
//     data: data ?? { total: 0, limit, currentPage: page, totalPages: 1, [defaultListKey]: [] },
//     extractList: extractListFromData(data),
//     isLoading,
//     refetch,
//     getOne,
//     createRecord,
//     updateRecord,
//     deleteRecord,
//     toggleStatus,
//   };
// };

// export default useCommonCrud;




// src/hooks/useCommonCrud.ts
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
      return axiosApi.post<ApiMessage>(url, payload);
    },
    onSuccess: () => {
      toast.success("Created successfully");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => toast.error(err?.message || "Create failed"),
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
