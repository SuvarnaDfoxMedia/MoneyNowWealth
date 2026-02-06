// "use client";

// import React, { useState, useEffect } from "react";
// import { FiEye } from "react-icons/fi";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useSubscription } from "@/hooks/useSubscription";
// import { usePagination } from "@/hooks/usePagination";
// import { Pagination } from "@/components/Pagination";

// const SubscriptionsListing = () => {
//   const router = useRouter();

//   // Initialize pagination
//   const pagination = usePagination({
//     initialPage: 1,
//     initialLimit: 10,
//   });

//   // Fetch subscriptions with pagination
//   const {
//     payments,
//     latestSubscription,
//     loading,
//     error,
//     total,
//     totalPages: apiTotalPages,
//   } = useSubscription(pagination.page, pagination.limit);

//   // Sync pagination with API response
//   useEffect(() => {
//     if (total > 0) {
//       pagination.setTotalItems(total);
//     }
//   }, [total]);

//   // Calculate starting index for current page
//   const startingIndex = (pagination.page - 1) * pagination.limit;

//   return (
//     <div className="w-full min-h-screen p-2 bg-gray-50">
//       {/* Heading */}
//       <h1 className="text-lg font-semibold mb-6 flex items-center gap-2">
//         <div className="w-6 h-6 relative">
//           <Image
//             src="/images/before-check-icon.png"
//             alt="Check Icon"
//             fill
//             className="object-contain"
//             priority
//           />
//         </div>
//         Subscriptions
//         {total > 0 && (
//           <span className="text-sm font-normal text-gray-500 ml-2">
//             ({total} total invoices)
//           </span>
//         )}
//       </h1>

//       {/* Layout */}
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
//         {/* LEFT: INVOICES (reduced width) */}
//         <div className="lg:col-span-8">
//           <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 w-full">
//             {/* Header with page size selector */}
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
//               <h2 className="text-md font-semibold">Invoices</h2>

//               {/* Page size selector */}
//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-gray-600">Show:</span>
//                 <select
//                   value={pagination.limit}
//                   onChange={(e) => {
//                     pagination.setLimit(Number(e.target.value));
//                     pagination.goToFirst();
//                   }}
//                   className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#043F79] focus:border-[#043F79]"
//                 >
//                   <option value="5">5 per page</option>
//                   <option value="10">10 per page</option>
//                   <option value="20">20 per page</option>
//                   <option value="50">50 per page</option>
//                 </select>
//               </div>
//             </div>

//             {/* Table Header */}
//             <div className="grid grid-cols-6 text-sm text-gray-500 px-4 mb-2">
//               <span>#</span>
//               <span>Plan Name</span>
//               <span>Start Date</span>
//               <span>End Date</span>
//               <span>Amount</span>
//               <span className="text-right">Action</span>
//             </div>

//             {/* Loading / Error / Empty */}
//             {loading ? (
//               <p className="text-center py-6 text-gray-500">Loading...</p>
//             ) : error ? (
//               <p className="text-center py-6 text-red-500">{error}</p>
//             ) : payments.length === 0 ? (
//               <p className="text-center py-6 text-gray-500">
//                 No invoices found.
//               </p>
//             ) : (
//               <>
//                 {/* Rows */}
//                 <div className="space-y-3">
//                   {payments.map((inv, index) => (
//                     <div
//                       key={`${inv._id}-${index}`}
//                       className="grid grid-cols-6 items-center border border-gray-200 rounded-xl px-4 py-3 bg-white hover:bg-gray-50 transition"
//                     >
//                       <span className="text-sm">
//                         {startingIndex + index + 1}
//                       </span>
//                       <span className="text-sm font-medium">
//                         {inv.planName}
//                       </span>
//                       <span className="text-sm">
//                         {new Date(inv.startDate).toLocaleDateString("en-IN")}
//                       </span>
//                       <span className="text-sm">
//                         {new Date(inv.endDate).toLocaleDateString("en-IN")}
//                       </span>
//                       <span className="text-sm font-semibold">
//                         ₹{inv.amount.toFixed(2)}
//                       </span>
//                       <div className="flex justify-end">
//                         <button
//                           className="text-gray-600 hover:text-gray-900"
//                           onClick={() => router.push(`/invoice/${inv._id}`)}
//                         >
//                           <FiEye size={18} />
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {/*  USING REUSABLE PAGINATION COMPONENT */}
//                 {total > 0 && (
//                   <div className="mt-6 pt-6">
//                     <Pagination
//                       currentPage={pagination.page}
//                       totalPages={pagination.totalPages}
//                       onPageChange={pagination.setPage}
//                       showPageNumbers={true}
//                       showBoundaryButtons={true}
//                     />
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>

//         {/* RIGHT: LATEST SUBSCRIPTION (slightly bigger + attractive) */}
//         {latestSubscription && (
//           <div className="lg:col-span-4">
//             <div className="w-full bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center sticky top-4">
//               <div className="mb-4 w-20 h-20 relative">
//                 <Image
//                   src="/images/subscribe-right-icon.png"
//                   alt="Premium Plan"
//                   fill
//                   className="object-contain"
//                   priority
//                 />
//               </div>

//               <h3 className="font-semibold text-lg mb-4">
//                 Latest Subscription
//               </h3>

//               <div className="w-full flex flex-col text-left text-sm bg-gray-50 rounded-xl p-4 border border-gray-100">
//                 <p className="mb-2 flex gap-3">
//                   <span className="font-semibold">Plan:</span>
//                   <span className="font-normal">
//                     {latestSubscription.planName}
//                   </span>
//                 </p>

