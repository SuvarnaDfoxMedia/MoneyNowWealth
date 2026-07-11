import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../api/axios";

interface PaymentHistoryItem {
  paymentId: string;
  subscriptionId: string;
  planName: string;
  amount: number;
  currency: string;
  type: "new" | "upgrade" | "downgrade";
  trialType?: string;
  status?: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
  transactionId?: string;
  orderId?: string;
}

interface PaymentHistoryResponse {
  success: boolean;
  total: number;
  payments: PaymentHistoryItem[];
}

export const usePaymentHistory = (userId: string | undefined) => {
  return useQuery<PaymentHistoryResponse>({
    queryKey: ["payment-history", userId],
    queryFn: async () => {
      if (!userId) {
        return { success: false, total: 0, payments: [] };
      }

      try {
        // Use authenticated axios instance
        const response = await axiosInstance.get(
          `/admin/subscriptions/user/${userId}/history`,
        );

        const data = response.data;

        // Transform the response to match your interface
        const transformedData: PaymentHistoryResponse = {
          success: data.success || false,
          total: data.total || 0,
          payments: (data.payments || []).map(
            (payment: any, index: number) => ({
              paymentId: payment._id || payment.paymentId || `payment-${index}`,
              subscriptionId: payment.subscriptionId,
              planName: payment.planName,
              amount: payment.amount,
              currency: payment.currency,
              type: payment.type,
              trialType: payment.trialType || (payment.metadata && payment.metadata.trialType) || null,
              status: payment.paymentStatus || payment.status || "pending",
              startDate: payment.startDate,
              endDate: payment.endDate,
              paymentDate: payment.paymentDate,
              transactionId: payment.transactionId,
              orderId: payment.orderId,
            }),
          ),
        };

        return transformedData;
      } catch (error: any) {
        console.error(" Error fetching payment history:", error);
        toast.error(
          error?.response?.data?.message || "Failed to fetch payment history",
        );
        return { success: false, total: 0, payments: [] };
      }
    },
    enabled: !!userId,
    retry: false,
  });
};

export default usePaymentHistory;
