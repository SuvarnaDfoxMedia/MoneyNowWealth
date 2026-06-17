"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { mfService } from "@/services/mfService";
import { useRefreshSignal } from "@/hooks/useRefreshSignal";

interface FundDetail {
  scheme_code?: string;
  fund_name: string;
  amc_id?: { name?: string };
  category_id?: { name?: string };
  min_sip_investment?: number | null;
  min_lumpsum_investment?: number | null;
  sip_allowed?: boolean;
  lumpsum_allowed?: boolean;
  riskometer_label?: string;
  nav_Current?: number | null;
  nav_date?: Date | string | null;
  nav_change?: number | null;
  nav_change_percentage?: number | null;
  benchmark_index_name?: string;
  benchmark_returns_trailing?: {
    d1?: number | null;
    m1?: number | null;
    m3?: number | null;
    m6?: number | null;
    y1?: number | null;
    y3?: number | null;
    y5?: number | null;
    y10?: number | null;
  };
  benchmark_returns_annual?: {
    y1?: number | null;
    y3?: number | null;
    y5?: number | null;
    y10?: number | null;
  };
  returns?: {
    trailing?: Record<string, number | null>;
    annual?: { ytd?: number | null; yearly_returns?: Record<string, number | null> };
    d1?: number | null;
    m1?: number | null;
    m3?: number | null;
    m6?: number | null;
    y1?: number | null;
    y3_cagr?: number | null;
    y5_cagr?: number | null;
    y10_cagr?: number | null;
  };
}

const getFundTrailing = (fund: FundDetail | null | undefined, key: string, legacyKey?: string) =>
  fund?.returns?.trailing?.[key] ?? (legacyKey ? (fund?.returns as any)?.[legacyKey] : null);

export default function FundDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [fund, setFund] = useState<FundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshTick } = useRefreshSignal();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await mfService.getFundById(id);
        setFund((res?.data || null) as FundDetail | null);
      } catch {
        setFund(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id, refreshTick]);

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
              {[fund.amc_id?.name || "AMC", fund.category_id?.name || "Category"].join(" | ")}
            </p>
            <p className="text-gray-500 text-[14px] mt-1">
              {[
                fund.scheme_code ? `Scheme Code: ${fund.scheme_code}` : null,
                fund.riskometer_label ? `Riskometer: ${fund.riskometer_label}` : null,
              ]
                .filter(Boolean)
                .join(" | ")}
            </p>
          </div>

          <div className="border border-[#E4E4E4] rounded-lg p-5 bg-white shadow-sm flex items-center gap-4">
            <div>
              <div className="text-gray-500 text-sm">NAV</div>
              <div className="text-2xl font-bold text-[#1e293b]">
                {fund.nav_Current ? `₹${fund.nav_Current.toFixed(4)}` : "N/A"}
              </div>
            </div>
            {fund.nav_change != null && (
              <div className={`mt-4 font-medium ${fund.nav_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {fund.nav_change > 0 ? "+" : ""}
                {fund.nav_change.toFixed(4)} ({fund.nav_change > 0 ? "+" : ""}
                {fund.nav_change_percentage?.toFixed(2)}%)
              </div>
            )}
            <div className="mt-4 text-xs text-gray-400">
              {fund.nav_date ? `As of ${new Date(fund.nav_date).toLocaleDateString()}` : ""}
            </div>
          </div>

          <div className="border border-[#E4E4E4] rounded-lg p-5 bg-white shadow-sm">
            <h2 className="text-[16px] font-semibold mb-3">Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-8 gap-4 text-[13px] text-[#495057]">
              <div>1D Return: {fund.returns?.d1 ?? 0}</div>
              <div>1M Return: {getFundTrailing(fund, "1m", "m1") ?? 0}</div>
              <div>3M Return: {getFundTrailing(fund, "3m", "m3") ?? 0}</div>
              <div>6M Return: {getFundTrailing(fund, "6m", "m6") ?? 0}</div>
              <div>1Y Return: {getFundTrailing(fund, "1y", "y1") ?? "-"}</div>
              <div>3Y CAGR: {getFundTrailing(fund, "3y", "y3_cagr") ?? "-"}</div>
              <div>5Y CAGR: {getFundTrailing(fund, "5y", "y5_cagr") ?? "-"}</div>
              <div>10Y CAGR: {getFundTrailing(fund, "10y", "y10_cagr") ?? "-"}</div>
            </div>
          </div>

          <div className="border border-[#E4E4E4] rounded-lg p-5 bg-white shadow-sm">
            <h2 className="text-[16px] font-semibold mb-3">Minimum Investment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] text-[#495057]">
              <div>
                Minimum SIP: {fund.sip_allowed ? fund.min_sip_investment ?? "-" : "Not Available"}
              </div>
              <div>
                Minimum Lumpsum: {fund.lumpsum_allowed ? fund.min_lumpsum_investment ?? "-" : "Not Available"}
              </div>
            </div>
          </div>

          <div className="border border-[#E4E4E4] rounded-lg p-5 bg-white shadow-sm">
            <h2 className="text-[16px] font-semibold mb-3">Benchmark Returns</h2>
            <div className="mb-4 text-[13px] text-[#495057]">
              Benchmark Index: {fund.benchmark_index_name || "-"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px] text-[#495057]">
              <div>
                <div className="font-semibold mb-2">Trailing</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>1D: {fund.benchmark_returns_trailing?.d1 ?? 0}</div>
                  <div>1M: {fund.benchmark_returns_trailing?.m1 ?? 0}</div>
                  <div>3M: {fund.benchmark_returns_trailing?.m3 ?? 0}</div>
                  <div>6M: {fund.benchmark_returns_trailing?.m6 ?? 0}</div>
                  <div>1Y: {fund.benchmark_returns_trailing?.y1 ?? "-"}</div>
                  <div>3Y: {fund.benchmark_returns_trailing?.y3 ?? "-"}</div>
                  <div>5Y: {fund.benchmark_returns_trailing?.y5 ?? "-"}</div>
                  <div>10Y: {fund.benchmark_returns_trailing?.y10 ?? "-"}</div>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-2">Annual</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>1Y: {fund.benchmark_returns_annual?.y1 ?? "-"}</div>
                  <div>3Y: {fund.benchmark_returns_annual?.y3 ?? "-"}</div>
                  <div>5Y: {fund.benchmark_returns_annual?.y5 ?? "-"}</div>
                  <div>10Y: {fund.benchmark_returns_annual?.y10 ?? "-"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400">Fund not found</div>
      )}
    </div>
  );
}
