import { useState } from "react";
import type { SchemePerformanceRow, PeriodConfig } from "./MfApiSchemeViewTypes";
import {
  RETURN_PERIOD_CONFIG,
  getActivePeriods,
  fmtReturn,
  returnColor,
  valueOf10k,
} from "./MfApiSchemeViewTypes";

interface ReturnsComparisonTableProps {
  // scheme_performance_list from API response
  // Row 0 = Fund, Row 1 = Benchmark, Row 2 = Category Avg
  // Row names come from scheme_name field
  performanceList?: SchemePerformanceRow[];
  // Optional: rank and total funds from category data
  // Not in the API — omit if not available, show "—"
  rankWithinCategory?: number | null;
  totalFundsInCategory?: number | null;
}

function truncate(str: string | undefined | null, len: number): string {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export default function ReturnsComparisonTable({
  performanceList,
  rankWithinCategory,
  totalFundsInCategory,
}: ReturnsComparisonTableProps) {
  const rows = performanceList ?? [];
  const activePeriods = getActivePeriods(rows);

  const [activePeriod, setActivePeriod] = useState<PeriodConfig>(
    activePeriods.find((p) => p.key === "one_year_return") ??
    activePeriods[0] ??
    RETURN_PERIOD_CONFIG[0],
  );

  // ── Empty state ────────────────────────────────────────────────────────────
  // Guard both: no rows at all, OR rows exist but every period value is null
  if (rows.length === 0 || activePeriods.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
        Returns data not available. Sync this scheme to populate performance data.
      </div>
    );
  }

  const fundRow       = rows[0];
  const benchmarkRow  = rows[1];
  const categoryRow   = rows[2];

  // ── Fund vs Benchmark diff for the active period ───────────────────────────
  const fundVal  = fundRow?.[activePeriod.key]  as number | null | undefined;
  const benchVal = benchmarkRow?.[activePeriod.key] as number | null | undefined;
  const diff =
    fundVal != null && benchVal != null ? fundVal - benchVal : null;

  // ── Summary card helper ────────────────────────────────────────────────────
  type SummaryCardConfig = {
    row: SchemePerformanceRow | undefined;
    borderColor: string;
    dotColor: string;
    showDiff?: boolean;
  };

  const summaryCards: SummaryCardConfig[] = [
    { row: fundRow,      borderColor: "border-l-[#043f79]", dotColor: "bg-[#043f79]", showDiff: true },
    { row: benchmarkRow, borderColor: "border-l-purple-400", dotColor: "bg-purple-400" },
    { row: categoryRow,  borderColor: "border-l-amber-400",  dotColor: "bg-amber-400" },
  ];

  return (
    <div className="space-y-4">

      {/* ── SECTION 1: Period Selector + Summary Cards ──────────────────────── */}

      {/* Period buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {activePeriods.map((period) => (
          <button
            key={period.key}
            onClick={() => setActivePeriod(period)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activePeriod.key === period.key
                ? "bg-[#043f79] text-white shadow-sm"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {summaryCards.map(({ row, borderColor, dotColor, showDiff }, idx) => {
          const val = row?.[activePeriod.key] as number | null | undefined;
          const name = truncate(row?.scheme_name, 30);

          return (
            <div
              key={idx}
              className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-l-4 ${borderColor}`}
            >
              {/* Row label */}
              <p className="text-xs text-gray-400 font-medium truncate">{name}</p>

              {/* Return value */}
              <p className={`text-2xl font-black mt-1 ${returnColor(val, activePeriod.isLongTerm)}`}>
                {fmtReturn(val, activePeriod.isLongTerm)}
              </p>

              {/* Fund vs Benchmark diff badge */}
              {showDiff && diff != null && (
                <span
                  className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    diff > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {diff > 0 ? "+" : ""}
                  {diff.toFixed(2)}% vs Benchmark
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── SECTION 2: Full Comparison Table ────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 min-w-[180px]">
                Scheme
              </th>
              {activePeriods.map((p) => (
                <th
                  key={p.key}
                  className={`py-3 px-3 text-right text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
                    p.key === activePeriod.key
                      ? "text-[#043f79] bg-blue-50"
                      : "text-gray-500"
                  }`}
                >
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={
                  rowIdx === 0
                    ? "bg-blue-50/30 font-medium"
                    : "hover:bg-gray-50"
                }
              >
                {/* Scheme name cell */}
                <td
                  className="py-3 px-4 text-sm text-gray-800 font-medium max-w-[200px] truncate"
                  title={row.scheme_name}
                >
                  {rowIdx === 0 && (
                    <span className="inline-block w-2 h-2 rounded-full bg-[#043f79] mr-2 align-middle" />
                  )}
                  {rowIdx === 1 && (
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-2 align-middle" />
                  )}
                  {rowIdx === 2 && (
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2 align-middle" />
                  )}
                  {(row.scheme_name || "—").length > 35
                    ? row.scheme_name!.slice(0, 35) + "…"
                    : row.scheme_name}
                </td>

                {/* Return period cells */}
                {activePeriods.map((p) => {
                  const val = row[p.key] as number | null | undefined;
                  const show10k = ["1Y", "3Y", "5Y", "10Y", "SI"].includes(p.label);
                  const years = p.label === "3Y" ? 3 : p.label === "5Y" ? 5 : p.label === "10Y" ? 10 : null;

                  return (
                    <td
                      key={p.key}
                      className={`py-3 px-3 text-right text-sm ${
                        p.key === activePeriod.key ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className={`tabular-nums font-medium ${returnColor(val, p.isLongTerm)}`}>
                        {fmtReturn(val, p.isLongTerm)}
                      </div>
                      {show10k && (
                        <div className="text-[11px] text-gray-400 font-normal mt-0.5 tabular-nums">
                          {valueOf10k(val, years)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
