"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { mfService } from "@/services/mfService";

export default function FundDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [fund, setFund] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await mfService.getFunds({ fundId: id, limit: 1 });
        const items = Array.isArray(res?.data) ? res.data : res?.data || [];
        setFund(items[0] || null);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  return (
    <div className="max-w-5xl mx-auto p-6 font-sans text-[#1e293b] min-h-screen bg-white">
      {loading ? (
        <div className="py-20 text-center text-gray-400 animate-pulse">
          Loading fund details...
        </div>
      ) : fund ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{fund.fund_name}</h1>
            <p className="text-gray-500 text-[14px]">
              {fund.amc_id?.name || "AMC"} • {fund.category_id?.name || "Category"}
            </p>
          </div>

          <div className="border border-[#E4E4E4] rounded-lg p-5 bg-white shadow-sm">
            <h2 className="text-[16px] font-semibold mb-3">Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] text-[#495057]">
              <div>3Y CAGR: {fund.returns?.y3_cagr ?? "-"}</div>
              <div>5Y CAGR: {fund.returns?.y5_cagr ?? "-"}</div>
              <div>10Y CAGR: {fund.returns?.y10_cagr ?? "-"}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400">Fund not found</div>
      )}
    </div>
  );
}
