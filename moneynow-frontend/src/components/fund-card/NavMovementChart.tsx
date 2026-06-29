import { useState, useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { MfApiNavHistoryEntry } from "./MfApiSchemeViewTypes";

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_PERIODS = [
  { label: "1M",  days: 30   },
  { label: "3M",  days: 90   },
  { label: "6M",  days: 180  },
  { label: "1Y",  days: 365  },
  { label: "2Y",  days: 730  },
  { label: "3Y",  days: 1095 },
  { label: "5Y",  days: 1825 },
  { label: "10Y", days: 3650 },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface NavMovementChartProps {
  /** Pass the raw history array directly — no additional API call is made */
  history: MfApiNavHistoryEntry[];
  isLoading?: boolean;
  /** Callback so the parent can change the requested `days` and re-fetch */
  onPeriodChange: (days: number) => void;
  selectedDays: number;
  currentNav?: number | null;
  navDate?: string | null;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function fmtDateShort(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return d;
  }
}

function returnColorClass(val: number | null | undefined): string {
  if (val == null) return "text-gray-400";
  if (val > 0) return "text-green-600 font-medium";
  if (val < 0) return "text-red-600 font-medium";
  return "text-gray-600";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NavMovementChart({
  history,
  isLoading,
  onPeriodChange,
  selectedDays,
  currentNav,
  navDate,
}: NavMovementChartProps) {
  const recentRows = useMemo(
    () => [...history].reverse().slice(0, 10),
    [history]
  );

  // ── Chart config ────────────────────────────────────────────────────────────
  const chartSeries = useMemo(
    () => [
      {
        name: "NAV",
        data: history.map((h) => ({
          x: new Date(h.date).getTime(),
          y: h.nav,
        })),
      },
    ],
    [history]
  );

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        height: 280,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "Inter, sans-serif",
        animations: { enabled: true, easing: "easeinout", speed: 400 },
      },
      colors: ["#043f79"],
      stroke: { curve: "smooth", width: 2 },
      fill: {
        type: "gradient",
        gradient: { opacityFrom: 0.25, opacityTo: 0.02 },
      },
      dataLabels: { enabled: false },
      markers: { size: history.length === 1 ? 4 : 0, hover: { size: 6 } },
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
    }),
    []
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            NAV Movement
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Historical NAV trend</p>
        </div>

        {/* Period buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {NAV_PERIODS.map(({ label, days }) => (
            <button
              key={label}
              onClick={() => onPeriodChange(days)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                selectedDays === days
                  ? "bg-[#043f79] text-white"
                  : "border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart area ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          <svg className="animate-spin w-5 h-5 mr-2 text-[#043f79]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
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
          <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
          </svg>
          <p className="text-sm font-medium text-gray-700 mb-1">NAV history is being built</p>
          <p className="mt-2 text-xs text-slate-400">
            Check back later for historical data.
          </p>
          {currentNav != null && (
            <p className="text-xs font-medium text-gray-600">
              Current NAV:{" "}
              <span className="text-[#043f79] font-bold">₹{Number(currentNav).toFixed(4)}</span>
              {navDate && (
                <span className="text-gray-400 ml-1">as of {fmtDateShort(navDate)}</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* ── Recent NAV records table ─────────────────────────────────────────── */}
      {recentRows.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recent NAV Records
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 px-4 text-left font-medium">Date</th>
                  <th className="py-2 px-4 text-right font-medium">NAV (₹)</th>
                  <th className="py-2 px-4 text-right font-medium">Change</th>
                  <th className="py-2 px-4 text-right font-medium">Change %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRows.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4 text-gray-700">{fmtDateShort(row.date)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900">
                      {row.nav.toFixed(4)}
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
