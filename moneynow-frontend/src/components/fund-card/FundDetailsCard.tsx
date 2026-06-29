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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Fund Details
        </h2>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100">
        {cells.map(({ label, value, valueClass, subtext, isRisk }) => (
          <div className="bg-white px-4 py-4" key={label}>
            <p className="text-xs font-medium text-gray-400">{label}</p>
            {isRisk ? (
              <span
                className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${riskColor(riskStatus).bg} ${riskColor(riskStatus).text}`}
              >
                {value}
              </span>
            ) : (
              <>
                <p className={`mt-1 text-sm font-bold ${valueClass ?? "text-gray-900"}`}>
                  {value}
                </p>
                {subtext && (
                  <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Optional: Upmarket / Downmarket Capture ─────────────────────────── */}
      {showCaptureRow && (
        <div className="grid grid-cols-2 gap-px bg-gray-100">
          <div className="bg-white px-4 py-4">
            <p className="text-xs font-medium text-gray-400">Upmarket Capture</p>
            <p className="mt-1 text-sm font-bold text-gray-900">
              {upmarketCapture != null
                ? `${upmarketCapture.toFixed(0)}%`
                : "—"}
            </p>
          </div>
          <div className="bg-white px-4 py-4">
            <p className="text-xs font-medium text-gray-400">Downmarket Capture</p>
            <p className="mt-1 text-sm font-bold text-gray-900">
              {downmarketCapture != null
                ? `${downmarketCapture.toFixed(0)}%`
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* ── Optional: Portfolio Turnover ──────────────────────────────────────── */}
      {schemeTurnover && (
        <p className="text-xs text-gray-500 px-4 py-3 border-t border-gray-100">
          Portfolio Turnover: {schemeTurnover}
        </p>
      )}

      {/* ── Optional: Investment Objective ────────────────────────────────────── */}
      {schemeObjective && (
        <div className="bg-blue-50 border-t border-blue-100 px-5 py-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">
            Investment Objective
          </p>
          <p className="text-xs text-blue-600 leading-relaxed">
            {schemeObjective}
          </p>
        </div>
      )}
    </div>
  );
}
