import { fmtCrore } from "./MfApiSchemeViewTypes";
import { fmtPct } from "./formatters";

interface PortfolioStatsPanelProps {
  // Market cap from API root level
  marketCapLargecapPct?: number | null;
  marketCapMidcapPct?: number | null;
  marketCapSmallcapPct?: number | null;

  // Risk statistics from risk_statistics_list[0]
  volatility3y?: number | null;
  volatility5y?: number | null;
  sharpeRatio3y?: number | null;
  sharpeRatio5y?: number | null;
  alpha1y?: number | null;
  alpha3y?: number | null;
  alpha5y?: number | null;
  beta1y?: number | null;
  beta3y?: number | null;
  beta5y?: number | null;
  sortino?: number | null;
  ytm?: number | null;
  avgMaturity?: number | null;
  maxDrawdown5y?: number | null;
  maxDrawdown10y?: number | null;
  turnoverRatio?: number | null;

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
  volatility5y,
  sharpeRatio3y,
  sharpeRatio5y,
  alpha1y,
  alpha3y,
  alpha5y,
  beta1y,
  beta3y,
  beta5y,
  sortino,
  ytm,
  avgMaturity,
  maxDrawdown5y,
  maxDrawdown10y,
  turnoverRatio,
  upmarketCapture,
  downmarketCapture,
  assetAllocation,
}: PortfolioStatsPanelProps) {

  // ── Panel arrays ──────────────────────────────────────────────────────────
  const riskMetrics = [
    { label: "Alpha (1Y)",         val: alpha1y,           suffix: "%"    },
    { label: "Alpha (3Y)",         val: alpha3y,           suffix: "%"    },
    { label: "Alpha (5Y)",         val: alpha5y,           suffix: "%"    },
    { label: "Beta (1Y)",          val: beta1y,            suffix: ""     },
    { label: "Beta (3Y)",          val: beta3y,            suffix: ""     },
    { label: "Beta (5Y)",          val: beta5y,            suffix: ""     },
    { label: "Sharpe Ratio (3Y)",  val: sharpeRatio3y,     suffix: ""     },
    { label: "Sharpe Ratio (5Y)",  val: sharpeRatio5y,     suffix: ""     },
    { label: "Std Deviation (3Y)", val: volatility3y,      suffix: "%"    },
    { label: "Std Deviation (5Y)", val: volatility5y,      suffix: "%"    },
    { label: "Max Drawdown (5Y)",  val: maxDrawdown5y,     suffix: "%"    },
    { label: "Max Drawdown (10Y)", val: maxDrawdown10y,    suffix: "%"    },
    { label: "Sortino Ratio",      val: sortino,           suffix: ""     },
  ].filter(r => r.val != null);

  const portfolioMetrics = [
    { label: "Yield to Maturity (YTM)", val: ytm,               suffix: "%"    },
    { label: "Avg Maturity",            val: avgMaturity,       suffix: " yrs" },
    { label: "Turnover Ratio",          val: turnoverRatio,     suffix: "%"    },
    { label: "Upmarket Capture",        val: upmarketCapture,   suffix: "%"    },
    { label: "Downmarket Capture",      val: downmarketCapture, suffix: "%"    },
  ].filter(r => r.val != null);

  const mcap = [
    { label: "Large Cap", val: marketCapLargecapPct, color: "bg-blue-600",   hex: "#2563eb" },
    { label: "Mid Cap",   val: marketCapMidcapPct,   color: "bg-purple-500", hex: "#a855f7" },
    { label: "Small Cap", val: marketCapSmallcapPct, color: "bg-amber-500",  hex: "#f59e0b" },
  ];

  const allMcapNull = mcap.every((m) => m.val == null);

  return (
    <div>
      <h2 className="text-base font-bold tracking-tight text-slate-800 mb-4">
        Portfolio Dynamics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Risk Metrics */}
        <div>
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider pb-1.5 mb-3 border-b border-slate-100 block">
            Risk Metrics
          </span>
          {riskMetrics.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">No risk metrics available</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {riskMetrics.map(({ label, val, suffix }) => (
                <div key={label} className="flex items-center justify-between py-2 text-xs">
                  <span className="text-slate-500 font-medium">{label}</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {val != null ? `${val.toFixed(2)}${suffix}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Market Cap & Portfolio/Duration */}
        <div className="space-y-6">
          {/* Market Cap */}
          {!allMcapNull && (
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider pb-1.5 mb-3 border-b border-slate-100 block">
                Market Cap Distribution
              </span>
              <div className="space-y-2">
                {mcap.map(({ label, val, color }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-slate-500 font-medium">{label}</span>
                    </div>
                    <span className="font-bold text-slate-800 tabular-nums">
                      {fmtPct(val)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stacked bar */}
              <div className="mt-4 h-2 rounded-full overflow-hidden flex bg-slate-100">
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
            </div>
          )}

          {/* Duration & Portfolio Metrics */}
          {portfolioMetrics.length > 0 && (
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider pb-1.5 mb-3 border-b border-slate-100 block">
                Portfolio & Duration
              </span>
              <div className="divide-y divide-slate-50">
                {portfolioMetrics.map(({ label, val, suffix }) => (
                  <div key={label} className="flex items-center justify-between py-2 text-xs">
                    <span className="text-slate-500 font-medium">{label}</span>
                    <span className="font-bold text-slate-800 tabular-nums">
                      {val != null ? `${val.toFixed(2)}${suffix}` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
