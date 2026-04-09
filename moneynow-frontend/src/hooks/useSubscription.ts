import { useState, useEffect } from "react";
import { API } from "@/app/api/axios";
import { useUserId } from "./useUserId";
import { useRefreshSignal } from "./useRefreshSignal";

export interface SubscriptionPayment {
  _id: string;
  subscriptionId?: string;
  invoiceId?: string;
  planName: string;
  amount: number;
  currency: string;
  type: string;

  startDate: string;
  endDate: string;
  paymentDate: string;

  transactionId?: string;
  orderId?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  requiresPurchase?: boolean;
}

export interface CurrentSubscription {
  planName: string;
  planType: string;
  amount: number;
  paymentDate: string;
  endDate: string;
  startDate: string;
  status: string;
  isPromotional?: boolean;
  daysRemaining?: number;
}

const normalizePaymentDates = (payment: any) => {
  const startDate =
    payment?.startDate ||
    payment?.validity?.startDate ||
    payment?.validityStartDate ||
    null;

  const endDate =
    payment?.endDate ||
    payment?.validity?.endDate ||
    payment?.validityEndDate ||
    null;

  return { startDate, endDate };
};

export const useSubscription = (page = 1, limit = 10) => {
  const { userId, loading: userIdLoading, error: userIdError } = useUserId();
  const { refreshTick, refresh } = useRefreshSignal();

  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [latestSubscription, setLatestSubscription] =
    useState<SubscriptionPayment | null>(null);
  const [currentSubscription, setCurrentSubscription] =
    useState<CurrentSubscription | null>(null);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError("");

        const res = await API.get(
          `/api/subscription-payment/history/${userId}`,
          {
            withCredentials: true,
            params: {
              page,
              limit,
              sort: "-paymentDate",
            },
          },
        );

        if (!res.data?.success) {
          setPayments([]);
          setLatestSubscription(null);
          setCurrentSubscription(null);
          setTotal(0);
          setTotalPages(1);
          setError("No subscription data found.");
          return;
        }

        const formattedPayments: SubscriptionPayment[] = (
          res.data.payments || []
        ).map((payment: any) => {
          const { startDate, endDate } = normalizePaymentDates(payment);

          return {
            _id: payment._id || payment.paymentId || payment.subscriptionId,
            subscriptionId: payment.subscriptionId,
            invoiceId: payment.invoiceId,
            planName: payment.planName,
            amount: Number(payment.amount || 0),
            currency: payment.currency || "INR",
            type: payment.type || "subscription",
            startDate: startDate || payment.paymentDate,
            endDate: endDate || payment.paymentDate,
            paymentDate: payment.paymentDate,
            transactionId: payment.transactionId,
            orderId: payment.orderId,
            paymentMethod: payment.paymentMethod,
            paymentStatus: payment.paymentStatus,
            requiresPurchase: payment.requiresPurchase,
          };
        });

        setPayments(formattedPayments);

        setTotal(res.data.total || formattedPayments.length);
        setTotalPages(res.data.totalPages || 1);

        if (formattedPayments.length > 0) {
          const sorted = [...formattedPayments].sort(
            (a, b) =>
              new Date(b.paymentDate).getTime() -
              new Date(a.paymentDate).getTime(),
          );
          setLatestSubscription(sorted[0]);
        } else {
          setLatestSubscription(null);
        }

        try {
          const currentRes = await API.get(`/api/subscriptions/me`, {
            withCredentials: true,
          });

          const subscription = currentRes.data?.subscription;
          const paymentHistory = currentRes.data?.paymentHistory || [];
          const latestCurrentPayment = Array.isArray(paymentHistory)
            ? paymentHistory[0]
            : null;

          if (subscription) {
            setCurrentSubscription({
              planName:
                subscription?.plan_id?.name ||
                subscription?.plan_type ||
                latestCurrentPayment?.plan_id?.name ||
                "Unknown",
              planType:
                subscription?.plan_type ||
                subscription?.plan_id?.plan_type ||
                "Free",
              amount: Number(latestCurrentPayment?.amount || 0),
              paymentDate:
                latestCurrentPayment?.payment_date || subscription.start_date,
              startDate: subscription.start_date,
              endDate: subscription.end_date,
              status: subscription.status || "active",
              isPromotional: subscription.is_promotional || false,
              daysRemaining: Number(subscription.daysRemaining || 0),
            });
          } else {
            setCurrentSubscription(null);
          }
        } catch {
          setCurrentSubscription(null);
        }
      } catch (err: any) {
        console.error("Subscription history error:", err);
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to fetch subscription data.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [userId, page, limit, refreshTick]);

  const isActive = (endDate: string) => {
    return new Date(endDate).getTime() > new Date().getTime();
  };

  return {
    payments,
    latestSubscription,
    currentSubscription,
    total,
    totalPages,
    currentPage: page,
    limit,
    loading: loading || userIdLoading,
    error: error || userIdError || "",
    userId,
    isActive,
    refresh,
  };
};
