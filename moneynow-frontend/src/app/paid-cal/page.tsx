// "use client";

// import React, { useEffect, useState } from "react";

// type FundRow = {
//   fundName: string;
//   oneYear: number;
//   threeYear: number;
//   fiveYear: number;
//   inception: number;
//   rank: string;
// };

// const page = () => {
//   const [data, setData] = useState<FundRow[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchFundData();
//   }, []);

//   const fetchFundData = async () => {
//     try {
//       const response = await fetch(
//         "https://mfapi.advisorkhoj.com/getSchemeInfoLatest" +
//           "?key=42842c3f-57f9-4444-8dc8-953c1183e99b" +
//           "&scheme=HDFC Balanced Advantage Fund - Growth Plan - Direct Plan",
//         {
//           method: "POST",
//         },
//       );

//       const json = await response.json();

//       // First item is always the selected scheme
//       const perf = json?.scheme_performance_list?.[0];
//       if (!perf) return;

//       const row: FundRow = {
//         fundName: "HDFC Balanced Advantage Fund",
//         oneYear: perf.one_year_return,
//         threeYear: perf.three_year_return,
//         fiveYear: perf.five_year_return,
//         inception: perf.inception_year_return,
//         rank: "5 / 33", // static demo (comes from backend later)
//       };

//       setData([row]);
//     } catch (error) {
//       console.error("Failed to fetch mutual fund data", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h1 className="text-2xl font-semibold mb-6">
//         Hybrid : Aggressive — Trailing Returns
//       </h1>

//       {loading ? (
//         <div className="text-gray-500">Loading data...</div>
//       ) : (
//         <div className="overflow-x-auto border rounded-lg">
//           <table className="min-w-full border-collapse">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
//                   Fund Name
//                 </th>
//                 <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
//                   1Y Return (%)
//                 </th>
//                 <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
//                   3Y CAGR (%)
//                 </th>
//                 <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
//                   5Y CAGR (%)
//                 </th>
//                 <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
//                   Since Inception (%)
//                 </th>
//                 <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
//                   Category Rank (1Y)
//                 </th>
//               </tr>
//             </thead>

//             <tbody>
//               {data.map((fund, index) => (
//                 <tr
//                   key={index}
//                   className="border-t hover:bg-gray-50 transition"
//                 >
//                   <td className="px-4 py-3 text-sm text-gray-800">
//                     {fund.fundName}
//                   </td>

//                   <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
//                     {fund.oneYear.toFixed(2)}%
//                   </td>

//                   <td className="px-4 py-3 text-sm text-right">
//                     {fund.threeYear.toFixed(2)}%
//                   </td>

//                   <td className="px-4 py-3 text-sm text-right">
//                     {fund.fiveYear.toFixed(2)}%
//                   </td>

//                   <td className="px-4 py-3 text-sm text-right">
//                     {fund.inception.toFixed(2)}%
//                   </td>

//                   <td className="px-4 py-3 text-sm text-center font-semibold">
//                     {fund.rank}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default page;

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import MFInputs from "@/components/mutualfund/MFInputs";
import MFResults from "@/components/mutualfund/MFResults";
import { useMutualFund } from "@/hooks/useMutualFund";

export default function MutualFundPage() {
  const [scheme, setScheme] = useState(
    "HDFC Balanced Advantage Fund - Growth Plan - Direct Plan",
  );

  const { fetchFund, data, loading } = useMutualFund();
  const debounceRef = useRef<number | null>(null);

  const runFetch = useCallback(() => {
    fetchFund({ scheme });
  }, [scheme, fetchFund]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      runFetch();
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runFetch]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Mutual Fund Performance</h1>

      <MFInputs scheme={scheme} setScheme={setScheme} />
      <MFResults data={data} loading={loading} />
    </section>
  );
}
