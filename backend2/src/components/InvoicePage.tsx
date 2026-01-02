


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";

/* -------------------------------
   Interfaces
-------------------------------- */
interface SubscriptionPlan {
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: { value: number; unit: string };
  features?: string[];
}

interface UserSubscription {
  _id: string;
  user_id: any;
  plan_id: any;
  start_date: string;
  end_date: string;
  status: string;
  auto_renew: boolean;
}

interface SubscriptionPayment {
  _id: string;
  user_id: any;
  plan_id: any;
  user_subscription_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  order_id: string;
  payment_status: string;
  payment_date: string;
  type: string;
}

/* This is the REAL response shape */
interface InvoiceApiResponse {
  subscription: UserSubscription;
  payment?: SubscriptionPayment;
}

interface InvoiceData {
  subscription: UserSubscription;
  plan?: SubscriptionPlan | null;
  payment?: SubscriptionPayment | null;
  user_name?: string | null;
}

/* -------------------------------
   Invoice Page Component
-------------------------------- */
export default function InvoicePage() {
  const { id, role } = useParams();
  const navigate = useNavigate();

  const { getOne } = useCommonCrud({
    role: role || "admin",
    module: "subscriptions",
  });

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------------
      Fetch Invoice Data
  -------------------------------- */
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // Safe TypeScript cast through 'unknown'
        const rawRes = await getOne(id!);
        const res = rawRes as unknown as InvoiceApiResponse | null;

        if (!res?.subscription) {
          toast.error("Invoice data not found.");
          setLoading(false);
          return;
        }

        const subscription = res.subscription;
        const payment = res.payment;

        const user_name =
          subscription?.user_id?.firstname
            ? `${subscription.user_id.firstname} ${subscription.user_id.lastname}`
            : "Unknown User";

        const plan: SubscriptionPlan | null =
          payment?.plan_id || subscription?.plan_id || null;

        setInvoice({ subscription, payment, user_name, plan });
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch invoice.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id]);

  /* -------------------------------
      Loading / Not Found
  -------------------------------- */
  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500 text-lg">
        Loading Invoice...
      </div>
    );

  if (!invoice)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500 text-lg">
        Invoice not found.
      </div>
    );

  const { subscription, plan, payment, user_name } = invoice;

  const displayStatus =
    payment?.payment_status?.toUpperCase() ||
    subscription?.status?.toUpperCase() ||
    "N/A";

  /* -------------------------------
      Actual Invoice UI
  -------------------------------- */
  return (
    <div className="w-full">
      {/* BACK BUTTON */}
      <div className="w-full flex justify-end mx-auto mb-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-[#043f79] text-white px-4 py-2 rounded-md shadow hover:bg-[#064d99] transition flex items-center gap-2"
        >
          <FiArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="w-full mx-auto bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200">
        {/* HEADER */}
        <div className="p-8 border-b bg-[#edf1f5] flex justify-between items-center">
          <img
            className="dark:hidden"
            src="/images/logo/logo.png"
            alt="Logo"
            width={150}
          />
          <div className="text-right">
            <p className="text-xl font-semibold tracking-wide">INVOICE</p>
            <p className="text-sm mt-1 opacity-90">
              {payment?.payment_date
                ? new Date(payment.payment_date).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>

        {/* BILL TO */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-gray-800 font-semibold mb-2 text-sm uppercase tracking-wide">
              Billed To
            </h3>
            <p className="text-gray-700 text-lg">{user_name}</p>
          </div>

          {/* Invoice Details */}
          <div>
            <h3 className="text-gray-800 font-semibold mb-2 text-sm uppercase tracking-wide">
              Invoice Details
            </h3>
            <div className="space-y-1 text-gray-700">
              <p>
                <span className="font-medium">Invoice ID:</span>{" "}
                {subscription?._id}
              </p>
              <p>
                <span className="font-medium">Transaction ID:</span>{" "}
                {payment?.transaction_id || "N/A"}
              </p>
              <p>
                <span className="font-medium">Order ID:</span>{" "}
                {payment?.order_id || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION SUMMARY */}
        <div className="px-8 pb-8">
          <h3 className="text-gray-800 text-lg font-semibold mb-4">
            Subscription Summary
          </h3>

          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr className="text-sm text-gray-600">
                  <th className="p-4">Plan</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-b text-gray-700">
                  <td className="p-4">{plan?.name || "—"}</td>
                  <td className="p-4">
                    {plan?.duration?.value} {plan?.duration?.unit}
                  </td>
                  <td className="p-4">
                    {plan?.currency} {plan?.price}
                  </td>
                  <td className="p-4 font-semibold">{displayStatus}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DATES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-5 bg-gray-50 border rounded-xl shadow-sm">
              <p className="text-sm text-gray-500 uppercase font-semibold mb-1">
                Subscription Start
              </p>
              <p className="text-gray-700 text-lg">
                {new Date(subscription.start_date).toLocaleDateString()}
              </p>
            </div>

            <div className="p-5 bg-gray-50 border rounded-xl shadow-sm">
              <p className="text-sm text-gray-500 uppercase font-semibold mb-1">
                Subscription End
              </p>
              <p className="text-gray-700 text-lg">
                {new Date(subscription.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* PAYMENT DETAILS */}
          <div className="mt-10">
            <h3 className="text-gray-800 text-lg font-semibold mb-3">
              Payment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <p>
                <span className="font-medium">Payment Method:</span>{" "}
                {payment?.payment_method || "N/A"}
              </p>
              <p>
                <span className="font-medium">Amount Paid:</span>{" "}
                {payment?.currency} {payment?.amount}
              </p>
              <p>
                <span className="font-medium">Type:</span>{" "}
                {payment?.type || "N/A"}
              </p>
              <p>
                <span className="font-medium">Auto Renew:</span>{" "}
                {subscription?.auto_renew ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-14 text-center text-gray-600 text-sm border-t pt-6">
            Thank you for choosing{" "}
            <span className="font-semibold">MoneyNow Wealth</span>.
            <br />
            For support, contact us at{" "}
            <span className="font-medium">moneynowwealth@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
