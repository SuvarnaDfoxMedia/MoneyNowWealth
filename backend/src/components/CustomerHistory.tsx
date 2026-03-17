// components/CustomerHistory.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import usePaymentHistory from "../hooks/usePaymentHistory";

/* -------------------------------
   Customer History Page
-------------------------------- */
export default function CustomerHistoryPage() {
  const { id } = useParams<{ id: string; role: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = usePaymentHistory(id);

  const payments = data?.payments || [];
  const totalPayments = data?.total || 0;

  return (
    <div className="w-full p-4">
      {/* BACK BUTTON */}
      <div className="w-full flex justify-end mb-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-[#043f79] text-white px-4 py-2 rounded-md shadow hover:bg-[#064d99] transition flex items-center gap-2"
        >
          <FiArrowLeft size={18} /> Back
        </button>
      </div>

      {/* HEADER WITH USER INFO */}
      <div className="mb-6 bg-gray-50 rounded-lg ">
        <h1 className="text-[22px] font-semibold text-gray-800">
          Payment History
        </h1>
        {/* make ui to show user name future reference */}
      </div>

      {/* PAYMENTS TABLE */}
      <div className="w-full overflow-x-auto bg-white  rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-600 text-sm">
              <th className="p-4">#</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Type</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Currency</th>
              <th className="p-4">Status</th>
              <th className="p-4">Trial Type</th>
              <th className="p-4">Start Date</th>
              <th className="p-4">End Date</th>
              <th className="p-4">Payment Date</th>
              <th className="p-4">Transaction ID</th>
              <th className="p-4">Order ID</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={13} className="p-4 text-center text-gray-500">
                  Loading payment history...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={13} className="p-4 text-center text-red-500">
                  Error loading payment history. Please try again.
                </td>
              </tr>
            ) : payments.length > 0 ? (
              payments.map((p, index) => (
                <tr
                  key={p.paymentId || p.subscriptionId || index}
                  className="border-b text-gray-700 text-sm"
                >
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4">{p.planName}</td>
                  <td className="p-4 capitalize">{p.type}</td>
                  <td className="p-4">{p.amount}</td>
                  <td className="p-4">{p.currency}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        p.status === "new"
                          ? "bg-blue-100 text-blue-800"
                          : p.status === "upgrade"
                            ? "bg-green-100 text-green-800"
                            : p.status === "downgrade"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {p.status || "—"}
                    </span>
                  </td>
                  <td className="p-4">{p.trialType || "—"}</td>
                  <td className="p-4">
                    {p.startDate
                      ? new Date(p.startDate).toLocaleDateString("en-GB")
                      : "—"}
                  </td>
                  <td className="p-4">
                    {p.endDate ? new Date(p.endDate).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="p-4">
                    {p.paymentDate
                      ? new Date(p.paymentDate).toLocaleDateString("en-GB")
                      : "—"}
                  </td>
                  <td className="p-4 font-mono text-xs">
                    {p.transactionId || "—"}
                  </td>
                  <td className="p-4 font-mono text-xs">{p.orderId || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={13} className="p-4 text-center text-gray-500">
                  No payment history found for this user.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SUMMARY FOOTER */}
      {payments.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{payments.length}</span>{" "}
                of <span className="font-semibold">{totalPayments}</span>{" "}
                payments
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Total Amount:{" "}
                <span className="font-semibold">
                  {payments[0]?.currency}{" "}
                  {payments.reduce((sum, p) => sum + p.amount, 0)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

