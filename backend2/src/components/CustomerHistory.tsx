// "use client";

// import React from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { FiArrowLeft, FiFileText } from "react-icons/fi";
// import useCommonCrud from "../hooks/useCommonCrud"; // adjust path

// /* -------------------------------
//    Interfaces
// -------------------------------- */
// interface PaymentHistoryItem {
//   subscriptionId: string;
//   planName: string;
//   amount: number;
//   currency: string;
//   type: "new" | "upgrade" | "downgrade";
//   trialType?: string;
//   status?: string;
//   startDate: string;
//   endDate: string;
//   paymentDate: string;
//   transactionId?: string;
//   orderId?: string;
//   paymentId?: string; // for invoice
// }

// /* -------------------------------
//    Customer History Page
// -------------------------------- */
// export default function CustomerHistoryPage() {
//   const { subscriptionId } = useParams<{ subscriptionId: string }>();
//   const navigate = useNavigate();

//   const { extractList: payments = [], isLoading } = useCommonCrud<PaymentHistoryItem>({
//     module: subscriptionId
//       ? `subscription-payment/history/${subscriptionId}`
//       : "", // empty string if undefined
//     listKey: "payments",
//     enabled: !!subscriptionId, // only fetch if subscriptionId exists
//   });

//   return (
//     <div className="w-full p-4">
//       {/* BACK BUTTON */}
//       <div className="w-full flex justify-end mb-4">
//         <button
//           onClick={() => navigate(-1)}
//           className="bg-[#043f79] text-white px-4 py-2 rounded-md shadow hover:bg-[#064d99] transition flex items-center gap-2"
//         >
//           <FiArrowLeft size={18} /> Back
//         </button>
//       </div>

//       {/* PAYMENTS TABLE */}
//       <div className="w-full overflow-x-auto bg-white shadow-2xl rounded-lg border border-gray-200">
//         <table className="w-full text-left border-collapse">
//           <thead className="bg-gray-50 border-b">
//             <tr className="text-gray-600 text-sm">
//               <th className="p-4">Plan</th>
//               <th className="p-4">Type</th>
//               <th className="p-4">Amount</th>
//               <th className="p-4">Currency</th>
//               <th className="p-4">Status</th>
//               <th className="p-4">Trial Type</th>
//               <th className="p-4">Start Date</th>
//               <th className="p-4">End Date</th>
//               <th className="p-4">Payment Date</th>
//               <th className="p-4">Transaction ID</th>
//               <th className="p-4">Order ID</th>
//               <th className="p-4">Invoice</th>
//             </tr>
//           </thead>
//           <tbody>
//             {isLoading ? (
//               <tr>
//                 <td colSpan={12} className="p-4 text-center text-gray-500">
//                   Loading subscription history...
//                 </td>
//               </tr>
//             ) : payments.length > 0 ? (
//               payments.map((p) => (
//                 <tr key={p.subscriptionId} className="border-b text-gray-700 text-sm">
//                   <td className="p-4">{p.planName}</td>
//                   <td className="p-4 capitalize">{p.type}</td>
//                   <td className="p-4">{p.amount}</td>
//                   <td className="p-4">{p.currency}</td>
//                   <td className="p-4">{p.status || "—"}</td>
//                   <td className="p-4">{p.trialType || "—"}</td>
//                   <td className="p-4">{new Date(p.startDate).toLocaleDateString()}</td>
//                   <td className="p-4">{new Date(p.endDate).toLocaleDateString()}</td>
//                   <td className="p-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
//                   <td className="p-4">{p.transactionId || "—"}</td>
//                   <td className="p-4">{p.orderId || "—"}</td>
//                   <td className="p-4">
//                     {p.paymentId ? (
//                       <button
//                         onClick={() => navigate(`/invoice/${p.paymentId}`)}
//                         className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
//                       >
//                         <FiFileText size={16} /> View
//                       </button>
//                     ) : (
//                       "—"
//                     )}
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan={12} className="p-4 text-center text-gray-500">
//                   No subscription history found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


"use client";

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFileText } from "react-icons/fi";
import useCommonCrud from "../hooks/useCommonCrud"; // adjust path if needed

/* -------------------------------
   Interfaces
-------------------------------- */
interface PaymentHistoryItem {
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
  paymentId?: string; // for invoice
}

/* -------------------------------
   Customer History Page
-------------------------------- */
export default function CustomerHistoryPage() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const navigate = useNavigate();

  // ✅ Use updated hook with enabled
  const { extractList: payments = [], isLoading } = useCommonCrud<PaymentHistoryItem>({
    module: subscriptionId
      ? `subscription-payment/history/${subscriptionId}`
      : "", // empty string if undefined
    listKey: "payments",
    enabled: !!subscriptionId, // only fetch if subscriptionId exists
  });

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

      {/* PAYMENTS TABLE */}
      <div className="w-full overflow-x-auto bg-white shadow-2xl rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-600 text-sm">
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
              <th className="p-4">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={12} className="p-4 text-center text-gray-500">
                  Loading subscription history...
                </td>
              </tr>
            ) : payments.length > 0 ? (
              payments.map((p) => (
                <tr key={p.subscriptionId} className="border-b text-gray-700 text-sm">
                  <td className="p-4">{p.planName}</td>
                  <td className="p-4 capitalize">{p.type}</td>
                  <td className="p-4">{p.amount}</td>
                  <td className="p-4">{p.currency}</td>
                  <td className="p-4">{p.status || "—"}</td>
                  <td className="p-4">{p.trialType || "—"}</td>
                  <td className="p-4">{new Date(p.startDate).toLocaleDateString()}</td>
                  <td className="p-4">{new Date(p.endDate).toLocaleDateString()}</td>
                  <td className="p-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="p-4">{p.transactionId || "—"}</td>
                  <td className="p-4">{p.orderId || "—"}</td>
                  <td className="p-4">
                    {p.paymentId ? (
                      <button
                        onClick={() => navigate(`/invoice/${p.paymentId}`)}
                        className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        <FiFileText size={16} /> View
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={12} className="p-4 text-center text-gray-500">
                  No subscription history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
