import { fmtCrore } from "./MfApiSchemeViewTypes";

interface PortfolioStatsPanelProps {
  // Market cap from API root level
  marketCapLargecapPct?: number | null;
  marketCapMidcapPct?: number | null;
  marketCapSmallcapPct?: number | null;

  // Risk statistics from risk_statistics_list[0]
  volatility3y?: number | null;
  sharpeRatio3y?: number | null;
  alpha1y?: number | null;
  beta1y?: number | null;
  sortino?: number | null;
  ytm?: number | null;
  avgMaturity?: number | null;

  // Capture ratios from root level
  upmarketCapture?: number | null;
  downmarketCapture?: number | null;

  // Asset allocation from top holdings (optional, may be null)
  assetAllocation?: {
    domestic_equity_pct?: number | null;
    international_equity_pct?: number | null;
    debt_pct?: number | null;
    other_pct?: number | null;
    gold_pct?: number | null;
    cash_pct?: number | null;
  } | null;
}

export default function PortfolioStatsPanel({
  marketCapLargecapPct,
  marketCapMidcapPct,
  marketCapSmallcapPct,
  volatility3y,
  sharpeRatio3y,
  alpha1y,
  beta1y,
  sortino,
  ytm,
  avgMaturity,
  upmarketCapture,
  downmarketCapture,
  assetAllocation,
}: PortfolioStatsPanelProps) {

  // ── Panel 1: Asset Allocation items ───────────────────────────────────────
  const assetItems = [
    { label: "Equity",       val: assetAllocation?.domestic_equity_pct,      color: "#3b82f6" },
    { label: "Intl. Equity", val: assetAllocation?.international_equity_pct, color: "#6366f1" },
    { label: "Debt",         val: assetAllocation?.debt_pct,                 color: "#8b5cf6" },
    { label: "Cash",         val: assetAllocation?.cash_pct,                 color: "#10b981" },
    { label: "Gold",         val: assetAllocation?.gold_pct,                 color: "#f59e0b" },
    { label: "Others",       val: assetAllocation?.other_pct,                color: "#9ca3af" },
  ].filter((item) => item.val != null);

  // ── Panel 2: Risk / behaviour rows ────────────────────────────────────────
  const riskRows: Array<{ label: string; val: number | null | undefined; suffix: string }> = [
    { label: "Sharpe Ratio (3Y)",  val: sharpeRatio3y,    suffix: ""     },
    { label: "Alpha (1Y)",         val: alpha1y,           suffix: "%"    },
    { label: "Beta (1Y)",          val: beta1y,            suffix: ""     },
    { label: "Std Deviation (3Y)", val: volatility3y,      suffix: "%"    },
    { label: "Sortino Ratio",      val: sortino,           suffix: ""     },
    { label: "Yield to Maturity",  val: ytm,               suffix: "%"    },
    { label: "Avg Maturity",       val: avgMaturity,       suffix: " yrs" },
    { label: "Upmarket Capture",   val: upmarketCapture,   suffix: "%"    },
    { label: "Downmarket Capture", val: downmarketCapture, suffix: "%"    },
  ];

  // ── Panel 3: Market cap items ──────────────────────────────────────────────
  const mcap = [
    { label: "Large Cap", val: marketCapLargecapPct, color: "bg-blue-600",   hex: "#2563eb" },
    { label: "Mid Cap",   val: marketCapMidcapPct,   color: "bg-purple-500", hex: "#a855f7" },
    { label: "Small Cap", val: marketCapSmallcapPct, color: "bg-amber-500",  hex: "#f59e0b" },
  ];

  const allMcapNull = mcap.every((m) => m.val == null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* ── PANEL 1: Asset Allocation ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-bold text-gray-700">Asset Allocation</h3>
        </div>
        <div className="px-4 py-3 space-y-3">
          {assetItems.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-4 text-center">
              Asset allocation data is available after importing Top Holdings.
            </p>
          ) : (
            assetItems.map(({ label, val, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-24 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(val!, 100)}%`, background: color }}
                    className="h-full rounded-full"
                  />
                </div>
                <span className="text-xs font-semibold text-gray-900 w-10 text-right">
                  {val!.toFixed(1)}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── PANEL 2: Portfolio Behaviour ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-bold text-gray-700">Portfolio Behaviour</h3>
        </div>
        <div>
          {riskRows.map(({ label, val, suffix }) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0"
            >
              <span className="text-xs text-gray-500">{label}</span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  val != null ? "text-gray-900" : "text-gray-300"
                }`}
              >
                {val != null ? `${val.toFixed(2)}${suffix}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PANEL 3: Market Cap Distribution ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-bold text-gray-700">Market Cap Distribution</h3>
        </div>

        {allMcapNull ? (
          <p className="text-gray-400 text-xs text-center py-8">—</p>
        ) : (
          <>
            {mcap.map(({ label, val, color }) => (
              <div
                key={label}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {val != null ? `${val.toFixed(2)}%` : "—"}
                </span>
              </div>
            ))}

            {/* Stacked bar */}
            <div className="mt-4 mx-4 mb-4 h-2.5 rounded-full overflow-hidden flex">
              {mcap
                .filter((m) => m.val != null)
                .map((m) => (
                  <div
                    key={m.label}
                    style={{ width: `${m.val!}%`, background: m.hex }}
                    className="h-full"
                    title={`${m.label}: ${m.val!.toFixed(1)}%`}
                  />
                ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
