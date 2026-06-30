import { useState } from "react";
import { fmtCrore, fmtDate, riskColor } from "./MfApiSchemeViewTypes";

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
}: SchemeHeroCardProps) {
  const [isExitLoadExpanded, setIsExitLoadExpanded] = useState(false);
  const shouldTruncateExitLoad = exitLoad != null && exitLoad.length > 150;

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

  // ── Risk badge colors & gauge ──────────────────────────────────────────────
  const colors = riskColor(riskometer);

  const riskStr = (riskometer || "").toLowerCase().trim();
  let gaugeLevel = -1;
  if (riskStr.includes("very high")) gaugeLevel = 4;
  else if (riskStr === "high" || riskStr.includes("high risk")) gaugeLevel = 3;
  else if (riskStr.includes("moderately high")) gaugeLevel = 2;
  else if (riskStr.includes("moderate")) gaugeLevel = 1;
  else if (riskStr.includes("low")) gaugeLevel = 0;

  const showGauge = gaugeLevel !== -1;
  const gaugeColors = ["#22c55e", "#eab308", "#f97316", "#ea580c", "#ef4444"];
  const getGaugePath = (startAngle: number, sweep: number) => {
    const startRad = (Math.PI / 180) * (180 - startAngle);
    const endRad = (Math.PI / 180) * (180 - (startAngle + sweep));
    const cx = 20, cy = 20, r = 16;
    return `M ${(cx + r * Math.cos(startRad)).toFixed(2)} ${(cy - r * Math.sin(startRad)).toFixed(2)} A ${r} ${r} 0 0 1 ${(cx + r * Math.cos(endRad)).toFixed(2)} ${(cy - r * Math.sin(endRad)).toFixed(2)}`;
  };

  // ── Benchmark truncation ───────────────────────────────────────────────────
  const benchmarkLabel =
    benchmark && benchmark.length > 45
      ? benchmark.slice(0, 45) + "…"
      : benchmark;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* ── PART A: Top strip ─────────────────────────────────────────────── */}
      <div className="px-6 py-5 flex flex-col md:flex-row items-start justify-between gap-6">

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

          {/* Subtitle row combining Category + Benchmark + AUM */}
          <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {category && <span className="font-semibold text-[#043F79]">{category}</span>}
            {category && benchmark && <span className="text-slate-300">•</span>}
            {benchmark && <span>Benchmark: {benchmark}</span>}
            {(category || benchmark) && schemeAssets != null && <span className="text-slate-300">•</span>}
            {schemeAssets != null && (
              <span>
                AUM: {fmtCrore(schemeAssets)}
                {schemeAssetDate ? ` (as on ${fmtDate(schemeAssetDate)})` : ""}
              </span>
            )}
            {planType && (
              <>
                <span className="text-slate-300">•</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium">{planType}</span>
              </>
            )}
            {optionType && (
              <>
                <span className="text-slate-300">•</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium">{optionType}</span>
              </>
            )}
          </div>

          {/* Fund Manager */}
          <p className="text-xs text-gray-500 mt-2">
            Fund Manager: {schemeManager || "—"}
          </p>
        </div>

        {/* RIGHT COLUMN */}
        <div className="text-left md:text-right min-w-[160px] md:flex-shrink-0 w-full md:w-auto border-t border-gray-100 md:border-none pt-4 md:pt-0">
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
            <div className="mt-2 flex md:justify-end">
              <span className="bg-amber-50 text-amber-700 text-xs font-semibold rounded-full px-2.5 py-0.5">
                ⭐ {rating}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── PART B: Bottom strip ──────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        {/* LEFT: Risk + ISIN + Code */}
        <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3">
          {showGauge ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
              <svg width="28" height="16" viewBox="0 0 40 24" className="overflow-visible block">
                {gaugeColors.map((color, i) => (
                  <path
                    key={i}
                    d={getGaugePath(i * 36, 36)}
                    stroke={color}
                    strokeWidth="6"
                    fill="none"
                  />
                 ))}
                <g transform={`rotate(${-90 + (gaugeLevel * 36 + 18)} 20 20)`}>
                  <path d="M 18.5 20 L 20 6 L 21.5 20 Z" fill="#374151" />
                  <circle cx="20" cy="20" r="2.5" fill="#374151" />
                </g>
              </svg>
              Risk: {riskometer}
            </span>
          ) : (
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
          )}

          <span className="text-xs text-gray-400 sm:ml-4">
            ISIN: {isin || "—"}
          </span>

          <span className="text-xs text-gray-400 sm:ml-3">
            Code: {schemeCode || "—"}
          </span>
        </div>
      </div>

      {/* ── Exit Load (below Part B, only if present) ─────────────────────── */}
      {exitLoad && (
        <div className="bg-amber-50/70 border-t border-amber-100 px-5 py-3.5 text-xs text-amber-800">
          <span className="font-bold uppercase tracking-wider text-[10px] text-amber-900 block mb-1">Exit Load</span>
          <p className="leading-relaxed">
            {shouldTruncateExitLoad && !isExitLoadExpanded
              ? exitLoad.slice(0, 150) + "..."
              : exitLoad}
            {shouldTruncateExitLoad && (
              <button
                onClick={() => setIsExitLoadExpanded(!isExitLoadExpanded)}
                className="ml-2 font-bold text-[#043F79] hover:underline cursor-pointer focus:outline-none"
              >
                {isExitLoadExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
