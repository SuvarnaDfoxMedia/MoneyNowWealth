import type { MfApiTopHoldingEntry } from "./MfApiSchemeViewTypes";

interface HoldingsSplitTableProps {
  holdings: MfApiTopHoldingEntry[];
  portfolioDate?: string | null;
  holdingsCount?: number | null;
  assetsTop10Pct?: number | null;
}

const isDebt = (h: MfApiTopHoldingEntry) => {
  const t = (h.security_type || "").toLowerCase();
  return (
    t.includes("debt") ||
    t.includes("bond") ||
    t.includes("ncd") ||
    t.includes("debenture") ||
    t.includes("government") ||
    t.includes("cd") ||
    t.includes("cp") ||
    t.includes("tbill") ||
    t.includes("certificate")
  );
};

export default function HoldingsSplitTable({
  holdings,
  portfolioDate,
  holdingsCount,
  assetsTop10Pct,
}: HoldingsSplitTableProps) {
  const debtHoldings   = holdings.filter((h) => isDebt(h)).slice(0, 10);
  const equityHoldings = holdings.filter((h) => !isDebt(h)).slice(0, 10);

  // Fall back: show all holdings in equity column if both splits are empty
  const finalEquity =
    equityHoldings.length === 0 && debtHoldings.length === 0
      ? holdings.slice(0, 10)
      : equityHoldings;

  const fmtPortfolioDate = portfolioDate
    ? new Date(portfolioDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div>
      {/* ── Meta row ──────────────────────────────────────────────────────── */}
      <div className="text-xs text-gray-400 mb-3 flex gap-4 flex-wrap">
        <span>Portfolio Date: {fmtPortfolioDate}</span>
        {holdingsCount != null && (
          <span>Total Holdings: {holdingsCount}</span>
        )}
        {assetsTop10Pct != null && (
          <span>Top 10: {assetsTop10Pct.toFixed(1)}% of AUM</span>
        )}
      </div>

      {/* ── Two-column grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── LEFT: Equity Holdings ─────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-blue-700 px-4 py-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              Equity Holdings (Top 10)
            </h3>
          </div>

          {finalEquity.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 text-center italic">
              No equity holdings available
            </p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-2 px-3 text-left text-xs text-gray-400 font-medium w-6">
                    #
                  </th>
                  <th className="py-2 px-3 text-left text-xs text-gray-400 font-medium">
                    Holdings
                  </th>
                  <th className="py-2 px-3 text-right text-xs text-gray-400 font-medium w-16">
                    Assets %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {finalEquity.map((h, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 1 ? "bg-gray-50/60" : "bg-white"}
                  >
                    <td className="py-2.5 px-3 text-xs text-gray-300">{i + 1}</td>
                    <td
                      className="py-2.5 px-3 text-xs font-medium text-gray-800 max-w-[200px] truncate"
                      title={h.name}
                    >
                      {h.name || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-bold text-gray-900">
                      {h.net_assets_pct != null
                        ? `${h.net_assets_pct.toFixed(2)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── RIGHT: Debt Holdings ──────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-purple-700 px-4 py-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              Debt Holdings (Top 10)
            </h3>
          </div>

          {debtHoldings.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 text-center italic">
              No debt holdings available
            </p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-2 px-3 text-left text-xs text-gray-400 font-medium w-6">
                    #
                  </th>
                  <th className="py-2 px-3 text-left text-xs text-gray-400 font-medium">
                    Holdings
                  </th>
                  <th className="py-2 px-3 text-right text-xs text-gray-400 font-medium w-16">
                    Assets %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {debtHoldings.map((h, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 1 ? "bg-gray-50/60" : "bg-white"}
                  >
                    <td className="py-2.5 px-3 text-xs text-gray-300">{i + 1}</td>
                    <td
                      className="py-2.5 px-3 text-xs font-medium text-gray-800 max-w-[200px] truncate"
                      title={h.name}
                    >
                      {h.name || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-bold text-gray-900">
                      {h.net_assets_pct != null
                        ? `${h.net_assets_pct.toFixed(2)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
