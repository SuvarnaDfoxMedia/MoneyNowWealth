// // hooks/useSubscription.ts
// import { useState, useEffect } from "react";
// import { API } from "@/app/api/axios";
// import { useUserId } from "./useUserId";

// export interface SubscriptionPayment {
//   _id: string;
//   subscriptionId: string;
//   planName: string;
//   amount: number;
//   currency: string;
//   type: string;
//   trialType?: string;
//   status?: string;
//   startDate: string;
//   endDate: string;
//   paymentDate: string;
//   transactionId?: string;
//   orderId?: string;
//   paymentMethod?: string;
//   paymentStatus?: string;
//   requiresPurchase?: boolean;
// }

// export const useSubscription = () => {
//   const { userId, loading: userIdLoading, error: userIdError } = useUserId();
//   const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
//   const [latestSubscription, setLatestSubscription] =
//     useState<SubscriptionPayment | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>("");

//   useEffect(() => {
//     const fetchSubscriptionData = async () => {
//       if (!userId) return;

//       try {
//         setLoading(true);
//         const res = await API.get(
//           `/api/subscription-payment/history/${userId}`,
//           { withCredentials: true },
//         );

//         if (res.data.success) {
//           const formattedPayments = res.data.payments.map((payment: any) => ({
//             _id: payment._id || payment.paymentId || payment.subscriptionId,
//             subscriptionId: payment.subscriptionId,
//             planName: payment.planName,
//             amount: payment.amount,
//             currency: payment.currency,
//             type: payment.type,
//             trialType: payment.trialType,
//             status: payment.status,
//             startDate: payment.startDate,
//             endDate: payment.endDate,
//             paymentDate: payment.paymentDate,
//             transactionId: payment.transactionId,
//             orderId: payment.orderId,
//             paymentMethod: payment.paymentMethod,
//             paymentStatus: payment.paymentStatus,
//             requiresPurchase: payment.requiresPurchase,
//           }));

//           setPayments(formattedPayments);

//           // Set the latest subscription (most recent by payment date)
//           if (formattedPayments && formattedPayments.length > 0) {
//             const sorted = [...formattedPayments].sort(
//               (a, b) =>
//                 new Date(b.paymentDate).getTime() -
//                 new Date(a.paymentDate).getTime(),
//             );
//             setLatestSubscription(sorted[0]);
//           }
//         } else {
//           setError("No subscription data found.");
//         }
//       } catch (err: any) {
//         setError(err.message || "Failed to fetch subscription data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSubscriptionData();
//   }, [userId]);

//   const isActive = (endDate: string) => {
//     return new Date(endDate) > new Date();
//   };

//   return {
//     payments,
//     latestSubscription,
//     loading: loading || userIdLoading,
//     error: error || userIdError,
//     userId,
//     isActive,
//   };
// };

// // hooks/useSubscription.ts
// import { useState, useEffect } from "react";
// import { API } from "@/app/api/axios";
// import { useUserId } from "./useUserId";

// export interface SubscriptionPayment {
//   _id: string;
//   subscriptionId: string;
//   planName: string;
//   amount: number;
//   currency: string;
//   type: string;
//   trialType?: string;
//   status?: string;
//   startDate: string;
//   endDate: string;
//   paymentDate: string;
//   transactionId?: string;
//   orderId?: string;
//   paymentMethod?: string;
//   paymentStatus?: string;
//   requiresPurchase?: boolean;
// }

// export const useSubscription = (page = 1, limit = 10) => {
//   const { userId, loading: userIdLoading, error: userIdError } = useUserId();
//   const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
//   const [latestSubscription, setLatestSubscription] =
//     useState<SubscriptionPayment | null>(null);
//   const [total, setTotal] = useState(0);
//   const [totalPages, setTotalPages] = useState(1);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>("");

//   useEffect(() => {
//     const fetchSubscriptionData = async () => {
//       if (!userId) return;

//       try {
//         setLoading(true);
//         const res = await API.get(
//           `/api/subscription-payment/history/${userId}`,
//           {
//             withCredentials: true,
//             params: {
//               page,
//               limit,
//               sort: "-paymentDate",
//             },
//           },
//         );

//         if (res.data.success) {
//           const formattedPayments = res.data.payments.map((payment: any) => ({
//             _id: payment._id || payment.paymentId || payment.subscriptionId,
//             subscriptionId: payment.subscriptionId,
//             planName: payment.planName,
//             amount: payment.amount,
//             currency: payment.currency,
//             type: payment.type,
//             trialType: payment.trialType,
//             status: payment.status,
//             startDate: payment.startDate,
//             endDate: payment.endDate,
//             paymentDate: payment.paymentDate,
//             transactionId: payment.transactionId,
//             orderId: payment.orderId,
//             paymentMethod: payment.paymentMethod,
//             paymentStatus: payment.paymentStatus,
//             requiresPurchase: payment.requiresPurchase,
//           }));

//           setPayments(formattedPayments);

//           // Set pagination totals from API response
//           setTotal(res.data.total || formattedPayments.length);
//           setTotalPages(res.data.totalPages || 1);

//           // Set the latest subscription (most recent by payment date)
//           if (formattedPayments && formattedPayments.length > 0) {
//             const sorted = [...formattedPayments].sort(
//               (a, b) =>
//                 new Date(b.paymentDate).getTime() -
//                 new Date(a.paymentDate).getTime(),
//             );
//             setLatestSubscription(sorted[0]);
//           }
//         } else {
//           setError("No subscription data found.");
//         }
//       } catch (err: any) {
//         setError(err.message || "Failed to fetch subscription data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSubscriptionData();
//   }, [userId, page, limit]); // Add page and limit as dependencies

//   const isActive = (endDate: string) => {
//     return new Date(endDate) > new Date();
//   };

//   return {
//     payments,
//     latestSubscription,
//     total,
//     totalPages,
//     currentPage: page,
//     limit,
//     loading: loading || userIdLoading,
//     error: error || userIdError,
//     userId,
//     isActive,
//   };
// };

import { useState, useEffect } from "react";
import { API } from "@/app/api/axios";
import { useUserId } from "./useUserId";

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

  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [latestSubscription, setLatestSubscription] =
    useState<SubscriptionPayment | null>(null);

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
  }, [userId, page, limit]);

  const isActive = (endDate: string) => {
    return new Date(endDate).getTime() > new Date().getTime();
  };

  return {
    payments,
    latestSubscription,
    total,
    totalPages,
    currentPage: page,
    limit,
    loading: loading || userIdLoading,
    error: error || userIdError || "",
    userId,
    isActive,
  };
};