//                 <p className="mb-2 flex gap-3">
//                   <span className="font-semibold">Amount:</span>
//                   <span className="font-normal">
//                     ₹{latestSubscription.amount.toFixed(2)}
//                   </span>
//                 </p>

//                 <p className="mb-2 flex gap-3">
//                   <span className="font-semibold">Purchase Date:</span>
//                   <span className="font-normal">
//                     {new Date(
//                       latestSubscription.paymentDate,
//                     ).toLocaleDateString("en-IN")}
//                   </span>
//                 </p>

//                 <p className="flex gap-3">
//                   <span className="font-semibold">Expiry Date:</span>
//                   <span className="font-normal">
//                     {new Date(latestSubscription.endDate).toLocaleDateString(
//                       "en-IN",
//                     )}
//                   </span>
//                 </p>
//               </div>

//               <button
//                 className={`mt-5 w-20 py-2 rounded-lg font-semibold text-sm tracking-wide ${
//                   new Date(latestSubscription.endDate) > new Date()
//                     ? "bg-green-600 text-white hover:bg-green-700"
//                     : "bg-gray-400 text-white"
//                 }`}
//               >
//                 {new Date(latestSubscription.endDate) > new Date()
//                   ? "ACTIVE"
//                   : "EXPIRED"}
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SubscriptionsListing;

"use client";

import React, { useEffect } from "react";
import { FiEye } from "react-icons/fi";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";

const safeDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-IN");
};

const SubscriptionsListing = () => {
  const router = useRouter();

  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 10,
  });

  const { payments, latestSubscription, loading, error, total, totalPages } =
    useSubscription(pagination.page, pagination.limit);

  useEffect(() => {
    if (total > 0) {
      pagination.setTotalItems(total);
    }
  }, [total]);

  const startingIndex = (pagination.page - 1) * pagination.limit;

  return (
    <div className="w-full min-h-screen p-2 bg-gray-50">
      <h1 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <div className="w-6 h-6 relative">
          <Image
            src="/images/before-check-icon.png"
            alt="Check Icon"
            fill
            className="object-contain"
            priority
          />
        </div>
        Subscriptions
        {total > 0 && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({total} total invoices)
          </span>
        )}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <h2 className="text-md font-semibold">Invoices</h2>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    pagination.setLimit(Number(e.target.value));
                    pagination.goToFirst();
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#043F79] focus:border-[#043F79]"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-6 text-sm text-gray-500 px-4 mb-2">
              <span>#</span>
              <span>Plan Name</span>
              <span>Start Date</span>
              <span>End Date</span>
              <span>Amount</span>
              <span className="text-right">Action</span>
            </div>

            {loading ? (
              <p className="text-center py-6 text-gray-500">Loading...</p>
            ) : error ? (
              <p className="text-center py-6 text-red-500">{error}</p>
            ) : payments.length === 0 ? (
              <p className="text-center py-6 text-gray-500">
                No invoices found.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {payments.map((inv, index) => (
                    <div
                      key={`${inv._id}-${index}`}
                      className="grid grid-cols-6 items-center border border-gray-200 rounded-xl px-4 py-3 bg-white hover:bg-gray-50 transition"
                    >
                      <span className="text-sm">
                        {startingIndex + index + 1}
                      </span>

                      <span className="text-sm font-medium">
                        {inv.planName}
                      </span>

                      <span className="text-sm">{safeDate(inv.startDate)}</span>

                      <span className="text-sm">{safeDate(inv.endDate)}</span>

                      <span className="text-sm font-semibold">
                        ₹{Number(inv.amount || 0).toFixed(2)}
                      </span>

                      <div className="flex justify-end">
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => router.push(`/invoice/${inv._id}`)}
                          title="View Invoice"
                        >
                          <FiEye size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {total > 0 && (
                  <div className="mt-6 pt-6">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages || totalPages}
                      onPageChange={pagination.setPage}
                      showPageNumbers={true}
                      showBoundaryButtons={true}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {latestSubscription && (
          <div className="lg:col-span-4">
            <div className="w-full bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center sticky top-4">
              <div className="mb-4 w-20 h-20 relative">
                <Image
                  src="/images/subscribe-right-icon.png"
                  alt="Premium Plan"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <h3 className="font-semibold text-lg mb-4">
                Latest Subscription
              </h3>

              <div className="w-full flex flex-col text-left text-sm bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="mb-2 flex gap-3">
                  <span className="font-semibold">Plan:</span>
                  <span className="font-normal">
                    {latestSubscription.planName}
                  </span>
                </p>

                <p className="mb-2 flex gap-3">
                  <span className="font-semibold">Amount:</span>
                  <span className="font-normal">
                    ₹{Number(latestSubscription.amount || 0).toFixed(2)}
                  </span>
                </p>

                <p className="mb-2 flex gap-3">
                  <span className="font-semibold">Purchase Date:</span>
                  <span className="font-normal">
                    {safeDate(latestSubscription.paymentDate)}
                  </span>
                </p>

                <p className="flex gap-3">
                  <span className="font-semibold">Expiry Date:</span>
                  <span className="font-normal">
                    {safeDate(latestSubscription.endDate)}
                  </span>
                </p>
              </div>

              <button
                className={`mt-5 w-20 py-2 rounded-lg font-semibold text-sm tracking-wide ${
                  new Date(latestSubscription.endDate) > new Date()
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-400 text-white"
                }`}
              >
                {new Date(latestSubscription.endDate) > new Date()
                  ? "ACTIVE"
                  : "EXPIRED"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsListing;
