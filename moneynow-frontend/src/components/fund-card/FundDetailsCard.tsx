import { fmtDate, fmtReturn, riskColor } from "./MfApiSchemeViewTypes";
import { fmtCurrency, fmtPct } from "./formatters";

interface FundDetailsCardProps {
  inceptionDate?: string | null;
  expenseRatio?: number | null;
  expenseRatioDate?: string | null;
  fundStatus?: string | null;
  minimumInvestment?: number | null;
  minimumTopup?: number | null;
  sipMinimum?: number | null;
  riskStatus?: string | null;
  returnsSinceInception?: number | null;
  schemeObjective?: string | null;
  schemeTurnover?: string | null;
  upmarketCapture?: number | null;
  downmarketCapture?: number | null;
}

export default function FundDetailsCard({
  inceptionDate,
  expenseRatio,
  expenseRatioDate,
  fundStatus,
  minimumInvestment,
  minimumTopup,
  sipMinimum,
  riskStatus,
  returnsSinceInception,
  schemeObjective,
  schemeTurnover,
  upmarketCapture,
  downmarketCapture,
}: FundDetailsCardProps) {
  // ── Cell definitions ───────────────────────────────────────────────────────
  const cells: Array<{
    label: string;
    value: string;
    valueClass?: string;
    subtext?: string;
    isRisk?: boolean;
  }> = [
    {
      label: "Returns Since Inception",
      value: fmtPct(returnsSinceInception),
      valueClass:
        returnsSinceInception != null
          ? returnsSinceInception > 0
            ? "text-green-600"
            : "text-red-600"
          : "text-gray-400",
    },
    {
      label: "Inception Date",
      value: fmtDate(inceptionDate),
    },
    {
      label: "Expense Ratio",
      value: fmtPct(expenseRatio),
      subtext: expenseRatioDate
        ? `as on ${fmtDate(expenseRatioDate)}`
        : undefined,
    },
    {
      label: "Fund Status",
      value: fundStatus || "—",
    },
    {
      label: "Min. Investment",
      value: fmtCurrency(minimumInvestment),
    },
    {
      label: "Min. SIP Amount",
      value: fmtCurrency(sipMinimum),
    },
    {
      label: "Min. Topup",
      value: fmtCurrency(minimumTopup),
    },
    {
      label: "Risk Status",
      value: riskStatus || "—",
      isRisk: true,
    },
  ];

  const showCaptureRow =
    upmarketCapture != null || downmarketCapture != null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <h2 className="text-base font-bold tracking-tight text-slate-800 mb-4">
        Fund Details
      </h2>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-start">
        {cells.map(({ label, value, valueClass, subtext, isRisk }) => (
          <div key={label} className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            {isRisk ? (
              <span
                className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskColor(riskStatus).bg} ${riskColor(riskStatus).text}`}
              >
                {value}
              </span>
            ) : (
              <div className="mt-1">
                <p className={`text-sm font-bold tabular-nums ${valueClass ?? "text-slate-800"}`}>
                  {value}
                </p>
                {subtext && (
                  <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>
                )}
              </div>
            )}
          </div>
        ))}

        {/* ── Optional: Upmarket / Downmarket Capture ─────────────────────────── */}
        {showCaptureRow && (
          <>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Upmarket Capture</p>
              <p className="mt-1 text-sm font-bold text-slate-800 tabular-nums">
                {upmarketCapture != null ? `${upmarketCapture.toFixed(0)}%` : "—"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Downmarket Capture</p>
              <p className="mt-1 text-sm font-bold text-slate-800 tabular-nums">
                {downmarketCapture != null ? `${downmarketCapture.toFixed(0)}%` : "—"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Optional: Portfolio Turnover ──────────────────────────────────────── */}
      {schemeTurnover && (
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Portfolio Turnover</span>
          <span className="font-bold text-slate-800 tabular-nums">{schemeTurnover}</span>
        </div>
      )}
    </div>
  );
}
