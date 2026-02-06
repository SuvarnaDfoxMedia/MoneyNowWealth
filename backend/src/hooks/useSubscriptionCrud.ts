// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { axiosApi } from "../api/axios";
// import { toast } from "react-hot-toast";

// export interface SubscriptionParams {
//   role?: string;
//   page?: number;
//   limit?: number;
//   searchValue?: string;
//   sortField?: string;
//   sortOrder?: "asc" | "desc";
//   enabled?: boolean;
// }

// export interface SubscriptionItem {
//   user: {
//     _id: string;
//     title?: string;
//     firstname: string;
//     lastname: string;
//     email: string;
//     countryCode?: string;
//     mobile: string;
//     role: string;
//     profileImage?: string;
//     created_at: string;
//   };
//   subscription: any | null;
//   paymentHistory: any[];
//   currentStatus: string;
//   planType: string;
//   isPromotional: boolean;
// }

// export interface SubscriptionApiResponse {
//   success: boolean;
//   data?: SubscriptionItem[];
//   subscriptions?: SubscriptionItem[];
//   total: number;
//   page?: number;
//   limit?: number;
//   totalPages?: number;
// }

// export interface ApiMessage {
//   success?: boolean;
//   message?: string;
//   data?: any;
// }

// export const useSubscriptionCrud = ({
//   role = "admin",
//   page = 1,
//   limit = 10,
//   searchValue = "",
//   sortField = "",
//   sortOrder = "asc",
//   enabled = true,
// }: SubscriptionParams = {}) => {
//   const queryClient = useQueryClient();
//   const queryKey = [
//     "subscriptions",
//     role,
//     { page, limit, searchValue, sortField, sortOrder },
//   ];

//   // Fetch subscriptions
//   const { data, isLoading, error, refetch } = useQuery<SubscriptionApiResponse>(
//     {
//       queryKey,
//       queryFn: async () => {
//         try {
//           const response = await axiosApi.getList<SubscriptionApiResponse>(
//             `/${role}/subscriptions`,
//             {
//               page,
//               limit,
//               searchValue,
//               sortField,
//               sortOrder,
//             },
//           );

//           // Handle both response structures
//           const subscriptions = response.data || response.subscriptions || [];

//           return {
//             success: response.success || true,
//             data: subscriptions,
//             subscriptions: subscriptions,
//             total: response.total || 0,
//             page: response.page || page,
//             limit: response.limit || limit,
//             totalPages:
//               response.totalPages || Math.ceil((response.total || 0) / limit),
//           };
//         } catch (error: any) {
//           console.error(" useSubscriptionCrud: Fetch error", error);
//           toast.error(
//             error?.response?.data?.message || "Failed to fetch subscriptions",
//           );

//           return {
//             success: false,
//             data: [],
//             subscriptions: [],
//             total: 0,
//             page,
//             limit,
//             totalPages: 0,
//           };
//         }
//       },
//       placeholderData: {
//         success: true,
//         data: [],
//         subscriptions: [],
//         total: 0,
//         page,
//         limit,
//         totalPages: 0,
//       },
//       retry: 1,
//       enabled,
//     },
//   );

//   // Create subscription
//   const createMutation = useMutation({
//     mutationFn: async (payload: any) => {
//       return await axiosApi.create<ApiMessage>(
//         `/${role}/subscriptions/create`,
//         payload,
//       );
//     },
//     onSuccess: (response) => {
//       toast.success(response?.message || "Subscription created successfully");
//       queryClient.invalidateQueries({ queryKey });
//     },
//     onError: (error: any) => {
//       toast.error(
//         error?.response?.data?.message || error?.message || "Create failed",
//       );
//     },
//   });

//   // Update subscription
//   const updateMutation = useMutation({
//     mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
//       return await axiosApi.update<ApiMessage>(
//         `/${role}/subscriptions/edit/${id}`,
//         payload,
//       );
//     },
//     onSuccess: (response) => {
//       toast.success(response?.message || "Subscription updated successfully");
//       queryClient.invalidateQueries({ queryKey });
//     },
//     onError: (error: any) => {
//       toast.error(
//         error?.response?.data?.message || error?.message || "Update failed",
//       );
//     },
//   });

