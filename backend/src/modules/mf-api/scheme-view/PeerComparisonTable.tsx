import type { PeerComparisonRow } from "./MfApiSchemeViewTypes";
import { fmtCrore, fmtReturn, returnColor } from "./MfApiSchemeViewTypes";

// ── Peer period config — only periods that exist in the peer list shape ────────
const PEER_PERIODS: Array<{ key: keyof PeerComparisonRow; label: string; isLongTerm: boolean }> = [
  { key: "one_week_return",       label: "1W",  isLongTerm: false },
  { key: "one_month_return",      label: "1M",  isLongTerm: false },
  { key: "three_month_return",    label: "3M",  isLongTerm: false },
  { key: "six_month_return",      label: "6M",  isLongTerm: false },
  { key: "one_year_return",       label: "1Y",  isLongTerm: false },
  { key: "two_year_return",       label: "2Y",  isLongTerm: false },
  { key: "three_year_return",     label: "3Y",  isLongTerm: true  },
  { key: "five_year_return",      label: "5Y",  isLongTerm: true  },
  { key: "ten_year_return",       label: "10Y", isLongTerm: true  },
  { key: "inception_year_return", label: "SI",  isLongTerm: true  },
  { key: "ytd_return",            label: "YTD", isLongTerm: false },
];

interface PeerComparisonTableProps {
  peers?: PeerComparisonRow[];
}

export default function PeerComparisonTable({ peers = [] }: PeerComparisonTableProps) {
  // ── Derive which period columns have at least one non-null value ─────────────
  const activePeriods = PEER_PERIODS.filter((p) =>
    peers.some((row) => {
      const v = row[p.key];
      return v !== null && v !== undefined;
    })
  );

  if (peers.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Peer Comparison
          </h2>
        </div>
        <p className="p-5 text-sm text-gray-400 text-center italic">
          No peer comparison data available. Sync this scheme to populate.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Peer Comparison
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {peers.length} funds in this category
        </p>
      </div>

      {/* ── Horizontally scrollable table ───────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-100">
              {/* Sticky scheme name column */}
              <th className="py-3 px-4 text-left sticky left-0 z-10 bg-gray-50 min-w-[200px]">
                Scheme
              </th>
              <th className="py-3 px-4 text-center">Rating</th>
              <th className="py-3 px-4 text-right">Exp. Ratio</th>
              <th className="py-3 px-4 text-right">AUM</th>
              {activePeriods.map((p) => (
                <th key={p.key} className="py-3 px-4 text-right">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {peers.map((row, idx) => (
              <tr
                key={idx}
                className={`hover:bg-gray-50 transition-colors ${
                  idx === 0 ? "bg-blue-50/40" : ""
                }`}
              >
                {/* Sticky scheme name */}
                <td
                  className={`py-3 px-4 font-medium text-gray-900 max-w-[220px] sticky left-0 z-10 truncate ${
                    idx === 0 ? "bg-blue-50/40" : "bg-white"
                  }`}
                  title={row.scheme_name}
                >
                  {row.scheme_name || "—"}
                </td>

                {/* Rating */}
                <td className="py-3 px-4 text-center">
                  {row.rating ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                      ★ {row.rating}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* Expense Ratio */}
                <td className="py-3 px-4 text-right text-gray-700">
                  {row.expense_ratio_percentage != null
                    ? `${(row.expense_ratio_percentage as number).toFixed(2)}%`
                    : "—"}
                </td>

                {/* AUM */}
                <td className="py-3 px-4 text-right text-gray-700">
                  {fmtCrore(row.scheme_assets)}
                </td>

                {/* Dynamic return columns */}
                {activePeriods.map((p) => {
                  const val = row[p.key] as number | null | undefined;
                  return (
                    <td
                      key={p.key}
                      className={`py-3 px-4 text-right tabular-nums font-medium ${returnColor(val, p.isLongTerm)}`}
                    >
                      {fmtReturn(val, p.isLongTerm)}
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
