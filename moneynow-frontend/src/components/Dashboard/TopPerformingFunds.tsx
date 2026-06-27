"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { mfService } from "@/services/mfService";

type FundRow = {
  _id?: string;
  fund_name?: string;
  expense_ratio?: number | null;
  amc_id?: { name?: string };
  category_id?: { name?: string };
  returns?: {
    trailing?: Record<string, number | null>;
    y1_cagr?: number | null;
    y3_cagr?: number | null;
    y5_cagr?: number | null;
  };
};

type FundDisplayRow = {
  id: string;
  name: string;
  amc: string;
  category: string;
  return1y: string;
  return3y: string;
  return5y: string;
  expenseRatio: string;
  riskLabel: string;
  riskColor: string;
};

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value))
    return "N/A";
  return `${Number(value).toFixed(2)}%`;
};

const getTrailingReturn = (
  returns?: FundRow["returns"],
  key?: "1y" | "3y" | "5y",
  legacyKey?: "y1_cagr" | "y3_cagr" | "y5_cagr",
) =>
  returns?.trailing?.[key || "3y"] ?? returns?.[legacyKey || "y3_cagr"] ?? null;

const getRiskStyle = (riskLevel?: string | null) => {
  const normalized = String(riskLevel || "")
    .trim()
    .toLowerCase();

  if (normalized.includes("high")) {
    return "bg-[#FEE2E2] text-[#DC2626]";
  }

  if (normalized.includes("low")) {
    return "bg-[#DCFCE7] text-[#16A34A]";
  }

  if (normalized.includes("moderate")) {
    return "bg-[#DBEAFE] text-[#2563EB]";
  }

  return "bg-[#F1F5F9] text-[#475569]";
};

export default function TopPerformingFunds() {
  const [funds, setFunds] = useState<FundDisplayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadFunds = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await mfService.getFunds({
          is_active: 1,
          limit: 5,
          sort: "returns_y3",
        });

        const items = Array.isArray(response?.data) ? response.data : [];
        if (!active) return;

        const mapped = items.slice(0, 5).map((item: FundRow, index: number) => {
          const y1 = getTrailingReturn(item.returns, "1y", "y1_cagr");
          const y3 = getTrailingReturn(item.returns, "3y", "y3_cagr");
          const y5 = getTrailingReturn(item.returns, "5y", "y5_cagr");
          const riskLabel =
            y3 === null
              ? "PENDING"
              : y3 >= 18
                ? "HIGH"
                : y3 >= 12
                  ? "STEADY"
                  : "BALANCED";

          return {
            id: item._id || `${index}`,
            name: item.fund_name || "Unnamed Fund",
            amc: item.amc_id?.name || "N/A",
            category: item.category_id?.name || "N/A",
            return1y: formatPercent(y1),
            return3y: formatPercent(y3),
            return5y: formatPercent(y5),
            expenseRatio: formatPercent(item.expense_ratio),
            riskLabel,
            riskColor: getRiskStyle(riskLabel),
          };
        });

        setFunds(mapped);
      } catch {
        if (active) {
          setError("Failed to load top funds");
          setFunds([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadFunds();

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardCard className="mt-4 rounded-xl p-6 md:p-7">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-[#051338]">
          Top Performing Funds
        </h2>
        <Link
          href="/funds"
          className="group inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm bg-[#0A4A87] px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#083A69]"
        >
          View all funds
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {loading && (
        <p className="py-4 text-center text-sm text-[#64748B]">Loading...</p>
      )}
      {error && (
        <p className="py-4 text-center text-sm text-red-500">{error}</p>
      )}

      {!loading && funds.length > 0 && (
        <div className="w-full overflow-hidden overflow-x-auto rounded-xl border border-[#E7ECF5]">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-[#F1F5F9]">
                <th className="px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B] md:px-7">
                  FUND
                </th>
                <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
                  AMC
                </th>
                <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
                  CATEGORY
                </th>
                <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
                  1Y RETURNS
                </th>
                <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
                  3Y RETURNS
                </th>
                <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
                  5Y RETURNS
                </th>
                <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
                  EXPENSE RATIO
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B] md:px-7">
                  RISK LEVEL
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] bg-white">
              {funds.map((fund) => (
                <tr
                  key={fund.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-6 py-3 text-[15px] text-[#0A1633] md:px-7">
                    {fund.name}
                  </td>
                  <td className="px-4 py-3 text-[15px] text-[#0A1633]">
                    {fund.amc}
                  </td>
                  <td className="px-4 py-3 text-[15px] text-[#0A1633]">
                    {fund.category}
                  </td>
                  <td className="px-4 py-3 text-[15px] text-[#0A1633]">
                    {fund.return1y}
                  </td>
                  <td className="px-4 py-3 text-[15px] text-[#0A1633]">
                    {fund.return3y}
                  </td>
                  <td className="px-4 py-3 text-[15px] text-[#0A1633]">
                    {fund.return5y}
                  </td>
                  <td className="px-4 py-3 text-[15px] text-[#0A1633]">
                    {fund.expenseRatio}
                  </td>
                  <td className="px-6 py-3 md:px-7">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${fund.riskColor}`}
                    >
                      {fund.riskLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && funds.length === 0 && (
        <p className="py-4 text-center text-sm text-[#64748B]">
          No fund performance data available.
        </p>
      )}
    </DashboardCard>
  );
}
