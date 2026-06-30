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
      <h2 className="text-base font-bold tracking-tight text-slate-800 mb-2">
        Portfolio Holdings
      </h2>

      {/* ── Meta row ──────────────────────────────────────────────────────── */}
      <div className="text-xs text-slate-400 mb-4 flex gap-4 flex-wrap">
        <span>Portfolio Date: {fmtPortfolioDate}</span>
        {holdingsCount != null && (
          <span>Total Holdings: {holdingsCount}</span>
        )}
        {assetsTop10Pct != null && (
          <span>Top 10: {assetsTop10Pct.toFixed(1)}% of AUM</span>
        )}
      </div>

      {/* ── Two-column grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ── LEFT: Equity Holdings ─────────────────────────────────────── */}
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-[#043f79] uppercase tracking-wider pb-1.5 mb-3 border-b border-slate-100 block">
            Equity Holdings (Top 10)
          </h3>

          {finalEquity.length === 0 ? (
            <p className="py-4 text-xs text-slate-400 text-center italic">
              No equity holdings available
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <th className="py-2 px-3 text-left w-6">
                      #
                    </th>
                    <th className="py-2 px-3 text-left">
                      Holdings
                    </th>
                    <th className="py-2 px-3 text-right w-28">
                      Assets %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {finalEquity.map((h, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-2 px-3 text-xs text-slate-400 font-medium">{i + 1}</td>
                      <td
                        className="py-2 px-3 text-xs font-medium text-slate-800 max-w-[200px] truncate"
                        title={h.name}
                      >
                        {h.name || "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-xs font-bold text-slate-900">
                        <div className="flex items-center justify-end gap-2">
                          {h.net_assets_pct != null && (
                            <div className="w-12 bg-slate-100 h-1 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="bg-[#043f79] h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, h.net_assets_pct))}%` }}
                              />
                            </div>
                          )}
                          <span className="tabular-nums">
                            {h.net_assets_pct != null
                              ? `${h.net_assets_pct.toFixed(2)}%`
                              : "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── RIGHT: Debt Holdings ──────────────────────────────────────── */}
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider pb-1.5 mb-3 border-b border-slate-100 block">
            Debt Holdings (Top 10)
          </h3>

          {debtHoldings.length === 0 ? (
            <p className="py-4 text-xs text-slate-400 text-center italic">
              No debt holdings available
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <th className="py-2 px-3 text-left w-6">
                      #
                    </th>
                    <th className="py-2 px-3 text-left">
                      Holdings
                    </th>
                    <th className="py-2 px-3 text-right w-28">
                      Assets %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {debtHoldings.map((h, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-2 px-3 text-xs text-slate-400 font-medium">{i + 1}</td>
                      <td
                        className="py-2 px-3 text-xs font-medium text-slate-800 max-w-[200px] truncate"
                        title={h.name}
                      >
                        {h.name || "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-xs font-bold text-slate-900">
                        <div className="flex items-center justify-end gap-2">
                          {h.net_assets_pct != null && (
                            <div className="w-12 bg-slate-100 h-1 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="bg-purple-600 h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, h.net_assets_pct))}%` }}
                              />
                            </div>
                          )}
                          <span className="tabular-nums">
                            {h.net_assets_pct != null
                              ? `${h.net_assets_pct.toFixed(2)}%`
                              : "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
