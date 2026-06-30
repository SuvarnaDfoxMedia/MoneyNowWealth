import { useParams } from "react-router-dom";
import React, { useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { fmtReturn, returnColorClass, fmtCurrency, fmtDate } from "../scheme-view/formatters";
import type { ApexOptions } from "apexcharts";
import * as XLSX from "xlsx";

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

import SchemeHeroCard        from "../scheme-view/SchemeHeroCard";
import InvestmentObjectiveCard from "../scheme-view/InvestmentObjectiveCard";
import FundDetailsCard       from "../scheme-view/FundDetailsCard";
import ReturnsComparisonTable from "../scheme-view/ReturnsComparisonTable";
import NavMovementChart      from "../scheme-view/NavMovementChart";
import HoldingsSplitTable    from "../scheme-view/HoldingsSplitTable";
import SectorAllocationTable   from "../scheme-view/SectorAllocationTable";
import AssetAllocationChart  from "../scheme-view/AssetAllocationChart";
import PortfolioStatsPanel   from "../scheme-view/PortfolioStatsPanel";
import PeerComparisonTable   from "../scheme-view/PeerComparisonTable";

// ─── Local helpers (imported from scheme-view/formatters) ───────────────────────

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ─── Admin section (collapsible disclosure) ───────────────────────────────────

function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

// ─── ReturnCell helper ────────────────────────────────────────────────────────

function ReturnCell({
  val, period, suppressZero = false,
}: {
  val: number | null | undefined;
  period?: string;
  suppressZero?: boolean;
}) {
  const longPeriods = ["3y", "5y", "10y"];
  const shouldSuppress = suppressZero && val === 0 && period !== undefined && longPeriods.includes(period);
  const displayVal = shouldSuppress ? null : val;
  const colorClass =
    displayVal === null || displayVal === undefined
      ? "text-gray-400"
      : displayVal > 0 ? "text-green-600 font-medium"
      : displayVal < 0 ? "text-red-600 font-medium"
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

/**
 * Parses a date string that may be in "DD-MM-YYYY" (AdvisorKhoj) or ISO-8601 format.
 * Returns a value suitable for the existing display helpers.
 */
function parseFlexDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
  const m = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return raw;
}

// ─── Top Holdings Admin Tab (upload modal preserved) ─────────────────────────

function TopHoldingsAdmin({ role, id, scheme }: { role: string; id: string; scheme: any }) {
  const holdingsQuery = useMfApiTopHoldings(role, id);
  const importMutation = useMfApiImportTopHoldings(role, id);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [portfolioDate, setPortfolioDate]     = useState("");
  const [uploadFile, setUploadFile]           = useState<File | null>(null);
  const [uploadError, setUploadError]         = useState("");
  const [showAll, setShowAll]                 = useState(false);

  const holdings: MfApiTopHolding | null = holdingsQuery.data?.data ?? holdingsQuery.data ?? null;
  const displayHoldings = holdings?.holdings || [];
  const visibleHoldings = showAll ? displayHoldings : displayHoldings.slice(0, 10);

  const handleUpload = () => {
    setUploadError("");
    if (!uploadFile) { setUploadError("Please select an Excel (.xlsx) or CSV file."); return; }
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
          }
        );
      } catch (err: any) {
        setUploadError("Could not parse file: " + (err?.message ?? "Unknown error"));
      }
    };
    reader.readAsBinaryString(uploadFile);
  };

  if (holdingsQuery.isLoading) {
    return <div className="flex items-center justify-center py-10 text-gray-400">Loading top holdings…</div>;
  }

  return (
    <div className="space-y-4">
      {holdings && holdings.holdings_count > 0 ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
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
                    <td className="py-3 px-4 font-medium text-gray-900 max-w-xs">{h.name || "—"}</td>
                    <td className="py-3 px-4 text-gray-600">{h.sector || "—"}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{h.security_type || "—"}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {h.net_assets_pct != null ? `${h.net_assets_pct.toFixed(2)}%` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{fmtCurrency(h.market_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {displayHoldings.length > 10 && (
            <div className="text-center">
              <button onClick={() => setShowAll((s) => !s)} className="text-sm text-[#043f79] font-medium hover:underline">
                {showAll ? "Show top 10 only" : `View all ${displayHoldings.length} holdings`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-600 mb-1">Top Holdings not yet available</p>
          <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
            Individual stock holdings must be imported manually (Excel or CSV format).
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#043f79] px-4 py-2 text-sm font-medium text-white hover:bg-[#032d58] transition-colors"
        >
          {holdings && holdings.holdings_count > 0 ? "Update Holdings" : "Upload Holdings"}
        </button>
      </div>

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Portfolio Date</label>
                <input
                  type="date" value={portfolioDate}
                  onChange={(e) => setPortfolioDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043f79]/30 focus:border-[#043f79]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Holdings File</label>
                <div
                  className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-[#043f79]/30 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("holdings-file-input")?.click()}
                >
                  {uploadFile
                    ? <p className="text-sm font-medium text-[#043f79]">{uploadFile.name}</p>
                    : <p className="text-sm text-gray-500">Click to browse or drag & drop</p>}
                  <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, or .csv</p>
                  <input
                    id="holdings-file-input" type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={(e) => { setUploadFile(e.target.files?.[0] ?? null); setUploadError(""); }}
                  />
                </div>
                {uploadError && <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>}
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs font-semibold text-blue-800 mb-1">Expected columns (first row = header):</p>
                <p className="text-xs text-blue-600 font-mono leading-relaxed">
                  name · net_assets_pct · market_value · share_amount · share_change
                  · sector · security_type · maturity · credit_quality_india · country
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MfApiSchemeDetailPage() {
  const { role = "admin", id = "" } = useParams();

  // ── Sync polling ────────────────────────────────────────────────────────────
  const [hasPendingSync, setHasPendingSync] = React.useState(false);

  const schemeQuery = useMfApiScheme(role, id, {
    refetchInterval: hasPendingSync ? 8000 : false,
  });
  const scheme = schemeQuery.data?.data;

  React.useEffect(() => {
    if (!scheme) return;
    const isSyncing =
      scheme.sync_status === "queued" ||
      scheme.sync_status === "running" ||
      scheme.sync_status === "processing";
    const isActivating = scheme.is_active && !scheme.linked_manual_fund;
    setHasPendingSync(Boolean(isSyncing || isActivating));
  }, [scheme]);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const syncOneMutation    = useMfApiSyncOne(role);
  const syncToManualMutation = useMfApiSyncToManual(role);

  // ── Raw API payload ─────────────────────────────────────────────────────────
  const rawPayload = (scheme as any)?.rawPayload || (scheme as any)?.raw_payload || {};
  const rawData    = rawPayload as any;
  const linkedManualFund = (scheme as any)?.linked_manual_fund;

  // ── Derived data ────────────────────────────────────────────────────────────
  const performanceList = useMemo(() => {
    const manualFund = linkedManualFund as any;
    if (!manualFund) return [];

    const category = manualFund.category_id || {};
    const categoryReturns = category.category_returns || category.category_average_returns || {};
    const benchmarkTrailing = manualFund.benchmark_returns_trailing || {};

    const perfList = Array.isArray((scheme as any)?.scheme_performance_list)
      ? (scheme as any).scheme_performance_list
      : Array.isArray(rawData?.scheme_performance_list)
      ? rawData.scheme_performance_list
      : [];

    let resolvedBenchmarkName = manualFund.benchmark_index_name || "Benchmark";
    if (perfList.length > 0) {
      const fundRow = perfList.find((r: any) =>
        String(r?.scheme_name || "").toLowerCase().includes(String(manualFund.fund_name || "").toLowerCase().slice(0, 10))
      ) || perfList[0] || {};

      const looksLikeCategory = (row: any): boolean => {
        const name = String(row?.scheme_name || "").toLowerCase().trim();
        const catName = String(category.name || "").toLowerCase().trim();
        return (
          name.includes(":") ||
          name === catName ||
          name.includes("category average") ||
          name.includes("category avg")
        );
      };

      const benchmarkRow = perfList.find((r: any) => r !== fundRow && !looksLikeCategory(r)) || perfList[1] || {};
      if (benchmarkRow?.scheme_name) {
        resolvedBenchmarkName = benchmarkRow.scheme_name;
      }
    }

    return [
      {
        scheme_name: manualFund.fund_name || getMfApiSchemeName(scheme),
        one_week_return: manualFund.returns?.trailing?.["1w"] ?? null,
        one_month_return: manualFund.returns?.trailing?.["1m"] ?? null,
        three_month_return: manualFund.returns?.trailing?.["3m"] ?? null,
        six_month_return: manualFund.returns?.trailing?.["6m"] ?? null,
        one_year_return: manualFund.returns?.trailing?.["1y"] ?? null,
        two_year_return: manualFund.returns?.trailing?.["2y"] ?? null,
        three_year_return: manualFund.returns?.trailing?.["3y"] ?? null,
        five_year_return: manualFund.returns?.trailing?.["5y"] ?? null,
        ten_year_return: manualFund.returns?.trailing?.["10y"] ?? null,
        inception_year_return:
          manualFund.returns?.since_inception ??
          manualFund.returns?.trailing?.since_launch ??
          null,
        ytd_return: manualFund.returns?.annual?.ytd ?? manualFund.returns?.trailing?.ytd ?? null,
      },
      ...(manualFund.benchmark_id ? [{
        scheme_name: resolvedBenchmarkName,
        one_week_return: benchmarkTrailing?.["1w"] ?? null,
        one_month_return: benchmarkTrailing?.["1m"] ?? null,
        three_month_return: benchmarkTrailing?.["3m"] ?? null,
        six_month_return: benchmarkTrailing?.["6m"] ?? null,
        one_year_return: benchmarkTrailing?.["1y"] ?? null,
        two_year_return: benchmarkTrailing?.["2y"] ?? null,
        three_year_return: benchmarkTrailing?.["3y"] ?? null,
        five_year_return: benchmarkTrailing?.["5y"] ?? null,
        ten_year_return: benchmarkTrailing?.["10y"] ?? null,
        inception_year_return:
          manualFund.benchmark_inception_return ??
          benchmarkTrailing?.since_launch ??
          null,
        ytd_return: benchmarkTrailing?.ytd ?? null,
      }] : []),
      {
        scheme_name: category.name || "Category Avg",
        one_week_return: categoryReturns?.trailing?.["1w"] ?? null,
        one_month_return: categoryReturns?.trailing?.["1m"] ?? null,
        three_month_return: categoryReturns?.trailing?.["3m"] ?? null,
        six_month_return: categoryReturns?.trailing?.["6m"] ?? null,
        one_year_return: categoryReturns?.trailing?.["1y"] ?? null,
        two_year_return: categoryReturns?.trailing?.["2y"] ?? null,
        three_year_return: categoryReturns?.trailing?.["3y"] ?? null,
        five_year_return: categoryReturns?.trailing?.["5y"] ?? null,
        ten_year_return: categoryReturns?.trailing?.["10y"] ?? null,
        inception_year_return:
          categoryReturns?.since_launch ??
          categoryReturns?.trailing?.since_launch ??
          null,
        ytd_return: categoryReturns?.annual?.ytd ?? categoryReturns?.trailing?.ytd ?? null,
      },
    ];
  }, [linkedManualFund, scheme]);
  const riskStat      = rawData?.risk_statistics_list?.[0] ?? null;
  const rawPeerList   = rawData?.scheme_peer_comparision_list ?? (scheme as any)?.scheme_peer_comparision_list ?? [];
  const peerList = useMemo(() => {
    return Array.isArray(rawPeerList) ? rawPeerList.map((row: any) => ({
      ...row,
      inception_year_return: row.inception_year_return ?? row.since_launch ?? null,
      ytd_return: row.ytd_return ?? row.ytd ?? null,
    })) : [];
  }, [rawPeerList]);
  const latestNav     = getMfApiLatestNav(scheme as any);
  const latestDate    = getMfApiLatestDate(scheme as any);
  const syncStatus    = getMfApiSyncStatus(scheme as any);
  const isActive      = (scheme as any)?.is_active ?? false;
  const lastSynced    = (scheme as any)?.last_synced_at || (scheme as any)?.lastSyncedAt;
  const lastSyncError = (scheme as any)?.last_sync_error || (scheme as any)?.lastSyncError;

  // ── Top holdings ────────────────────────────────────────────────────────────
  const overviewHoldingsQuery = useMfApiTopHoldings(role, id);
  const overviewHoldings =
    (overviewHoldingsQuery.data as any)?.data ?? overviewHoldingsQuery.data ?? null;

  // ── NAV history (managed here so period selector lives on this page) ────────
  const [selectedNavDays, setSelectedNavDays] = useState(365);
  const navQuery   = useMfApiNavHistory(role, id, selectedNavDays);
  const navHistory: MfApiNavHistoryEntry[] = navQuery.data ?? [];

  // ── Loading state ───────────────────────────────────────────────────────────
  if (schemeQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-[#043f79] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm text-gray-500">Loading scheme details…</p>
        </div>
      </div>
    );
  }

  if (schemeQuery.isError || !scheme) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center max-w-md">
          <p className="text-sm font-medium text-red-800 mb-1">Failed to load scheme</p>
          <p className="text-xs text-red-600">{(schemeQuery.error as any)?.message ?? "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">

      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <SchemeHeroCard
        schemeName={getMfApiSchemeName(scheme)}
        amcName={getMfApiAmcName(scheme)}
        category={rawData?.scheme_category ?? scheme?.category}
        benchmark={rawData?.scheme_benchmark ?? (scheme as any)?.scheme_benchmark}
        planType={toTitleCase(scheme?.planType || scheme?.plan_type)}
        optionType={toTitleCase((scheme as any)?.optionType || (scheme as any)?.option_type)}
        schemeAssets={rawData?.scheme_assets ?? (scheme as any)?.scheme_assets}
        schemeAssetDate={rawData?.scheme_asset_date ?? (scheme as any)?.scheme_asset_date}
        schemeManager={rawData?.scheme_manager ?? (scheme as any)?.scheme_manager}
        nav={rawData?.nav ?? latestNav}
        navDate={parseFlexDate(rawData?.nav_date) ?? parseFlexDate(latestDate as string)}
        navChange={rawData?.nav_change ?? (scheme as any)?.nav_change}
        navChangePct={rawData?.nav_change_percentage ?? (scheme as any)?.nav_change_percentage}
        riskometer={rawData?.riskometer_value ?? (scheme as any)?.riskometer_value}
        rating={rawData?.rating ?? null}
        ratingValue={rawData?.rating_value ?? null}
        isin={rawData?.isin_no ?? scheme?.isin}
        schemeCode={scheme?.schemeCode || scheme?.scheme_code}
        syncStatus={syncStatus}
        onSyncNow={() => {
          setHasPendingSync(true);
          syncOneMutation.mutate(
            {
              schemeId: id,
              schemeName: getMfApiSchemeName(scheme),
              externalSchemeId: scheme?.schemeCode || scheme?.scheme_code,
            },
            {
              onError: () => setHasPendingSync(false),
            },
          );
        }}
        isSyncing={syncOneMutation.isPending}
      />

      {/* Last sync error */}
      {lastSyncError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Last sync error: {lastSyncError}
        </div>
      )}

      {/* ── 2. INVESTMENT OBJECTIVE ────────────────────────────────────────── */}
      <InvestmentObjectiveCard
        schemeObjective={rawData?.scheme_objective ?? (scheme as any)?.scheme_objective}
      />

      {/* ── 3. FUND DETAILS ────────────────────────────────────────────────── */}
      <FundDetailsCard
        inceptionDate={
          parseFlexDate(rawData?.scheme_inception_date) ??
          parseFlexDate((scheme as any)?.scheme_inception_date)
        }
        expenseRatio={rawData?.expense_ratio_percentage ?? (scheme as any)?.expense_ratio_percentage}
        expenseRatioDate={rawData?.expense_ratio_date ?? (scheme as any)?.expense_ratio_date}
        fundStatus={rawData?.scheme_status ?? (scheme as any)?.scheme_status}
        minimumInvestment={rawData?.minimum_investment ?? (scheme as any)?.minimum_investment}
        minimumTopup={rawData?.minimum_topup ?? (scheme as any)?.minimum_topup}
        sipMinimum={rawData?.sip_minimum_amount ?? (scheme as any)?.sip_minimum_amount}
        riskStatus={rawData?.riskometer_value ?? (scheme as any)?.riskometer_value}
        returnsSinceInception={linkedManualFund?.returns?.since_inception ?? linkedManualFund?.returns?.trailing?.since_launch ?? rawData?.scheme_inception_return ?? scheme?.trailing_returns?.since_launch}
        schemeTurnover={rawData?.scheme_turnover ?? (scheme as any)?.scheme_turnover}
        upmarketCapture={rawData?.upmarket_capture_ratio ?? null}
        downmarketCapture={rawData?.downmarket_capture_ratio ?? null}
      />

      {/* ── 4. PERFORMANCE SECTION ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <SectionHeader
          title="Returns Comparison"
          subtitle="Manual returns — Fund vs Benchmark vs Category Avg"
        />
        <div className="p-5">
          <ReturnsComparisonTable performanceList={performanceList} />
        </div>
      </div>

      {/* ── 5. NAV MOVEMENT ───────────────────────────────────────────────── */}
      <NavMovementChart
        history={navHistory}
        isLoading={navQuery.isLoading}
        onPeriodChange={setSelectedNavDays}
        selectedDays={selectedNavDays}
        currentNav={rawData?.nav ?? latestNav}
        navDate={parseFlexDate(rawData?.nav_date) ?? parseFlexDate(latestDate as string)}
      />

      {/* ── 6 & 7. EQUITY + DEBT HOLDINGS ─────────────────────────────────── */}
      {overviewHoldings && overviewHoldings.holdings_count > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <SectionHeader
            title="Portfolio Holdings"
            subtitle="Top 10 equity and debt positions"
          />
          <div className="p-5 space-y-5">
            <HoldingsSplitTable
              holdings={overviewHoldings.holdings}
              portfolioDate={overviewHoldings.portfolio_date}
              holdingsCount={overviewHoldings.holdings_count}
              assetsTop10Pct={overviewHoldings.assets_top_10_holdings_pct}
            />
            <SectorAllocationTable holdings={overviewHoldings.holdings} />
          </div>
        </div>
      )}

      {/* ── 8. ASSET ALLOCATION + 9 & 10. PORTFOLIO BEHAVIOUR + MARKET CAP ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Asset Allocation Donut */}
        <AssetAllocationChart
          assetAllocation={overviewHoldings?.asset_allocation ?? null}
        />

        {/* Portfolio Behaviour + Market Cap (2-col panel, spans 2 cols) */}
        <div className="lg:col-span-2">
          <PortfolioStatsPanel
            volatility3y={riskStat?.volatility_cm_3year ?? scheme?.risk_metrics?.std_dev_3y}
            volatility5y={scheme?.risk_metrics?.std_dev_5y}
            sharpeRatio3y={riskStat?.sharpratio_cm_3year ?? scheme?.risk_metrics?.sharpe_3y}
            sharpeRatio5y={scheme?.risk_metrics?.sharpe_5y}
            alpha1y={riskStat?.alpha_cm_1year ?? scheme?.risk_metrics?.alpha_1y}
            alpha3y={scheme?.risk_metrics?.alpha_3y}
            alpha5y={scheme?.risk_metrics?.alpha_5y}
            beta1y={riskStat?.beta_cm_1year ?? scheme?.risk_metrics?.beta_1y}
            beta3y={scheme?.risk_metrics?.beta_3y}
            beta5y={scheme?.risk_metrics?.beta_5y}
            sortino={riskStat?.shortino_ratio ?? scheme?.risk_metrics?.sortino}
            ytm={riskStat?.yield_to_maturity ?? scheme?.risk_metrics?.yield_to_maturity}
            avgMaturity={riskStat?.average_maturity ?? scheme?.risk_metrics?.average_maturity}
            maxDrawdown5y={scheme?.risk_metrics?.max_drawdown_5y}
            maxDrawdown10y={scheme?.risk_metrics?.max_drawdown_10y}
            turnoverRatio={scheme?.risk_metrics?.turnover_ratio}
            upmarketCapture={rawData?.upmarket_capture_ratio}
            downmarketCapture={rawData?.downmarket_capture_ratio}
            marketCapLargecapPct={rawData?.market_cap_largecap_percent ?? scheme?.market_cap?.large_cap_pct}
            marketCapMidcapPct={rawData?.market_cap_midcap_percent ?? scheme?.market_cap?.mid_cap_pct}
            marketCapSmallcapPct={rawData?.market_cap_smallcap_percent ?? scheme?.market_cap?.small_cap_pct}
          />
        </div>
      </div>

      {/* ── 11. PEER COMPARISON ───────────────────────────────────────────── */}
      <PeerComparisonTable peers={peerList} />

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ADMIN SECTIONS (collapsible — not part of factsheet view) */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* Manual Fund Link */}
      <AdminSection title="Manual Fund Link Status">
        {linkedManualFund ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-sm">✓</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Linked to: <span className="text-[#043f79]">{linkedManualFund.fund_name}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Current NAV: ₹{formatNumber(linkedManualFund.nav_Current)}{" "}
                  {linkedManualFund.nav_date ? `(as of ${fmtDate(linkedManualFund.nav_date)})` : ""}
                  {linkedManualFund.mf_api_synced_at && ` • Last bridge sync: ${formatDateTime(linkedManualFund.mf_api_synced_at)}`}
                </p>
              </div>
            </div>
            <a
              href={`/${role}/mf/funds/edit/${linkedManualFund._id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#043f79] border border-[#043f79]/30 rounded-md px-3 py-1.5 hover:bg-[#043f79]/5 transition-colors"
            >
              Edit Manual Fund
            </a>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-sm">!</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 text-amber-800">Not Linked Yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Use the button below to sync or repair the manual fund bridge for this scheme.
                </p>
              </div>
            </div>
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
      </AdminSection>

      {/* Top Holdings Import */}
      <AdminSection title="Holdings Import (Admin)">
        <TopHoldingsAdmin role={role} id={id} scheme={scheme} />
      </AdminSection>

      {/* Sync History */}
      <AdminSection title="Sync History">
        <div className="overflow-auto">
          {Array.isArray((scheme as any)?.syncHistory) && (scheme as any).syncHistory.length > 0 ? (
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
                    <td className="py-3 px-4 whitespace-nowrap">{formatDateTime(log.createdAt || log.created_at)}</td>
                    <td className="py-3 px-4 uppercase">{log.action}</td>
                    <td className="py-3 px-4"><StatusPill status={log.status} /></td>
                    <td className="py-3 px-4">{log.message || log.error || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No sync history available.</p>
          )}
        </div>
      </AdminSection>

      {/* Raw API Data */}
      <AdminSection title="Raw API Data">
        <div className="rounded-lg bg-gray-900 p-4 overflow-auto max-h-96">
          <pre className="text-xs text-green-400 font-mono">
            {JSON.stringify(rawPayload, null, 2)}
          </pre>
        </div>
      </AdminSection>

    </div>
  );
}





