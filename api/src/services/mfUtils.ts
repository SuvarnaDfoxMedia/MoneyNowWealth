import slugify from "slugify";

export const CATEGORY_TRAILING_KEYS = [
  "w1",
  "m1",
  "m3",
  "m6",
  "y1",
  "y3",
  "y5",
  "y10",
  "ytd",
] as const;

export const FUND_RETURN_KEYS = [
  "d1",
  "w1",
  "m1",
  "m3",
  "m6",
  "y1",
  "y3_cagr",
  "y5_cagr",
  "y10_cagr",
  "ytd",
  "since_inception",
] as const;

export const BENCHMARK_TRAILING_KEYS = [
  "d1",
  "w1",
  "m1",
  "m3",
  "m6",
  "y1",
  "y3",
  "y5",
  "y10",
  "ytd",
] as const;

const buildAnnualYears = (startYear = new Date().getFullYear() - 1, count = 10) =>
  Array.from({ length: count }, (_, index) => String(startYear - index));

export const MF_ANNUAL_YEARS = buildAnnualYears();

type NumericMap = Record<string, unknown> | Map<string, unknown> | null | undefined;

export const toNumberOrNull = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const toDateOrNull = (value: any): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const toBoolean = (value: any, defaultValue = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["yes", "true", "1"].includes(v)) return true;
    if (["no", "false", "0"].includes(v)) return false;
  }
  if (typeof value === "number") return value === 1;
  return defaultValue;
};

export const parsePagination = (query: any) => {
  const page = Math.max(Number(query?.page) || 1, 1);
  // Respect caller-provided limits so option/dropdown fetches can request
  // complete datasets when needed. Paginated tables still control their own
  // page size by sending smaller limits from the UI.
  const limit = Math.max(Number(query?.limit) || 10, 1);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildSort = (
  sortBy: any,
  sortOrder: any,
  fallback: Record<string, 1 | -1> = { created_at: -1 },
) => {
  if (!sortBy) return fallback;
  return { [String(sortBy)]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;
};

export const baseSlug = (value: string) =>
  slugify(value || "", { lower: true, strict: true, trim: true });

export const buildNumericObject = <T extends readonly string[]>(
  keys: T,
  source: Record<string, unknown> | null | undefined,
) =>
  Object.fromEntries(
    keys.map((key) => [key, toNumberOrNull(source?.[key])]),
  ) as Record<T[number], number | null>;

export const normalizeYearValueMap = (value: NumericMap) => {
  const entries =
    value instanceof Map
      ? Array.from(value.entries())
      : Object.entries(value || {});

  return entries.reduce<Record<string, number | null>>((acc, [key, rawValue]) => {
    const normalizedKey = String(key || "").trim();
    if (!/^\d{4}$/.test(normalizedKey)) return acc;
    acc[normalizedKey] = toNumberOrNull(rawValue);
    return acc;
  }, {});
};

export const normalizeAnnualReturns = (value: any) => {
  const annualRoot = value?.annual ?? value ?? {};
  const ytd = toNumberOrNull(annualRoot?.ytd);
  const yearly_returns = normalizeYearValueMap(
    annualRoot?.yearly_returns ?? annualRoot?.years ?? annualRoot,
  );
  return {
    ytd,
    yearly_returns,
  };
};

export const detectYearColumns = (row: Record<string, unknown>) =>
  Object.keys(row || {}).filter((key) => /(?:^|_)(19|20)\d{2}$/.test(String(key)));

export const mapToPlainObject = (value: NumericMap) =>
  value instanceof Map ? Object.fromEntries(value.entries()) : { ...(value || {}) };

export const normalizeTopHoldings = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};