//   // Delete subscription
//   const deleteMutation = useMutation({
//     mutationFn: async (id: string) => {
//       return await axiosApi.remove<ApiMessage>(
//         `/${role}/subscriptions/delete/${id}`,
//       );
//     },
//     onSuccess: (response) => {
//       toast.success(response?.message || "Subscription deleted successfully");
//       queryClient.invalidateQueries({ queryKey });
//     },
//     onError: (error: any) => {
//       toast.error(
//         error?.response?.data?.message || error?.message || "Delete failed",
//       );
//     },
//   });

//   // Get single subscription
//   const getOne = async (id: string) => {
//     try {
//       return await axiosApi.getOne<SubscriptionItem>(
//         `/${role}/subscriptions/${id}`,
//       );
//     } catch (error: any) {
//       toast.error(
//         error?.response?.data?.message || "Failed to fetch subscription",
//       );
//       throw error;
//     }
//   };

//   // Toggle status
//   const toggleStatusMutation = useMutation({
//     mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
//       return await axiosApi.patch<ApiMessage>(
//         `/${role}/subscriptions/toggle-status/${id}`,
//         {
//           is_active: status ? 1 : 0,
//         },
//       );
//     },
//     onSuccess: (response) => {
//       toast.success(response?.message || "Status updated successfully");
//       queryClient.invalidateQueries({ queryKey });
//     },
//     onError: (error: any) => {
//       toast.error(error?.response?.data?.message || "Failed to update status");
//     },
//   });

//   // Manual assignment
//   const assignMutation = useMutation({
//     mutationFn: async (payload: any) => {
//       return await axiosApi.post<ApiMessage>(
//         `/${role}/subscriptions/assign`,
//         payload,
//       );
//     },
//     onSuccess: (response) => {
//       toast.success(response?.message || "Subscription assigned successfully");
//       queryClient.invalidateQueries({ queryKey });
//     },
//     onError: (error: any) => {
//       toast.error(
//         error?.response?.data?.message || error?.message || "Assignment failed",
//       );
//     },
//   });

//   const assignSubscription = (payload: any) =>
//     assignMutation.mutateAsync(payload);

//   return {
//     // Query data
//     data: data || { success: true, data: [], subscriptions: [], total: 0 },
//     extractList: data?.data || data?.subscriptions || [],
//     subscriptions: data?.subscriptions || data?.data || [],
//     isLoading,
//     error,
//     refetch,

//     // CRUD operations
//     createRecord: createMutation.mutateAsync,
//     updateRecord: (id: string, payload: any) =>
//       updateMutation.mutateAsync({ id, payload }),
//     deleteRecord: deleteMutation.mutateAsync,
//     getOne,
//     toggleStatus: (id: string, status: boolean) =>
//       toggleStatusMutation.mutateAsync({ id, status }),
//     assignSubscription,

//     // Mutation states
//     isCreating: createMutation.isPending,
//     isUpdating: updateMutation.isPending,
//     isDeleting: deleteMutation.isPending,
//     isAssigning: assignMutation.isPending,
//   };
// };

// export default useSubscriptionCrud;

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosApi } from "../api/axios";
import { toast } from "react-hot-toast";

export interface SubscriptionParams {
  role?: string;
  page?: number;
  limit?: number;
  searchValue?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  enabled?: boolean;
}

export interface SubscriptionItem {
  user: {
    _id: string;
    title?: string;
    firstname: string;
    lastname: string;
    email: string;
    countryCode?: string;
    mobile: string;
    role: string;
    profileImage?: string;
    created_at: string;
  };
  subscription: any | null;
  paymentHistory: any[];
  currentStatus: string;
  planType: string;
  isPromotional: boolean;
}

export interface SubscriptionApiResponse {
  success: boolean;
  data?: SubscriptionItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  [key: string]: any;
}

export interface ApiMessage {
  success?: boolean;
  message?: string;
  data?: any;
}

