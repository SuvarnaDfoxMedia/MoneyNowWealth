"use client";

import React from "react";
import { useNfoFunds } from "@/hooks/useNfoFunds";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

export default function NfoPage() {
  const { nfos, loading, error } = useNfoFunds({ isOpen: true, limit: 20 });

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans text-[#1e293b] min-h-screen bg-white">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">New Fund Offers (NFO)</h1>
        <p className="text-gray-500 max-w-3xl mx-auto leading-relaxed text-[15px]">
          Track open NFOs and upcoming fund launches in one place.
        </p>
      </div>

      <div className="border border-[#E4E4E4] rounded-lg overflow-hidden bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px] table-fixed">
          <thead>
            <tr className="bg-[#F1F3F5] text-[#495057] text-[13px] font-bold">
              <th className="px-5 py-2 border-r border-[#E4E4E4] w-auto">Fund Name</th>
              <th className="px-5 py-2 border-r border-[#E4E4E4] text-center w-[160px]">AMC</th>
              <th className="px-5 py-2 border-r border-[#E4E4E4] text-center w-[160px]">Category</th>
              <th className="px-5 py-2 border-r border-[#E4E4E4] text-center w-[140px]">Open Date</th>
              <th className="px-5 py-2 text-center w-[140px]">Close Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E4]">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-gray-400 animate-pulse">
                  Loading NFOs...
                </td>
              </tr>
            ) : nfos.length > 0 ? (
              nfos.map((fund, idx) => (
                <tr key={`${fund._id}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-2 text-[13px] text-[#495057] border-r border-[#E4E4E4] font-medium truncate">
                    {fund.fund_name}
                  </td>
                  <td className="px-5 py-2 text-[13px] text-center text-[#495057] border-r border-[#E4E4E4]">
                    {fund.amc_id?.name || "-"}
                  </td>
                  <td className="px-5 py-2 text-[13px] text-center text-[#495057] border-r border-[#E4E4E4]">
                    {fund.category_id?.name || "-"}
                  </td>
                  <td className="px-5 py-2 text-[13px] text-center text-[#495057] border-r border-[#E4E4E4]">
                    {formatDate(fund.subscription_start_date)}
                  </td>
                  <td className="px-5 py-2 text-[13px] text-center text-[#495057]">
                    {formatDate(fund.subscription_end_date)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400 font-medium">
                  {error ? error : "No open NFOs available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
