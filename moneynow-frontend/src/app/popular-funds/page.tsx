"use client";

import React from "react";
import { usePopularFunds } from "@/hooks/usePopularFunds";

const formatReturn = (value?: number | null) =>
  value === null || value === undefined ? "-" : `${value}`;
const formatAmount = (value?: number | null) =>
  value === null || value === undefined ? "-" : `Rs ${Number(value).toLocaleString("en-IN")}`;
const getTrailingReturn = (
  fund: {
    returns?: {
      trailing?: Record<string, number | null>;
      y3_cagr?: number | null;
      y5_cagr?: number | null;
      y10_cagr?: number | null;
    };
  },
  key: "3y" | "5y" | "10y",
  legacyKey: "y3_cagr" | "y5_cagr" | "y10_cagr",
) => fund.returns?.trailing?.[key] ?? fund.returns?.[legacyKey];

export default function PopularFundsPage() {
  const { popularFunds, loading, error } = usePopularFunds({ limit: 20 });

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans text-[#1e293b] min-h-screen bg-white">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Popular Mutual Funds</h1>
        <p className="text-gray-500 max-w-3xl mx-auto leading-relaxed text-[15px]">
          Explore investor-favorite funds curated for consistency and performance.
        </p>
      </div>

      <div className="border border-[#E4E4E4] rounded-lg overflow-hidden bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px] table-fixed">
          <thead>
            <tr className="bg-[#F1F3F5] text-[#495057] text-[13px] font-bold">
              <th className="px-5 py-2 border-r border-[#E4E4E4] text-center w-[130px]">Scheme Code</th>
              <th className="px-5 py-2 border-r border-[#E4E4E4] w-auto">Fund Name</th>
              <th className="px-5 py-2 border-r border-[#E4E4E4] text-center w-[120px]">AMC</th>
              <th className="px-5 py-2 border-r border-[#E4E4E4] text-center w-[150px]">Category</th>
              <th className="px-5 py-2 border-r border-[#E4E4E4] text-center w-[150px]">Min SIP</th>
              <th className="px-5 py-2 border-r border-[#E4E4E4] text-center w-[120px]">3Y CAGR</th>
              <th className="px-5 py-2 border-r border-[#E4E4E4] text-center w-[120px]">5Y CAGR</th>
              <th className="px-5 py-2 text-center w-[120px]">10Y CAGR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E4]">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-gray-400 animate-pulse">
                  Loading popular funds...
                </td>
              </tr>
            ) : popularFunds.length > 0 ? (
              popularFunds.map((fund, idx) => (
                <tr key={`${fund._id}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-2 text-[13px] text-center text-[#495057] border-r border-[#E4E4E4]">
                    {fund.scheme_code || "-"}
                  </td>
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
                    {formatAmount(fund.min_sip_investment ?? fund.min_investment)}
                  </td>
                  <td className="px-5 py-2 text-[13px] text-center text-[#495057] border-r border-[#E4E4E4]">
                    {formatReturn(getTrailingReturn(fund, "3y", "y3_cagr"))}
                  </td>
                  <td className="px-5 py-2 text-[13px] text-center text-[#495057] border-r border-[#E4E4E4]">
                    {formatReturn(getTrailingReturn(fund, "5y", "y5_cagr"))}
                  </td>
                  <td className="px-5 py-2 text-[13px] text-center text-[#495057]">
                    {formatReturn(getTrailingReturn(fund, "10y", "y10_cagr"))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-400 font-medium">
                  {error ? error : "No popular funds available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
