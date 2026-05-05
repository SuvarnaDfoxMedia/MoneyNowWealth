import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosApi } from "../api/axios";
import { useAuth } from "../context/useAuth";

export type EnquiryModule =
  | "contact-enquiries"
  | "partner-enquiries"
  | "one-crore-journey-enquiries"
  | "who-we-work-with-enquiries"
  | "financial-wellness-enquiries";

export interface EnquiryUnreadCounts {
  total: number;
  counts: Record<EnquiryModule, number>;
}

interface UnreadCountResponse {
  total?: number;
  unreadCount?: number;
  totalUnread?: number;
  counts?: Partial<Record<EnquiryModule, number>>;
  unreadCounts?: Partial<Record<EnquiryModule, number>>;
}

const ENQUIRY_MODULES: EnquiryModule[] = [
  "contact-enquiries",
  "partner-enquiries",
  "one-crore-journey-enquiries",
  "who-we-work-with-enquiries",
  "financial-wellness-enquiries",
];

const ZERO_COUNTS: Record<EnquiryModule, number> = {
  "contact-enquiries": 0,
  "partner-enquiries": 0,
  "one-crore-journey-enquiries": 0,
  "who-we-work-with-enquiries": 0,
  "financial-wellness-enquiries": 0,
};

const ENQUIRY_UNREAD_QUERY_KEY = ["admin", "enquiries", "unread-count"];

const normalizeUnreadCounts = (
  payload?: UnreadCountResponse | null,
): EnquiryUnreadCounts => {
  const incomingCounts = payload?.counts ?? payload?.unreadCounts ?? {};
  const counts = ENQUIRY_MODULES.reduce<Record<EnquiryModule, number>>(
    (acc, module) => {
      acc[module] = Number(incomingCounts[module] ?? 0);
      return acc;
    },
    { ...ZERO_COUNTS },
  );

  const derivedTotal = ENQUIRY_MODULES.reduce(
    (sum, module) => sum + counts[module],
    0,
  );

  return {
    total: Number(payload?.total ?? payload?.totalUnread ?? payload?.unreadCount ?? derivedTotal),
    counts,
  };
};

export const formatUnreadCount = (count: number) => {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
};

export const useEnquiryUnread = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const unreadQuery = useQuery({
    queryKey: ENQUIRY_UNREAD_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await axiosApi.get<UnreadCountResponse>(
          "/admin/enquiries/unread-counts",
        );
        return normalizeUnreadCounts(response.data ?? response);
      } catch {
        return normalizeUnreadCounts();
      }
    },
    enabled: isAdmin,
    initialData: normalizeUnreadCounts(),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (modules?: EnquiryModule[]) => {
      try {
        const response = await axiosApi.patch<UnreadCountResponse>(
          "/admin/enquiries/read",
          modules?.length ? { modules } : { markAll: true },
        );
        return normalizeUnreadCounts(response.data ?? response);
      } catch {
        return null;
      }
    },
    onSuccess: (data, modules) => {
      if (data) {
        queryClient.setQueryData(ENQUIRY_UNREAD_QUERY_KEY, data);
        return;
      }

      if (!modules?.length) {
        queryClient.setQueryData(ENQUIRY_UNREAD_QUERY_KEY, normalizeUnreadCounts());
        return;
      }

      queryClient.setQueryData<EnquiryUnreadCounts>(
        ENQUIRY_UNREAD_QUERY_KEY,
        (current) => {
          const safeCurrent = current ?? normalizeUnreadCounts();
          const nextCounts = { ...safeCurrent.counts };

          modules.forEach((module) => {
            nextCounts[module] = 0;
          });

          return {
            counts: nextCounts,
            total: ENQUIRY_MODULES.reduce(
              (sum, module) => sum + nextCounts[module],
              0,
            ),
          };
        },
      );
    },
  });

  const markModulesAsRead = useCallback(
    async (modules?: EnquiryModule[]) =>
      markAsReadMutation.mutateAsync(modules?.length ? modules : undefined),
    [markAsReadMutation.mutateAsync],
  );

  return {
    ...unreadQuery,
    unread: unreadQuery.data,
    markModulesAsRead,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
};

export default useEnquiryUnread;
