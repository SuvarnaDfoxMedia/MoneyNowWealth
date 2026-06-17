import { useParams } from "react-router-dom";
import React, { useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import * as XLSX from "xlsx";

import PageHeader from "../components/PageHeader";
import StatusPill from "../components/StatusPill";
import {
  useMfApiScheme,
  useMfApiSyncOne,
  useMfApiToggleActive,
  useMfApiTopHoldings,
  useMfApiNavHistory,
  useMfApiImportTopHoldings,
  useMfApiSyncToManual,
} from "../hooks";
import {
  formatDateTime,
  formatNumber,
  getMfApiAmcName,
  getMfApiLatestDate,
  getMfApiLatestInfo,
  getMfApiLatestNav,
  getMfApiSyncStatus,
  getMfApiSchemeName,
  toTitleCase,
} from "../utils";
import type { MfApiNavHistoryEntry, MfApiTopHolding } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtReturn = (val: number | null | undefined, period?: string): string => {
  if (val === null || val === undefined) return "—";
  // For longer periods, treat 0.0 as no data (insufficient history)
  if (val === 0 && period && ["3y", "5y", "10y"].includes(period)) return "—";
  return `${val.toFixed(2)}%`;
};

const returnColorClass = (val: number | null | undefined, period?: string): string => {
  if (val === null || val === undefined) return "text-gray-400";
  if (val === 0 && period && ["3y", "5y", "10y"].includes(period)) return "text-gray-400";
  if (val > 0) return "text-green-600 font-medium";
  if (val < 0) return "text-red-600 font-medium";
  return "text-gray-600";
};

const fmtCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return "—";
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

const fmtDate = (d: string | null | undefined): string => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return d;
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReturnCell({
  val,
  period,
  suppressZero = false,
}: {
  val: number | null | undefined;
  period?: string;
  suppressZero?: boolean;
}) {
  const longPeriods = ["3y", "5y", "10y"];

  const shouldSuppress =
    suppressZero &&
    val === 0 &&
    period !== undefined &&
    longPeriods.includes(period);

  const displayVal = shouldSuppress ? null : val;

  const colorClass =
    displayVal === null || displayVal === undefined
      ? "text-gray-400"
      : displayVal > 0
        ? "text-green-600 font-medium"
        : displayVal < 0
          ? "text-red-600 font-medium"
          : "text-gray-600";

  const formatted =
    displayVal === null || displayVal === undefined
      ? "—"
      : `${displayVal.toFixed(2)}%`;

  return (
    <td className={`py-3 px-4 text-right tabular-nums text-sm ${colorClass}`}>
      {formatted}
    </td>
  );
}

// ─── Returns Comparison Tab ───────────────────────────────────────────────────

function ReturnsTab({ scheme, onSyncNow }: { scheme: any; onSyncNow?: () => void }) {
  const tr = scheme?.trailing_returns || {};
  const br = scheme?.benchmark_returns || {};
  const cr = scheme?.category_avg_returns || {};
  const ar = scheme?.annual_returns || {};

  const benchmarkName = br.benchmark_name || scheme?.scheme_benchmark || "Benchmark";
  const categoryName = cr.category_name || scheme?.category || "Category Avg";

  const rows: Array<{ label: string; key: string; period?: string }> = [
    { label: "1 Week",       key: "1w",           period: "1w" },
    { label: "1 Month",      key: "1m",            period: "1m" },
    { label: "3 Months",     key: "3m",            period: "3m" },
    { label: "6 Months",     key: "6m",            period: "6m" },
    { label: "1 Year",       key: "1y",            period: "1y" },
    { label: "2 Years",      key: "2y",            period: "2y" },
    { label: "3 Years",      key: "3y",            period: "3y" },
    { label: "5 Years",      key: "5y",            period: "5y" },
    { label: "10 Years",     key: "10y",           period: "10y" },
    { label: "Since Launch", key: "since_launch",  period: "since_launch" },
    { label: "YTD",          key: "ytd",           period: "ytd" },
  ];

  // YTD: prefer annual_returns.ytd, fallback to trailing_returns.ytd
  const ytdValue = ar.ytd ?? tr.ytd ?? null;

  const yearlyReturns = ar.yearly_returns || {};
  const yearlyKeys = Object.keys(yearlyReturns).sort((a, b) => Number(b) - Number(a));

  // Check if scheme has any return data at all
  const hasAnyReturn = Object.entries(tr).some(([, v]) => v !== null && v !== undefined);
  const lastSynced = scheme?.last_synced_at;

  return (
    <div className="space-y-6">
      {/* Sync status banner when no data is available */}
      {!hasAnyReturn && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Returns not yet available</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {lastSynced
                ? `Last synced ${formatDateTime(lastSynced)}. The API returned no performance data for this scheme. Try syncing individually.`
                : 'This scheme has not been individually synced yet. Click "Sync This Scheme" to fetch returns data.'}
            </p>
            {onSyncNow && (
              <button
                onClick={onSyncNow}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 border border-amber-300 rounded-md px-3 py-1.5 hover:bg-amber-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync This Scheme
              </button>
            )}
          </div>
        </div>
      )}

      {/* Section A — Trailing Returns */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Trailing Returns Comparison</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Annualised returns as of last sync date
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-4 text-left">Period</th>
                <th className="py-3 px-4 text-right text-[#043f79]">This Fund</th>
                <th className="py-3 px-4 text-right text-purple-600" title={benchmarkName}>
                  {benchmarkName.length > 28 ? benchmarkName.slice(0, 28) + "…" : benchmarkName}
                </th>
                <th className="py-3 px-4 text-right text-amber-600" title={categoryName}>
                  {categoryName.length > 28 ? categoryName.slice(0, 28) + "…" : categoryName}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ label, key, period }) => (
                <tr key={key} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-700 font-medium">{label}</td>
                  <ReturnCell val={(tr as any)[key]} period={period} suppressZero={true} />
                  <ReturnCell val={(br as any)[key]} period={period} suppressZero={false} />
                  <ReturnCell val={(cr as any)[key]} period={period} suppressZero={false} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B — Annual / YTD */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Annual Returns</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 w-32">YTD Return</span>
            <span className={`text-sm font-semibold ${returnColorClass(ytdValue)}`}>
              {fmtReturn(ytdValue)}
            </span>
          </div>
          {yearlyKeys.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Calendar Year Returns
              </p>
              <div className="overflow-x-auto">
                <table className="text-sm min-w-max">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {yearlyKeys.map((yr) => (
                        <th key={yr} className="px-5 py-2 text-center text-gray-500 font-medium">{yr}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {yearlyKeys.map((yr) => (
                        <td key={yr} className={`px-5 py-3 text-center font-semibold ${returnColorClass(yearlyReturns[yr])}`}>
                          {fmtReturn(yearlyReturns[yr])}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800 mb-1">Calendar year returns not available from API</p>
              <p className="text-xs text-blue-600">
                Yearly returns (FY 2020, 2021, 2022…) must be populated via manual import.
                Export the scheme list → edit the <code className="font-mono bg-blue-100 px-1 rounded">ar_yearly_returns</code> column
                → re-import to save them.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section C — 1 Day Return */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <p className="text-sm font-medium text-gray-600">
          1 Day Return:{" "}
          {tr.d1 != null ? (
            <span className={`font-semibold ${returnColorClass(tr.d1)}`}>{fmtReturn(tr.d1)}</span>
          ) : (
            <span className="text-gray-400 italic">Not available from AdvisorKhoj API — set via manual import (tr_d1 column in export sheet)</span>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Risk Metrics Tab ─────────────────────────────────────────────────────────

function RiskTab({ scheme }: { scheme: any }) {
  const rm = scheme?.risk_metrics || {};

  const riskRows = [
    { label: "Volatility (3Y)",  value: rm.volatility_3y,     suffix: "%",    desc: "Standard deviation of returns over 3 years" },
    { label: "Sharpe Ratio (3Y)",value: rm.sharpe_3y,         suffix: "",     desc: "Risk-adjusted return relative to risk-free rate" },
    { label: "Alpha (1Y)",       value: rm.alpha_1y,          suffix: "%",    desc: "Excess return over benchmark" },
    { label: "Beta (1Y)",        value: rm.beta_1y,           suffix: "",     desc: "Market sensitivity — 1 = moves with market" },
    { label: "Sortino Ratio",    value: rm.sortino,           suffix: "",     desc: "Downside risk-adjusted return" },
    { label: "Yield to Maturity",value: rm.yield_to_maturity, suffix: "%",    desc: "Expected yield if held to maturity (debt funds)" },
    { label: "Average Maturity", value: rm.average_maturity,  suffix: " yrs", desc: "Weighted average time to maturity (debt funds)" },
  ];

  const hasAnyData = riskRows.some((r) => r.value !== null && r.value !== undefined);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Risk Statistics</h3>
          <p className="text-xs text-gray-500 mt-0.5">Sourced from AdvisorKhoj risk_statistics_list[0]</p>
        </div>
        {hasAnyData ? (
          <div className="grid gap-0 divide-y divide-gray-100">
            {riskRows.map(({ label, value, suffix, desc }) => (
              <div key={label} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <div className="text-right">
                  {value !== null && value !== undefined ? (
                    <span className={`text-sm font-semibold tabular-nums ${
                      label.includes("Ratio") || label === "Beta (1Y)"
                        ? "text-gray-900"
                        : returnColorClass(value as number)
                    }`}>
                      {typeof value === "number" ? `${value.toFixed(2)}${suffix}` : String(value)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-center text-gray-400 text-sm">
            Risk metrics will populate after the next sync.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
        <strong>Note:</strong> Additional risk metrics (max drawdown, 5Y Sharpe / Beta / Alpha) are
        not provided by the AdvisorKhoj data source and require manual import.
      </div>
    </div>
  );
}

// ─── Top Holdings Tab ─────────────────────────────────────────────────────────

function TopHoldingsTab({ role, id, scheme }: { role: string; id: string; scheme: any }) {
  const holdingsQuery = useMfApiTopHoldings(role, id);
  const importMutation = useMfApiImportTopHoldings(role, id);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [portfolioDate, setPortfolioDate] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const holdings: MfApiTopHolding | null = holdingsQuery.data?.data ?? holdingsQuery.data ?? null;

  const marketCap = holdings?.market_cap_allocation || scheme?.market_cap || null;
  const displayHoldings = holdings?.holdings || [];
  const visibleHoldings = showAll ? displayHoldings : displayHoldings.slice(0, 10);

  const handleUpload = () => {
    setUploadError("");
    if (!uploadFile) {
      setUploadError("Please select an Excel (.xlsx) or CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setUploadError("Failed to read file.");
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const holdingsArr = rawRows
          .map((r) => ({
            name:                 String(r.name || r.stock_name || r["Stock Name"] || "").trim(),
            net_assets_pct:       parseFloat(r.net_assets_pct ?? r["% of Assets"] ?? r.pct ?? "") || null,
            market_value:         parseFloat(r.market_value ?? r["Market Value"] ?? "") || null,
            share_amount:         parseFloat(r.share_amount ?? r.shares ?? "") || null,
            share_change:         parseFloat(r.share_change ?? r.change ?? "") || null,
            sector:               String(r.sector || r.Sector || "").trim(),
            security_type:        String(r.security_type || r["Security Type"] || r.type || "").trim(),
            maturity:             String(r.maturity || r.Maturity || "").trim(),
            credit_quality_india: String(r.credit_quality_india || r["Credit Rating"] || "").trim(),
            country:              String(r.country || r.Country || "IN").trim(),
          }))
          .filter((h) => h.name.length > 0);

        if (holdingsArr.length === 0) {
          setUploadError('No valid rows found. Make sure the file has a "name" column.');
          return;
        }
        importMutation.mutate(
          {
            scheme_id:      id,
            portfolio_date: portfolioDate || new Date().toISOString().slice(0, 10),
            holdings:       holdingsArr,
            holdings_count: holdingsArr.length,
          } as Record<string, unknown>,
          {
            onSuccess: () => {
              setShowUploadModal(false);
              setUploadFile(null);
              setPortfolioDate("");
            },
          },
        );
      } catch (err: any) {
        setUploadError("Could not parse file: " + (err?.message ?? "Unknown error"));
      }
    };
    reader.readAsBinaryString(uploadFile);
  };

  if (holdingsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Loading top holdings…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Market Cap Allocation (from scheme structured field) */}
      {(marketCap?.large_cap_pct != null || marketCap?.mid_cap_pct != null || marketCap?.small_cap_pct != null) && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Market Cap Allocation
          </h3>
          <div className="flex gap-4">
            {[
              { label: "Large Cap", val: marketCap?.large_cap_pct, color: "bg-blue-600" },
              { label: "Mid Cap",   val: marketCap?.mid_cap_pct,   color: "bg-purple-500" },
              { label: "Small Cap", val: marketCap?.small_cap_pct, color: "bg-amber-500" },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex-1 rounded-lg border border-gray-100 p-4 text-center">
                <div className={`inline-flex h-2.5 w-12 rounded-full ${color} mb-2`} />
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-lg font-bold text-gray-900">
                  {val != null ? `${val.toFixed(1)}%` : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Holdings Table or Placeholder */}
      {holdings && holdings.holdings_count > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 border-b border-gray-200">
            {[
              { label: "Portfolio Date",    val: fmtDate(holdings.portfolio_date) },
              { label: "Total Holdings",    val: String(holdings.holdings_count) },
              { label: "Top 10 % of AUM",  val: holdings.assets_top_10_holdings_pct != null ? `${holdings.assets_top_10_holdings_pct.toFixed(1)}%` : "—" },
              { label: "Turnover %",        val: holdings.turnover_pct != null ? `${holdings.turnover_pct.toFixed(1)}%` : "—" },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white px-5 py-4">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-base font-semibold text-gray-900">{val}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-4 text-left">#</th>
                  <th className="py-3 px-4 text-left">Stock / Security</th>
                  <th className="py-3 px-4 text-left">Sector</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-right">% of Assets</th>
                  <th className="py-3 px-4 text-right">Market Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleHoldings.map((h, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 max-w-xs">
                      {h.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{h.sector || "—"}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{h.security_type || "—"}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {h.net_assets_pct != null ? `${h.net_assets_pct.toFixed(2)}%` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {fmtCurrency(h.market_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {displayHoldings.length > 10 && (
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <button
                onClick={() => setShowAll((s) => !s)}
                className="text-sm text-[#043f79] font-medium hover:underline"
              >
                {showAll ? "Show top 10 only" : `View all ${displayHoldings.length} holdings`}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Top Holdings not yet available</p>
          <p className="text-xs text-gray-400 mb-5 max-w-sm mx-auto">
            Individual stock holdings are not provided by the data source and must be imported manually
            (Excel or CSV format). Download a template from the Import/Export page.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#043f79] px-4 py-2 text-sm font-medium text-white hover:bg-[#032d58] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Holdings
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Import Top Holdings</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Portfolio Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Portfolio Date
                </label>
                <input
                  type="date"
                  value={portfolioDate}
                  onChange={(e) => setPortfolioDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043f79]/30 focus:border-[#043f79]"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Upload Holdings File
                </label>
                <div
                  className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-[#043f79]/30 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("holdings-file-input")?.click()}
                >
                  <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  {uploadFile ? (
                    <p className="text-sm font-medium text-[#043f79]">{uploadFile.name}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Click to browse or drag & drop</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, or .csv</p>
                  <input
                    id="holdings-file-input"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => { setUploadFile(e.target.files?.[0] ?? null); setUploadError(""); }}
                  />
                </div>
                {uploadError && <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>}
              </div>

              {/* Column guide */}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs font-semibold text-blue-800 mb-1">Expected columns (first row = header):</p>
                <p className="text-xs text-blue-600 font-mono leading-relaxed">
                  name · net_assets_pct · market_value · share_amount · share_change
                  · sector · security_type · maturity · credit_quality_india · country
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  Only <code className="bg-blue-100 rounded px-0.5">name</code> is required. Download the template from Import / Export page.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={importMutation.isPending || !uploadFile}
                className="rounded-lg bg-[#043f79] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-[#032d58] transition-colors"
              >
                {importMutation.isPending ? "Importing…" : "Import Holdings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload button shown even when holdings exist (for updating) */}
      {holdings && holdings.holdings_count > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowUploadModal(true)}
            className="text-sm text-[#043f79] font-medium border border-[#043f79]/30 rounded-lg px-4 py-2 hover:bg-[#043f79]/5 transition-colors"
          >
            Update Holdings
          </button>
        </div>
      )}
    </div>
  );
}

// ─── NAV History Tab ──────────────────────────────────────────────────────────

const NAV_PERIOD_OPTIONS = [
  { label: "1M",  days: 30 },
  { label: "3M",  days: 90 },
  { label: "6M",  days: 180 },
  { label: "1Y",  days: 365 },
  { label: "3Y",  days: 1095 },
];

function NavHistoryTab({ role, id, scheme }: { role: string; id: string; scheme: any }) {
  const [selectedDays, setSelectedDays] = useState(365);
  const navQuery = useMfApiNavHistory(role, id, selectedDays);

  const history: MfApiNavHistoryEntry[] = navQuery.data ?? [];
  const recentRows = [...history].reverse().slice(0, 10);

  const chartSeries = [
    {
      name: "NAV",
      data: history.map((h) => ({
        x: new Date(h.date).getTime(),
        y: h.nav,
      })),
    },
  ];

  const chartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 280,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "Inter, sans-serif",
    },
    colors: ["#043f79"],
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.3, opacityTo: 0.01 },
    },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 4 } },
    xaxis: {
      type: "datetime",
      labels: {
        style: { colors: "#9CA3AF", fontSize: "11px" },
        datetimeFormatter: { month: "MMM yy", day: "dd MMM" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#9CA3AF", fontSize: "11px" },
        formatter: (val: number) => `₹${val.toFixed(2)}`,
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      x: { format: "dd MMM yyyy" },
      y: { formatter: (val: number) => `₹${val.toFixed(4)}` },
    },
  };

  const currentNav = scheme?.latest_nav ?? scheme?.latestNav;
  const navDate = scheme?.latest_date ?? scheme?.latestDate;

  return (
    <div className="space-y-5">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {NAV_PERIOD_OPTIONS.map(({ label, days }) => (
          <button
            key={label}
            onClick={() => setSelectedDays(days)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedDays === days
                ? "bg-[#043f79] text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">NAV Trend</h3>
        </div>
        {navQuery.isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Loading NAV history…
          </div>
        ) : history.length > 0 ? (
          <div className="p-2">
            <Chart
              options={chartOptions}
              series={chartSeries}
              type="area"
              height={280}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center px-5">
            <p className="text-sm font-medium text-gray-700 mb-1">
              NAV history is being built
            </p>
            <p className="text-xs text-gray-400 mb-3">
              History accumulates one entry per sync cycle. Check back after the next sync.
            </p>
            {currentNav != null && (
              <p className="text-xs font-medium text-gray-600">
                Current NAV: <span className="text-[#043f79] font-bold">₹{Number(currentNav).toFixed(4)}</span>
                {navDate && <span className="text-gray-400 ml-1">as of {fmtDate(navDate)}</span>}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Last 10 NAV records table */}
      {recentRows.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recent NAV Records
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 px-4 text-left font-medium">Date</th>
                  <th className="py-2 px-4 text-right font-medium">NAV</th>
                  <th className="py-2 px-4 text-right font-medium">Change</th>
                  <th className="py-2 px-4 text-right font-medium">Change %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRows.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4 text-gray-700">{fmtDate(row.date)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900">
                      ₹{row.nav.toFixed(4)}
                    </td>
                    <td className={`py-2.5 px-4 text-right tabular-nums ${returnColorClass(row.nav_change)}`}>
                      {row.nav_change != null ? row.nav_change.toFixed(4) : "—"}
                    </td>
                    <td className={`py-2.5 px-4 text-right tabular-nums ${returnColorClass(row.nav_change_pct)}`}>
                      {row.nav_change_pct != null ? `${row.nav_change_pct.toFixed(2)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MfApiSchemeDetailPage() {
  const { role = "admin", id = "" } = useParams();
  const schemeQuery = useMfApiScheme(role, id);
  const syncOneMutation = useMfApiSyncOne(role);
  const toggleActiveMutation = useMfApiToggleActive(role);
  const syncToManualMutation = useMfApiSyncToManual(role);

  const scheme = schemeQuery.data?.data;
  const rawPayload =
    (scheme as any)?.rawPayload || (scheme as any)?.raw_payload || {};
  const latestInfo = getMfApiLatestInfo(scheme as any) || {};
  const latestNav = getMfApiLatestNav(scheme as any);
  const latestDate = getMfApiLatestDate(scheme as any);
  const syncStatus = getMfApiSyncStatus(scheme as any);
  const isActive = (scheme as any)?.is_active ?? false;
  const linkedManualFund = (scheme as any)?.linked_manual_fund;

  const lastSynced =
    (scheme as any)?.last_synced_at || (scheme as any)?.lastSyncedAt;
  const lastSyncError =
    (scheme as any)?.last_sync_error || (scheme as any)?.lastSyncError;

  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview",     label: "Overview" },
    { id: "performance",  label: "Returns" },
    { id: "risk",         label: "Risk Statistics" },
    { id: "holdings",     label: "Top Holdings" },
    { id: "nav_history",  label: "NAV History" },
    { id: "peer",         label: "Peer Comparison" },
    { id: "history",      label: "Sync History" },
    { id: "raw",          label: "Raw API Data" },
  ];

  const getColorClass = (val: any) => {
    const num = Number(String(val).replace(/%/g, ""));
    if (isNaN(num)) return "text-gray-600";
    if (num > 0) return "text-green-600 font-medium";
    if (num < 0) return "text-red-600 font-medium";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageHeader
        title="Scheme Detail"
        description="Latest API-driven record for this isolated MF API scheme."
        actions={
          <button
            type="button"
            onClick={() =>
              syncOneMutation.mutate({
                schemeId: id,
                schemeName: scheme ? getMfApiSchemeName(scheme) : undefined,
                externalSchemeId: scheme?.schemeCode || scheme?.scheme_code,
              })
            }
            disabled={syncOneMutation.isPending}
            className="rounded-lg bg-[#043f79] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncOneMutation.isPending ? "Syncing..." : "Sync This Scheme"}
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Scheme Name</p>
          <p className="mt-2 text-lg font-semibold text-gray-900 leading-tight">
            {scheme ? getMfApiSchemeName(scheme) : "Loading..."}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">AMC</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {scheme ? getMfApiAmcName(scheme) : "-"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Plan</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {scheme ? toTitleCase(scheme.planType || scheme.plan_type) : "-"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Sync Status</p>
          <div className="mt-2">
            <StatusPill status={syncStatus} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Active (Syncing)</p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                id && toggleActiveMutation.mutate({ id, is_active: !isActive })
              }
              disabled={toggleActiveMutation.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${
                isActive ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span
              className={`text-sm font-medium ${isActive ? "text-green-700" : "text-gray-500"}`}
            >
              {isActive ? "Active — will sync" : "Inactive — skipped on sync"}
            </span>
          </div>
        </div>
      </div>

      {lastSyncError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Last sync error: {lastSyncError}
        </div>
      )}

      {/* Manual Fund Link Status Section */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Manual Fund Link Status</h3>
        <div className="mt-3">
          {linkedManualFund ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-sm">
                  ✓
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Linked to: <span className="text-[#043f79]">{linkedManualFund.fund_name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Current NAV: ₹{formatNumber(linkedManualFund.nav_Current)} {linkedManualFund.nav_date ? `(as of ${fmtDate(linkedManualFund.nav_date)})` : ""}
                    {linkedManualFund.mf_api_synced_at && ` • Last bridge sync: ${formatDateTime(linkedManualFund.mf_api_synced_at)}`}
                  </p>
                </div>
              </div>
              <div>
                <a
                  href={`/${role}/mf/funds/edit/${linkedManualFund._id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#043f79] border border-[#043f79]/30 rounded-md px-3 py-1.5 hover:bg-[#043f79]/5 transition-colors"
                >
                  Edit Manual Fund
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-sm">
                  !
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 text-amber-800">
                    Not Linked Yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Activate this scheme to auto-create its manual fund entry.
                  </p>
                </div>
              </div>
              {isActive && (
                <div>
                  <button
                    type="button"
                    onClick={() => id && syncToManualMutation.mutate(id)}
                    disabled={syncToManualMutation.isPending}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#043f79] rounded-md px-3 py-1.5 hover:bg-[#032d58] transition-colors disabled:opacity-60"
                  >
                    {syncToManualMutation.isPending ? "Syncing..." : "Sync to Manual Now"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border-b border-gray-200">
        <nav
          className="-mb-px flex space-x-6 overflow-x-auto"
          aria-label="Tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-[#043f79] text-[#043f79]"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Scheme Metadata
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Scheme Code
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {scheme?.schemeCode || scheme?.scheme_code || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ISIN</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {scheme?.isin || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {scheme?.category || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Sub Category
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {scheme?.subCategory || scheme?.sub_category || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                NAV Information
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Latest NAV
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatNumber(
                      (scheme as any)?.latest_nav ?? (scheme as any)?.latestNav,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Latest Date
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDateTime(latestDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    NAV Change
                  </p>
                  <p className={`mt-1 text-sm ${getColorClass((scheme as any)?.nav_change ?? latestInfo?.nav_change)}`}>
                    {formatNumber((scheme as any)?.nav_change ?? latestInfo?.nav_change)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    NAV Change %
                  </p>
                  <p className={`mt-1 text-sm ${getColorClass((scheme as any)?.nav_change_percentage ?? latestInfo?.nav_change_percentage)}`}>
                    {formatNumber(
                      (scheme as any)?.nav_change_percentage ?? latestInfo?.nav_change_percentage,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Scheme Basic Details
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                {[
                  ["Scheme Objective", (scheme as any)?.scheme_objective],
                  ["Scheme Manager", (scheme as any)?.scheme_manager],
                  ["Riskometer", (scheme as any)?.riskometer_value],
                  [
                    "Inception Date",
                    formatDateTime((scheme as any)?.scheme_inception_date),
                  ],
                  ["Asset Class", (scheme as any)?.asset_class],
                  ["Benchmark", (scheme as any)?.scheme_benchmark],
                  ["Scheme Status", (scheme as any)?.scheme_status],
                  ["Exit Load", (scheme as any)?.exit_load],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {String(value || "-")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Investment Details
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  [
                    "Minimum Investment",
                    formatNumber((scheme as any)?.minimum_investment),
                  ],
                  [
                    "SIP Minimum",
                    formatNumber((scheme as any)?.sip_minimum_amount),
                  ],
                  [
                    "Minimum Topup",
                    formatNumber((scheme as any)?.minimum_topup),
                  ],
                  [
                    "Dividend Scheme",
                    String((scheme as any)?.is_dividend_scheme ?? "-"),
                  ],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {String(value || "-")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Expense & AUM
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  [
                    "Expense Ratio",
                    formatNumber((scheme as any)?.expense_ratio_percentage),
                  ],
                  [
                    "Expense Ratio Date",
                    formatDateTime((scheme as any)?.expense_ratio_date),
                  ],
                  [
                    "Scheme Assets",
                    formatNumber((scheme as any)?.scheme_assets),
                  ],
                  [
                    "Scheme Asset Date",
                    formatDateTime((scheme as any)?.scheme_asset_date),
                  ],
                  ["Scheme Turnover", (scheme as any)?.scheme_turnover],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {String(value || "-")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && scheme && (
          <ReturnsTab scheme={scheme} />
        )}

        {activeTab === "risk" && scheme && (
          <RiskTab scheme={scheme} />
        )}

        {activeTab === "holdings" && (
          <TopHoldingsTab role={role} id={id} scheme={scheme} />
        )}

        {activeTab === "nav_history" && (
          <NavHistoryTab role={role} id={id} scheme={scheme} />
        )}

        {activeTab === "peer" &&
          (() => {
            const listData =
              (scheme as any)?.scheme_peer_comparision_list ||
              latestInfo?.scheme_peer_comparision_list ||
              [];
            return (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left font-semibold text-gray-700 whitespace-nowrap">
                        <th className="py-3 px-4">Scheme</th>
                        <th className="py-3 px-4">Rating</th>
                        <th className="py-3 px-4">Expense %</th>
                        <th className="py-3 px-4">1W</th>
                        <th className="py-3 px-4">1M</th>
                        <th className="py-3 px-4">3M</th>
                        <th className="py-3 px-4">6M</th>
                        <th className="py-3 px-4">1Y</th>
                        <th className="py-3 px-4">2Y</th>
                        <th className="py-3 px-4">3Y</th>
                        <th className="py-3 px-4">5Y</th>
                        <th className="py-3 px-4">Since Inception</th>
                        <th className="py-3 px-4">YTD</th>
                        <th className="py-3 px-4">AUM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {listData.length > 0 ? (
                        listData.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td
                              className="py-3 px-4 font-medium text-gray-900 max-w-xs truncate"
                              title={item.scheme_name || "-"}
                            >
                              {item.scheme_name || "-"}
                            </td>
                            <td className="py-3 px-4 text-amber-500 font-medium">
                              {item.rating || "-"}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {item.expense_ratio_percentage || "-"}
                            </td>
                            <td className={`py-3 px-4 ${getColorClass(item.one_week_return)}`}>{item.one_week_return || "-"}</td>
                            <td className={`py-3 px-4 ${getColorClass(item.one_month_return)}`}>{item.one_month_return || "-"}</td>
                            <td className={`py-3 px-4 ${getColorClass(item.three_month_return)}`}>{item.three_month_return || "-"}</td>
                            <td className={`py-3 px-4 ${getColorClass(item.six_month_return)}`}>{item.six_month_return || "-"}</td>
                            <td className={`py-3 px-4 ${getColorClass(item.one_year_return)}`}>{item.one_year_return || "-"}</td>
                            <td className={`py-3 px-4 ${getColorClass(item.two_year_return)}`}>{item.two_year_return || "-"}</td>
                            <td className={`py-3 px-4 ${getColorClass(item.three_year_return)}`}>{item.three_year_return || "-"}</td>
                            <td className={`py-3 px-4 ${getColorClass(item.five_year_return)}`}>{item.five_year_return || "-"}</td>
                            <td className={`py-3 px-4 ${getColorClass(item.inception_year_return)}`}>{item.inception_year_return || "-"}</td>
                            <td className={`py-3 px-4 ${getColorClass(item.ytd_return)}`}>{item.ytd_return || "-"}</td>
                            <td className="py-3 px-4 text-gray-600">{item.scheme_assets || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={14}
                            className="py-6 text-center text-gray-500"
                          >
                            No peer comparison available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        {activeTab === "history" && (
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Sync History
            </h3>
            <div className="mt-4 overflow-auto">
              {Array.isArray((scheme as any)?.syncHistory) &&
              (scheme as any).syncHistory.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(scheme as any).syncHistory.map((log: any) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 whitespace-nowrap">
                          {formatDateTime(log.createdAt || log.created_at)}
                        </td>
                        <td className="py-3 px-4 uppercase">{log.action}</td>
                        <td className="py-3 px-4">
                          <StatusPill status={log.status} />
                        </td>
                        <td className="py-3 px-4">
                          {log.message || log.error || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500">
                  No sync history available.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "raw" && (
          <div className="rounded-lg border border-gray-200 bg-gray-900 p-5 shadow-sm overflow-auto">
            <pre className="text-xs text-green-400 font-mono">
              {JSON.stringify(rawPayload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
