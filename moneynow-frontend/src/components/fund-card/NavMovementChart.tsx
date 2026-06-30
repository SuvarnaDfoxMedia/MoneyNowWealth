import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { MfApiNavHistoryEntry } from "./MfApiSchemeViewTypes";

const NAV_PERIODS = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "2Y", days: 730 },
  { label: "3Y", days: 1095 },
  { label: "5Y", days: 1825 },
  { label: "10Y", days: 3650 },
];

interface NavMovementChartProps {
  history: MfApiNavHistoryEntry[];
  isLoading?: boolean;
  onPeriodChange: (days: number) => void;
  selectedDays: number;
  currentNav?: number | null;
  navDate?: string | null;
}

function fmtDateShort(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function returnColorClass(value: number | null | undefined): string {
  if (value == null) return "text-gray-400";
  if (value > 0) return "text-green-600 font-medium";
  if (value < 0) return "text-red-600 font-medium";
  return "text-gray-600";
}

export default function NavMovementChart({
  history,
  isLoading,
  onPeriodChange,
  selectedDays,
  currentNav,
  navDate,
}: NavMovementChartProps) {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const selectedPeriodLabel =
    NAV_PERIODS.find((period) => period.days === selectedDays)?.label ??
    `${selectedDays}D`;

  useEffect(() => {
    setShowAllHistory(false);
  }, [selectedDays, history.length]);

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
      ),
    [history],
  );

  const recentRows = useMemo(() => {
    const latestFirst = [...sortedHistory].reverse();
    return showAllHistory ? latestFirst : latestFirst.slice(0, 5);
  }, [sortedHistory, showAllHistory]);

  const chartSeries = useMemo(
    () => [
      {
        name: "NAV",
        data: sortedHistory.map((row) => ({
          x: new Date(row.date).getTime(),
          y: row.nav,
        })),
      },
    ],
    [sortedHistory],
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
        gradient: { opacityFrom: 0.24, opacityTo: 0.03 },
      },
      dataLabels: { enabled: false },
      markers: { size: sortedHistory.length === 1 ? 4 : 0, hover: { size: 6 } },
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
          formatter: (value: number) => `₹${value.toFixed(2)}`,
        },
      },
      grid: {
        borderColor: "#F3F4F6",
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      tooltip: {
        x: { format: "dd MMM yyyy" },
        y: { formatter: (value: number) => `₹${value.toFixed(4)}` },
      },
    }),
    [sortedHistory.length],
  );

  const hasMoreThanFive = sortedHistory.length > 5;
  const visibleCount = showAllHistory ? sortedHistory.length : Math.min(5, sortedHistory.length);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              NAV Movement
            </h2>
            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              {selectedPeriodLabel}
            </span>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Historical NAV trend with the latest records listed below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasMoreThanFive && (
            <button
              type="button"
              onClick={() => setShowAllHistory((value) => !value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {showAllHistory ? "Show less" : "View all"}
            </button>
          )}
          {NAV_PERIODS.map(({ label, days }) => (
            <button
              key={label}
              type="button"
              onClick={() => onPeriodChange(days)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedDays === days
                  ? "bg-[#043f79] text-white shadow-sm"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center px-4 text-sm text-slate-400">
          <svg className="mr-2 h-5 w-5 animate-spin text-[#043f79]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading NAV history...
        </div>
      ) : sortedHistory.length > 0 ? (
        <>
          <div className="px-2 pb-1 pt-2 sm:px-3">
            <Chart options={chartOptions} series={chartSeries} type="area" height={280} />
          </div>

          <div className="border-t border-slate-100">
            <div className="flex items-center justify-between px-4 py-3 sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recent NAV Records
              </p>
              <p className="text-[11px] text-slate-400">
                Showing {visibleCount} of {sortedHistory.length}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="px-4 py-2.5 text-left font-medium sm:px-5">Date</th>
                    <th className="px-4 py-2.5 text-right font-medium sm:px-5">NAV (₹)</th>
                    <th className="px-4 py-2.5 text-right font-medium sm:px-5">Change</th>
                    <th className="px-4 py-2.5 text-right font-medium sm:px-5">Change %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentRows.map((row) => (
                    <tr key={row._id || `${row.date}-${row.nav}`} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-700 sm:px-5">{fmtDateShort(row.date)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 sm:px-5">
                        {row.nav.toFixed(4)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums sm:px-5 ${returnColorClass(row.nav_change)}`}>
                        {row.nav_change != null ? row.nav_change.toFixed(4) : "—"}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums sm:px-5 ${returnColorClass(row.nav_change_pct)}`}>
                        {row.nav_change_pct != null ? `${row.nav_change_pct.toFixed(2)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"
            />
          </svg>
          <p className="text-sm font-medium text-slate-700">NAV history is being built</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Check back later for historical data.
          </p>
          {currentNav != null && (
            <p className="mt-3 text-xs font-medium text-slate-600">
              Current NAV: <span className="font-bold text-[#043f79]">₹{Number(currentNav).toFixed(4)}</span>
              {navDate && <span className="ml-1 text-slate-400">as of {fmtDateShort(navDate)}</span>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
