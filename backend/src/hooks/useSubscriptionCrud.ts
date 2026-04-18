import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
  includeInactive?: boolean;
}

export interface SubscriptionItem {
  subscription: {
    _id?: string;
    plan_id?: { _id?: string; id?: string; name?: string };
    start_date?: string | null;
    end_date?: string | null;
    status?: string;
    trial_type?: string;
    is_deleted?: boolean;
    created_at?: string;
    last_payment_id?: unknown;
  } | null;
  paymentHistory: unknown[];
  currentStatus: string;
  planType: string;
  isPromotional: boolean;
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
}

export interface SubscriptionApiResponse {
  success: boolean;
  data?: SubscriptionItem[];
  subscriptions?: SubscriptionItem[];
  users?: SubscriptionItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiMessage {
  success?: boolean;
  message?: string;
  data?: unknown;
}

type CrudPayload = Record<string, unknown> | FormData;

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== "object" || error === null) return fallback;
  const err = error as ApiError;
  return err.response?.data?.message || err.message || fallback;
};

export const useSubscriptionCrud = ({
  role = "admin",
  page = 1,
  limit = 10,
  searchValue = "",
  sortField = "",
  sortOrder = "desc",
  enabled = true,
  includeInactive = false,
}: SubscriptionParams = {}) => {
  const queryClient = useQueryClient();
  const queryKey = [
    "subscriptions",
    role,
    { page, limit, searchValue, sortField, sortOrder },
  ];

  // Fetch subscriptions - FIXED VERSION
  const { data, isLoading,
    isFetching, error, refetch } = useQuery<SubscriptionApiResponse>(
    {
      queryKey,
      queryFn: async () => {
        try {
          // Prepare query parameters
          const params: Record<string, string | number> = {};

          if (page) params.page = page;
          if (limit) params.limit = limit;
          if (searchValue) params.search = searchValue;
          if (sortField) params.sortBy = sortField;
          if (sortOrder) params.sortOrder = sortOrder;
          if (includeInactive) params.includeInactive = "true";

          const response = await axiosApi.get<SubscriptionApiResponse>(
            `/${role}/subscriptions`,
            params, //  Pass params directly, not nested in another object
          );

          const responseData = response as SubscriptionApiResponse;

          // Extract subscriptions from various possible properties
          let subscriptions: SubscriptionItem[] = [];
          if (Array.isArray(responseData.data)) {
            subscriptions = responseData.data;
          } else if (Array.isArray(responseData.subscriptions)) {
            subscriptions = responseData.subscriptions;
          } else if (Array.isArray(responseData.users)) {
            subscriptions = responseData.users;
          }

          return {
            success: responseData.success ?? true,
            data: subscriptions,
            total: responseData.total || 0,
            page: responseData.page || page,
            limit: responseData.limit || limit,
            totalPages:
              responseData.totalPages ||
              Math.ceil((responseData.total || 0) / limit),
          };
        } catch (error: unknown) {
          toast.error(getErrorMessage(error, "Failed to fetch subscriptions"));

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
      placeholderData: keepPreviousData,
      retry: 1,
      enabled,
    },
  );

  // Create subscription
  const createMutation = useMutation({
    mutationFn: async (payload: CrudPayload) => {
      return await axiosApi.create<ApiMessage>(
        `/${role}/subscriptions/create`,
        payload,
      );
    },
    onSuccess: (response) => {
      const message = response?.message || "Subscription created successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Create failed"));
    },
  });

  // Update subscription
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CrudPayload }) => {
      return await axiosApi.update<ApiMessage>(
        `/${role}/subscriptions/edit/${id}`,
        payload,
      );
    },
    onSuccess: (response) => {
      const message = response?.message || "Subscription updated successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Update failed"));
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
      const message = response?.message || "Subscription deleted successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Delete failed"));
    },
  });

  // Get single subscription
  const getOne = async (id: string) => {
    try {
      const response = await axiosApi.get<SubscriptionItem>(
        `/${role}/subscriptions/${id}`,
      );
      return response;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to fetch subscription"));
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
      const message = response?.message || "Status updated successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update status"));
    },
  });

  // Manual assignment
  const assignMutation = useMutation({
    mutationFn: async (payload: CrudPayload) => {
      return await axiosApi.post<ApiMessage>(
        `/${role}/subscriptions/assign`,
        payload,
      );
    },
    onSuccess: (response) => {
      const message = response?.message || "Subscription assigned successfully";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Assignment failed"));
    },
  });

  const assignSubscription = (payload: CrudPayload) =>
    assignMutation.mutateAsync(payload);

  return {
    // Query data
    data: data || { success: true, data: [], total: 0 },
    extractList: data?.data || [],
    isLoading,
    isFetching,
    error,
    refetch,

    // CRUD operations
    createRecord: createMutation.mutateAsync,
    updateRecord: (id: string, payload: CrudPayload) =>
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
