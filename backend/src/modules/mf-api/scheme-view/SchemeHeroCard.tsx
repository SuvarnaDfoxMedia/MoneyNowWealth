import { fmtCrore, fmtDate, riskColor } from "./MfApiSchemeViewTypes";
import StatusPill from "../components/StatusPill";

interface SchemeHeroCardProps {
  schemeName?: string;
  amcName?: string;
  category?: string;
  benchmark?: string;
  planType?: string;
  optionType?: string;
  schemeAssets?: number | null;
  schemeAssetDate?: string | null;
  schemeManager?: string | null;
  exitLoad?: string | null;
  nav?: number | null;
  navDate?: string | null;
  navChange?: number | null;
  navChangePct?: number | null;
  riskometer?: string | null;
  rating?: string | null;
  ratingValue?: number | null;
  isin?: string | null;
  schemeCode?: string | null;
  syncStatus?: string;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export default function SchemeHeroCard({
  schemeName,
  amcName,
  category,
  benchmark,
  planType,
  optionType,
  schemeAssets,
  schemeAssetDate,
  schemeManager,
  exitLoad,
  nav,
  navDate,
  navChange,
  navChangePct,
  riskometer,
  rating,
  isin,
  schemeCode,
  syncStatus,
  onSyncNow,
  isSyncing,
}: SchemeHeroCardProps) {
  // ── NAV change formatting ──────────────────────────────────────────────────
  const navChangeColor =
    navChange == null
      ? "text-gray-400"
      : navChange > 0
        ? "text-green-600"
        : navChange < 0
          ? "text-red-600"
          : "text-gray-400";

  const navChangeText =
    navChange != null
      ? (() => {
          const sign = navChange >= 0 ? "+" : "";
          const pct =
            navChangePct != null
              ? ` (${navChangePct >= 0 ? "+" : ""}${navChangePct.toFixed(4)}%)`
              : "";
          return `${sign}${navChange.toFixed(2)}${pct}`;
        })()
      : null;

  // ── Risk badge colors ──────────────────────────────────────────────────────
  const colors = riskColor(riskometer);

  // ── Benchmark truncation ───────────────────────────────────────────────────
  const benchmarkLabel =
    benchmark && benchmark.length > 45
      ? benchmark.slice(0, 45) + "…"
      : benchmark;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* ── PART A: Top strip ─────────────────────────────────────────────── */}
      <div className="px-6 py-5 flex flex-row items-start justify-between gap-6">

        {/* LEFT COLUMN */}
        <div className="flex-1 min-w-0">
          {/* AMC name */}
          {amcName && (
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {amcName}
            </p>
          )}

          {/* Scheme name */}
          <h2 className="text-2xl font-bold text-gray-900 mt-1 leading-snug">
            {schemeName || "—"}
          </h2>

          {/* Pill row */}
          <div className="flex flex-wrap gap-2 mt-2">
            {category && (
              <span className="bg-blue-50 text-blue-700 text-xs font-medium rounded-full px-3 py-0.5">
                {category}
              </span>
            )}
            {benchmarkLabel && (
              <span className="bg-purple-50 text-purple-700 text-xs rounded-full px-3 py-0.5">
                {benchmarkLabel}
              </span>
            )}
            {planType && (
              <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-3 py-0.5">
                {planType}
              </span>
            )}
            {optionType && (
              <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-3 py-0.5">
                {optionType}
              </span>
            )}
          </div>

          {/* AUM line */}
          <p className="text-xs text-gray-400 mt-2">
            AUM: {fmtCrore(schemeAssets)}
            {schemeAssetDate ? ` as on ${fmtDate(schemeAssetDate)}` : ""}
          </p>

          {/* Fund Manager */}
          <p className="text-xs text-gray-500 mt-1">
            Fund Manager: {schemeManager || "—"}
          </p>
        </div>

        {/* RIGHT COLUMN */}
        <div className="text-right min-w-[160px] flex-shrink-0">
          {/* NAV */}
          <p className="text-4xl font-black text-gray-900">
            {nav != null ? `₹${Number(nav).toFixed(2)}` : "—"}
          </p>

          {/* NAV date */}
          <p className="text-xs text-gray-400 mt-0.5">
            NAV as on {navDate || "—"}
          </p>

          {/* NAV change */}
          {navChangeText != null && (
            <p className={`text-sm font-medium mt-1 ${navChangeColor}`}>
              {navChangeText}
            </p>
          )}

          {/* Rating badge */}
          {rating && (
            <div className="mt-2 flex justify-end">
              <span className="bg-amber-50 text-amber-700 text-xs font-semibold rounded-full px-2.5 py-0.5">
                ⭐ {rating}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── PART B: Bottom strip ──────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex flex-row items-center justify-between flex-wrap gap-3">

        {/* LEFT: Risk + ISIN + Code */}
        <div className="flex items-center flex-wrap gap-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Risk: {riskometer || "—"}
          </span>

          <span className="ml-4 text-xs text-gray-400">
            ISIN: {isin || "—"}
          </span>

          <span className="ml-3 text-xs text-gray-400">
            Code: {schemeCode || "—"}
          </span>
        </div>

        {/* RIGHT: Sync status + Sync Now button */}
        <div className="flex items-center gap-2">
          <StatusPill status={syncStatus || "queued"} />

          {onSyncNow && (
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="rounded-lg bg-[#043f79] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60 hover:bg-[#032d58] transition-colors"
            >
              {isSyncing ? "Syncing…" : "Sync Now"}
            </button>
          )}
        </div>
      </div>

      {/* ── Exit Load (below Part B, only if present) ─────────────────────── */}
      {exitLoad && (
        <div className="bg-amber-50 border border-amber-100 px-5 py-3 text-xs text-amber-800">
          <span className="font-semibold">Exit Load: </span>
          {exitLoad.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