export const useSubscriptionCrud = ({
  role = "admin",
  page = 1,
  limit = 10,
  searchValue = "",
  sortField = "",
  sortOrder = "asc",
  enabled = true,
}: SubscriptionParams = {}) => {
  const queryClient = useQueryClient();
  const queryKey = [
    "subscriptions",
    role,
    { page, limit, searchValue, sortField, sortOrder },
  ];

  // Fetch subscriptions - FIXED VERSION
  const { data, isLoading, error, refetch } = useQuery<SubscriptionApiResponse>(
    {
      queryKey,
      queryFn: async () => {
        try {
          // Prepare query parameters
          const params: Record<string, any> = {};

          if (page) params.page = page;
          if (limit) params.limit = limit;
          if (searchValue) params.search = searchValue;
          if (sortField) params.sortBy = sortField;
          if (sortOrder) params.sortOrder = sortOrder;

          console.log(
            " Fetching subscriptions from:",
            `/${role}/subscriptions`,
          );
          console.log(" Query params:", params);

          const response = await axiosApi.get<SubscriptionApiResponse>(
            `/${role}/subscriptions`,
            params, //  Pass params directly, not nested in another object
          );

          // Handle response data
          const responseData = response as SubscriptionApiResponse;

          // Extract subscriptions from various possible properties
          let subscriptions: SubscriptionItem[] = [];
          if (Array.isArray(responseData.data)) {
            subscriptions = responseData.data;
          } else if (Array.isArray((responseData as any).subscriptions)) {
            subscriptions = (responseData as any).subscriptions;
          } else if (Array.isArray((responseData as any).users)) {
            subscriptions = (responseData as any).users;
          }

          console.log(" Subscription data received:", {
            success: responseData.success,
            count: subscriptions.length,
            total: responseData.total,
          });

          return {
            success: responseData.success || true,
            data: subscriptions,
            total: responseData.total || 0,
            page: responseData.page || page,
            limit: responseData.limit || limit,
            totalPages:
              responseData.totalPages ||
              Math.ceil((responseData.total || 0) / limit),
          };
        } catch (error: any) {
          console.error(" useSubscriptionCrud: Fetch error", error);
          const errorMessage =
            error?.response?.data?.message || "Failed to fetch subscriptions";
          toast.error(errorMessage);

          return {
            success: false,
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
          };
        }
      },
      placeholderData: {
        success: true,
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
      retry: 1,
      enabled,
    },
  );

  // Create subscription
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await axiosApi.create<ApiMessage>(
        `/${role}/subscriptions/create`,
        payload,
      );
    },
    onSuccess: (response) => {
      const message =
        (response as ApiMessage)?.message ||
        "Subscription created successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Create failed";
      toast.error(errorMessage);
    },
  });

  // Update subscription
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await axiosApi.update<ApiMessage>(
        `/${role}/subscriptions/edit/${id}`,
        payload,
      );
    },
    onSuccess: (response) => {
      const message =
        (response as ApiMessage)?.message ||
        "Subscription updated successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Update failed";
      toast.error(errorMessage);
    },
  });

  // Delete subscription
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await axiosApi.remove<ApiMessage>(
        `/${role}/subscriptions/delete/${id}`,
      );
    },
    onSuccess: (response) => {
      const message =
        (response as ApiMessage)?.message ||
        "Subscription deleted successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Delete failed";
      toast.error(errorMessage);
    },
  });

  // Get single subscription
  const getOne = async (id: string) => {
    try {
      const response = await axiosApi.get<SubscriptionItem>(
        `/${role}/subscriptions/${id}`,
      );
      return response;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to fetch subscription";
      toast.error(errorMessage);
      throw error;
    }
  };

  // Toggle status - FIXED URL
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      return await axiosApi.patch<ApiMessage>(
        `/${role}/subscriptions/change/${id}/status`,
        {
          is_active: status ? 1 : 0,
        },
      );
    },
    onSuccess: (response) => {
      const message =
        (response as ApiMessage)?.message || "Status updated successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update status";
      toast.error(errorMessage);
    },
  });

  // Manual assignment
  const assignMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await axiosApi.post<ApiMessage>(
        `/${role}/subscriptions/assign`,
        payload,
      );
    },
    onSuccess: (response) => {
      const message =
        (response as ApiMessage)?.message ||
        "Subscription assigned successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Assignment failed";
      toast.error(errorMessage);
    },
  });

  const assignSubscription = (payload: any) =>
    assignMutation.mutateAsync(payload);

  return {
    // Query data
    data: data || { success: true, data: [], total: 0 },
    extractList: data?.data || [],
    isLoading,
    error,
    refetch,

    // CRUD operations
    createRecord: createMutation.mutateAsync,
    updateRecord: (id: string, payload: any) =>
      updateMutation.mutateAsync({ id, payload }),
    deleteRecord: deleteMutation.mutateAsync,
    getOne,
    toggleStatus: (id: string, status: boolean) =>
      toggleStatusMutation.mutateAsync({ id, status }),
    assignSubscription,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAssigning: assignMutation.isPending,
  };
};

export default useSubscriptionCrud;
