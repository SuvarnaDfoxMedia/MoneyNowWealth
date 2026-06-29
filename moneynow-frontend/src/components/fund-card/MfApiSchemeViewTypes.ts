export type MfApiNavHistoryEntry = {
  _id?: string;
  date: string;
  nav: number;
  nav_change?: number | null;
  nav_change_pct?: number | null;
};

export type MfApiTopHoldingEntry = {
  name?: string;
  net_assets_pct?: number | null;
  market_value?: number | null;
  sector?: string;
  security_type?: string;
  maturity?: string;
  credit_quality_india?: string;
  country?: string;
};

export interface SchemePerformanceRow {
  scheme_name: string;
  one_week_return?: number | null;
  one_month_return?: number | null;
  three_month_return?: number | null;
  six_month_return?: number | null;
  one_year_return?: number | null;
  two_year_return?: number | null;
  three_year_return?: number | null;
  five_year_return?: number | null;
  ten_year_return?: number | null;
  inception_year_return?: number | null;
  ytd_return?: number | null;
  scheme_assets?: number | null;
  expense_ratio_percentage?: number | null;
  rating?: string | null;
  rating_value?: number | null;
}

export interface RiskStatisticsRow {
  scheme_category?: string;
  volatility_cm_3year?: number | null;
  sharpratio_cm_3year?: number | null;
  alpha_cm_1year?: number | null;
  beta_cm_1year?: number | null;
  yield_to_maturity?: number | null;
  average_maturity?: number | null;
  shortino_ratio?: number | null;
}

export interface PeerComparisonRow {
  scheme_name?: string;
  scheme_inception_date_string?: string;
  one_week_return?: number | null;
  one_month_return?: number | null;
  three_month_return?: number | null;
  six_month_return?: number | null;
  one_year_return?: number | null;
  two_year_return?: number | null;
  three_year_return?: number | null;
  five_year_return?: number | null;
  ten_year_return?: number | null;
  inception_year_return?: number | null;
  ytd_return?: number | null;
  scheme_assets?: number | null;
  expense_ratio_percentage?: number | null;
  rating?: string | null;
  rating_value?: number | null;
}

// This describes what scheme_performance_list rows look like:
// Row 0 = Fund itself
// Row 1 = Benchmark
// Row 2 = Category Average
// All rows share the same period fields — we derive columns dynamically.

// ─── Period config ────────────────────────────────────────────────────────────
// This is the ORDERED list of all possible return periods.
// We iterate this list against each row's actual fields to build columns.
// If a period field is null/undefined for ALL rows, that column is hidden.
// If a new period is added to the API response in future, add it here.

export interface PeriodConfig {
  key: keyof SchemePerformanceRow;   // actual field name in API response
  label: string;                     // display label
  isLongTerm: boolean;               // true for 3Y+ → treat 0 as null
}

export const RETURN_PERIOD_CONFIG: PeriodConfig[] = [
  { key: "one_month_return",     label: "1M",  isLongTerm: false },
  { key: "three_month_return",   label: "3M",  isLongTerm: false },
  { key: "six_month_return",     label: "6M",  isLongTerm: false },
  { key: "one_year_return",      label: "1Y",  isLongTerm: false },
  { key: "two_year_return",      label: "2Y",  isLongTerm: false },
  { key: "three_year_return",    label: "3Y",  isLongTerm: true  },
  { key: "five_year_return",     label: "5Y",  isLongTerm: true  },
  { key: "ten_year_return",      label: "10Y", isLongTerm: true  },
  { key: "inception_year_return",label: "SI",  isLongTerm: true  },
  { key: "ytd_return",           label: "YTD", isLongTerm: false },
];

// Helper: given a list of performance rows, return only the periods
// that have at least one non-null value across all rows.
export function getActivePeriods(
  rows: SchemePerformanceRow[]
): PeriodConfig[] {
  return RETURN_PERIOD_CONFIG.filter((p) =>
    rows.some((row) => {
      const val = row[p.key];
      return val !== null && val !== undefined;
    })
  );
}

// Helper: format a return value for display
export function fmtReturn(
  val: number | null | undefined,
  isLongTerm = false
): string {
  if (val === null || val === undefined) return "—";
  if (isLongTerm && val === 0) return "—";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

// Helper: get Tailwind color class for a return value
export function returnColor(
  val: number | null | undefined,
  isLongTerm = false
): string {
  if (val === null || val === undefined) return "text-gray-400";
  if (isLongTerm && val === 0) return "text-gray-400";
  if (val > 0) return "text-green-600";
  if (val < 0) return "text-red-600";
  return "text-gray-500";
}

// Helper: format currency in Indian units
export function fmtCrore(val: number | null | undefined): string {
  if (val === null || val === undefined) return "—";
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

// Helper: format date string
export function fmtDate(val: string | null | undefined): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return val;
  }
}

// Helper: risk level color classes
export function riskColor(level: string | null | undefined): {
  bg: string; text: string;
} {
  const v = (level || "").toLowerCase();
  if (v.includes("very high")) return { bg: "bg-red-100",    text: "text-red-700"    };
  if (v.includes("high"))      return { bg: "bg-orange-100", text: "text-orange-700" };
  if (v.includes("moderate"))  return { bg: "bg-yellow-100", text: "text-yellow-700" };
  if (v.includes("low"))       return { bg: "bg-green-100",  text: "text-green-700"  };
  return                              { bg: "bg-gray-100",   text: "text-gray-600"   };
}

// Helper: Calculate value of ₹10,000 invested
export function valueOf10k(returnPct: number | null | undefined, years: number | null): string {
  if (returnPct === null || returnPct === undefined) return "—";
  if (years !== null && returnPct === 0) return "—"; // If long term and 0, treat as missing/invalid
  
  let value = 10000;
  if (years !== null) {
    // CAGR for multiple years
    value = 10000 * Math.pow(1 + returnPct / 100, years);
  } else {
    // Absolute return for < 1 yr or 1 yr
    value = 10000 * (1 + returnPct / 100);
  }
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
