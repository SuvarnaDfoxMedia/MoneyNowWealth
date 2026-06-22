import fs from "fs";
import path from "path";
import { Types } from "mongoose";
import * as XLSX from "xlsx";
import MFMainCategory from "../models/mfMainCategoryModel";
import MFCategory from "../models/mfCategoryModel";
import MFAmc from "../models/mfAmcModel";
import MFFund from "../models/mfFundModel";
import MFNfo from "../models/mfNfoModel";
import MFIndexSnapshot from "../models/mfIndexSnapshotModel";
import MFTopHolding from "../models/mfTopHoldingModel";
import MfImportLog from "../models/mfImportLogModel";
import MFBenchmarkReturn from "../models/mfBenchmarkReturnModel";
import MFBenchmark from "../models/mfBenchmarkModel";
import {
  buildTopHoldingSchemeIdentity,
  computeTopHoldingSnapshotHash,
  recomputeTopHoldingLatestForIdentity,
} from "./mfTopHoldingService";
import {
  BENCHMARK_TRAILING_KEYS,
  buildNumericObject,
  CATEGORY_TRAILING_KEYS,
  FUND_RETURN_KEYS,
  MF_ANNUAL_YEARS,
  normalizeTopHoldings,
  normalizeYearValueMap,
  toBoolean,
  toDateOrNull,
  toNumberOrNull,
} from "./mfUtils";

const EXPORT_ANNUAL_YEARS = MF_ANNUAL_YEARS.filter(
  (year) => Number(year) < new Date().getFullYear(),
).slice(0, 9);
import { recomputeCategoryAverageReturns } from "./mfCategoryService";

const XLSXModule: any = (XLSX as any).default || XLSX;

export type MfImportEntity =
  | "main-categories"
  | "categories"
  | "amcs"
  | "funds"
  | "benchmarks"
  | "benchmark-returns"
  | "nfo"
  | "index-snapshots"
  | "top-holdings"
  | "full-workbook";

type ImportSection = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
};

type ImportSummary = {
  mainCategories: ImportSection;
  categories: ImportSection;
  amcs: ImportSection;
  funds: ImportSection;
  benchmarks: ImportSection;
  benchmarkReturns: ImportSection;
  nfos: ImportSection;
  indexSnapshots: ImportSection;
  topHoldings: ImportSection;
};

type ImportError = {
  sheet: string;
  row: number;
  message: string;
  identifier?: string;
};

type ImportSkip = {
  sheet: string;
  row: number;
  reason: string;
  identifier?: string;
};

type PreviewSheet = {
  sheet: string;
  headers: string[];
  rows: Record<string, unknown>[];
};

export type ExportMode = "data" | "template";

type ImportOptions = {
  filePath: string;
  entity: MfImportEntity;
  validateOnly?: boolean;
  forceManualTopHoldings?: boolean;
  logSource?: "manual_import" | "api_sync";
  fileName?: string;
  triggeredBy?: string;
};

type ExportOptions = {
  entity: MfImportEntity;
  mode?: ExportMode;
};

type ImportRuntime = {
  processedKeys: {
    mainCategories: Set<string>;
    categories: Set<string>;
    amcs: Set<string>;
    funds: Set<string>;
    benchmarks: Set<string>;
    benchmarkReturns: Set<string>;
    nfos: Set<string>;
    indexSnapshots: Set<string>;
  };
  popularFundSchemeCodes: Set<string>;
  mainCategoriesById: Map<string, StagedMainCategory>;
  mainCategoriesByName: Map<string, StagedMainCategory>;
  categoriesById: Map<string, StagedCategory>;
  categoriesByScopedName: Map<string, StagedCategory>;
  categoriesByName: Map<string, StagedCategory[]>;
  amcsById: Map<string, StagedAmc>;
  amcsByName: Map<string, StagedAmc>;
};

type SheetDefinition = {
  key: keyof ImportSummary;
  aliases: string[];
};

type StagedMainCategory = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  sort_order: number;
  is_active: number;
  is_deleted: boolean;
  deleted_at: Date | null;
};

type StagedCategory = {
  _id: Types.ObjectId;
  name: string;
  main_category_id: Types.ObjectId;
  description: string;
  category_returns: {
    trailing: Record<string, number | null>;
    annual: {
      ytd: number | null;
      yearly_returns: Record<string, number | null>;
    };
  };
  category_average_returns: {
    trailing: Record<string, number | null>;
    annual: {
      ytd: number | null;
      yearly_returns: Record<string, number | null>;
    };
  };
  risk_level: string;
  suggested_use_case: string;
  suggested_use_case_note: string;
  is_active: number;
  is_deleted: boolean;
  deleted_at: Date | null;
};

type StagedAmc = {
  _id: Types.ObjectId;
  name: string;
  is_active: number;
  is_deleted: boolean;
  deleted_at: Date | null;
};

const SHEETS: Record<Exclude<MfImportEntity, "full-workbook">, SheetDefinition> = {
  "main-categories": {
    key: "mainCategories",
    aliases: ["Main_Categories", "Main Categories", "MainCategories"],
  },
  categories: {
    key: "categories",
    aliases: ["Categories_Master", "Categories", "Category_Master"],
  },
  amcs: {
    key: "amcs",
    aliases: ["AMCs", "AMC", "Amc_Master"],
  },
  funds: {
    key: "funds",
    aliases: ["Scheme_Details", "Funds", "Popular_Funds"],
  },
  benchmarks: {
    key: "benchmarks",
    aliases: ["Benchmarks", "Benchmark_Master", "Benchmark Master"],
  },
  "benchmark-returns": {
    key: "benchmarkReturns",
    aliases: ["Benchmark_Returns", "Benchmark Returns"],
  },
  nfo: {
    key: "nfos",
    aliases: ["NFO_List", "NFO", "NFOs"],
  },
  "index-snapshots": {
    key: "indexSnapshots",
    aliases: ["Index_Data", "Index Snapshots", "IndexSnapshots"],
  },
  "top-holdings": {
    key: "topHoldings",
    aliases: ["Top_Holdings", "Top Holdings", "MF_Top_Holdings"],
  },
};

const FULL_WORKBOOK_SEQUENCE: Array<Exclude<MfImportEntity, "full-workbook">> = [
  "main-categories",
  "categories",
  "amcs",
  "funds",
  "nfo",
  "index-snapshots",
  "top-holdings",
];

const MAIN_CATEGORY_HEADERS = [
  "main_category_name",
  "description",
  "sort_order",
  "is_active",
];

const CATEGORY_HEADERS = [
  "category_id",
  "category_name",
  "main_category_name",
  "description",
  "category_trailing_1w",
  "category_trailing_1m",
  "category_trailing_3m",
  "category_trailing_6m",
  "category_trailing_1y",
  "category_trailing_3y",
  "category_trailing_5y",
  "category_trailing_10y",
  "since_launch",
  "category_ytd",
  ...MF_ANNUAL_YEARS.map((year) => `category_${year}`),
  "risk_level",
  "suggested_use_case",
  "suggested_use_case_note",
  "is_active",
];

const AMC_HEADERS = ["amc_name", "is_active"];

const FUND_HEADERS = [
  "scheme_code",
  "isin_number",
  "fund_name",
  "amc_name",
  "category_name",
  "main_category_name",
  "plan_type",
  "option_type",
  "nav_current",
  "nav_date",
  "aum_cr",
  "expense_ratio",
  "return_1d",
  "Fund trailing return_1w",
  "Fund trailing return_1m",
  "Fund trailing return_3m",
  "Fund trailing return_6m",
  "Fund trailing return_1y",
  "Fund trailing return_3y",
  "Fund trailing return_5y",
  "Fund trailing return_10y",
  "Fund trailing since_launch",
  "YTD",
  ...MF_ANNUAL_YEARS,
  "sharpe_3y",
  "sharpe_5y",
  "std_dev_3y",
  "std_dev_5y",
  "beta_3y",
  "beta_5y",
  "alpha_3y",
  "alpha_5y",
  "max_drawdown_5y",
  "max_drawdown_10y",
  "turnover_ratio",
  "fund_manager",
  "launch_date",
  "min_investment",
  "sip_allowed",
  "min_sip_investment",
  "lumpsum_allowed",
  "min_lumpsum_investment",
  "exit_load",
  "is_featured",
  "is_popular",
  "fund_objective",
  "investment_strategy",
  "domestic_equity_pct",
  "international_equity_pct",
  "debt_pct",
  "other_pct",
  "gold_pct",
  "cash_pct",
  "large_cap_pct",
  "mid_cap_pct",
  "small_cap_pct",
  "tax_type",
  "riskometer_label",
  // Benchmark trailing returns — written to MFBenchmarkReturn on import
  "benchmark_trailing_1w",
  "benchmark_trailing_1m",
  "benchmark_trailing_3m",
  "benchmark_trailing_6m",
  "benchmark_trailing_1y",
  "benchmark_trailing_3y",
  "benchmark_trailing_5y",
  "benchmark_trailing_10y",
  "bench_ytd",
  // Metadata (read-only on import for API-synced funds)
  "mf_api_synced_at",
  "is_active",
];

const NFO_HEADERS = [
  "nfo_id",
  "fund_name",
  "amc_name",
  "category_name",
  "main_category_name",
  "fund_objective_short",
  "subscription_start_date",
  "subscription_end_date",
  "min_investment",
  "benchmark",
  "risk_level",
  "is_open",
  "is_active",
];

const BENCHMARK_HEADERS = [
  "benchmark_index_name",
  "category",
  "main_category",
  "type",
  "benchmark_trailing_1w",
  "benchmark_trailing_1m",
  "benchmark_trailing_3m",
  "benchmark_trailing_6m",
  "benchmark_trailing_1y",
  "benchmark_trailing_3y",
  "benchmark_trailing_5y",
  "benchmark_trailing_10y",
  "since_launch",
  "bench_YTD",
  ...MF_ANNUAL_YEARS.map((year) => `bench_${year}`),
  "is_active",
];

const BENCHMARK_RETURN_FIXED_HEADERS = [
  "benchmark_index_name",
  "date",
  "benchmark_trailing_1w",
  "benchmark_trailing_1m",
  "benchmark_trailing_3m",
  "benchmark_trailing_6m",
  "benchmark_trailing_1y",
  "benchmark_trailing_3y",
  "benchmark_trailing_5y",
  "benchmark_trailing_10y",
  "since_launch",
  "bench_YTD",
];

const INDEX_SNAPSHOT_HEADERS = [
  "benchmark_index_name",
  "main_category_name",
  "category_name",
  "return_1d",
  "return_1w",
  "return_1m",
  "return_3m",
  "return_6m",
  "return_1y",
  "return_3y",
  "return_5y",
  "return_10y",
  "last_updated_date",
  "is_active",
];

const TOP_HOLDING_HEADERS = [
  "scheme_code",
  "fund_name",
  "source_standard_name",
  "source_isin",
  "portfolio_date",
  "prev_portfolio_date",
  "stock_holdings",
  "bond_holdings",
  "assets_top_10_holdings_pct",
  "turnover_pct",
  "holding_name",
  "net_assets_pct",
  "market_value",
  "share_amount",
  "share_change",
  "security_type",
  "sector",
  "maturity",
  "credit_quality_india",
  "country",
  "is_active",
];

const REQUIRED_HEADER_GROUPS: Record<
  Exclude<MfImportEntity, "full-workbook">,
  string[][]
> = {
  "main-categories": [["name", "main_category_name", "main_category"]],
  categories: [
    ["category_name", "name", "subcategory_name", "sub_category_name"],
    [
      "main_category_id",
      "maincategoryid",
      "main_category_mongo_id",
      "main_category_name",
      "main_category",
      "fund_type",
    ],
  ],
  amcs: [["name", "amc_name", "amc"]],
  funds: [
    ["scheme_code", "schemecode", "code"],
    ["fund_name", "scheme_name", "fund"],
    ["amc_id", "amcid", "amc_mongo_id", "amc_name", "amc", "fund_house"],
    [
      "category_id",
      "categoryid",
      "category_mongo_id",
      "sub_category_id",
      "category_name",
      "category",
      "subcategory_name",
      "sub_category_name",
    ],
  ],
  benchmarks: [["benchmark_name", "name", "benchmark", "benchmark_index_name", "benchmark index name"]],
  "benchmark-returns": [
    ["benchmark_name", "name", "benchmark", "benchmark_index_name", "benchmark index name"],
    ["date", "last_updated_date", "as_on_date"],
  ],
  nfo: [
    ["nfo_id", "nfoid", "code"],
    ["fund_name", "scheme_name", "nfo_name"],
    ["amc_id", "amcid", "amc_mongo_id", "amc_name", "amc", "fund_house"],
    [
      "category_id",
      "categoryid",
      "category_mongo_id",
      "sub_category_id",
      "category_name",
      "category",
      "subcategory_name",
      "sub_category_name",
    ],
  ],
  "index-snapshots": [
    ["benchmark_index_name", "benchmark", "index_name"],
    ["main_category_name", "main_category", "fund_type"],
    ["category_name", "category", "subcategory_name", "sub_category_name"],
    ["last_updated_date", "date", "as_on_date"],
  ],
  "top-holdings": [
    ["holding_name", "name"],
    ["fund_name", "source_standard_name", "standard_name"],
  ],
};

const newSection = (): ImportSection => ({
  inserted: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
});

const newSummary = (): ImportSummary => ({
  mainCategories: newSection(),
  categories: newSection(),
  amcs: newSection(),
  funds: newSection(),
  benchmarks: newSection(),
  benchmarkReturns: newSection(),
  nfos: newSection(),
  indexSnapshots: newSection(),
  topHoldings: newSection(),
});

const cacheMainCategory = (
  runtime: ImportRuntime,
  doc: StagedMainCategory | null | undefined,
) => {
  if (!doc?._id) return;
  runtime.mainCategoriesById.set(String(doc._id), doc);
  runtime.mainCategoriesByName.set(normalizeText(doc.name), doc);
};

const cacheCategory = (
  runtime: ImportRuntime,
  doc: StagedCategory | null | undefined,
) => {
  if (!doc?._id) return;
  runtime.categoriesById.set(String(doc._id), doc);
  const scopedKey = `${String(doc.main_category_id)}::${normalizeText(doc.name)}`;
  runtime.categoriesByScopedName.set(scopedKey, doc);
  const nameKey = normalizeText(doc.name);
  const existing = runtime.categoriesByName.get(nameKey) || [];
  const withoutSameId = existing.filter((item) => String(item._id) !== String(doc._id));
  runtime.categoriesByName.set(nameKey, [...withoutSameId, doc]);
};

const cacheAmc = (runtime: ImportRuntime, doc: StagedAmc | null | undefined) => {
  if (!doc?._id) return;
  runtime.amcsById.set(String(doc._id), doc);
  runtime.amcsByName.set(normalizeText(doc.name), doc);
};

const newRuntime = async (): Promise<ImportRuntime> => {
  const runtime: ImportRuntime = {
    processedKeys: {
      mainCategories: new Set<string>(),
      categories: new Set<string>(),
      amcs: new Set<string>(),
      funds: new Set<string>(),
      benchmarks: new Set<string>(),
      benchmarkReturns: new Set<string>(),
      nfos: new Set<string>(),
      indexSnapshots: new Set<string>(),
    },
    popularFundSchemeCodes: new Set<string>(),
    mainCategoriesById: new Map<string, StagedMainCategory>(),
    mainCategoriesByName: new Map<string, StagedMainCategory>(),
    categoriesById: new Map<string, StagedCategory>(),
    categoriesByScopedName: new Map<string, StagedCategory>(),
    categoriesByName: new Map<string, StagedCategory[]>(),
    amcsById: new Map<string, StagedAmc>(),
    amcsByName: new Map<string, StagedAmc>(),
  };

  const [mainCategories, categories, amcs] = await Promise.all([
    MFMainCategory.find({ is_deleted: false })
      .select("_id name description sort_order is_active is_deleted deleted_at")
      .lean(),
    MFCategory.find({ is_deleted: false })
      .select(
        "_id name main_category_id description category_returns category_average_returns risk_level suggested_use_case suggested_use_case_note is_active is_deleted deleted_at",
      )
      .lean(),
    MFAmc.find({ is_deleted: false })
      .select("_id name is_active is_deleted deleted_at")
      .lean(),
  ]);

  mainCategories.forEach((doc: any) => cacheMainCategory(runtime, doc as StagedMainCategory));
  categories.forEach((doc: any) => cacheCategory(runtime, doc as StagedCategory));
  amcs.forEach((doc: any) => cacheAmc(runtime, doc as StagedAmc));

  return runtime;
};

const headerKey = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeText = (value: unknown) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizeFundMatchKey = (value: unknown) =>
  normalizeText(value)
    .replace(/\b(gr|growth|direct|regular|idcw|plan|option)\b/g, " ")
    .replace(/\bfund\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const prettyText = (value: unknown) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const exactRegex = (value: string) => ({
  $regex: `^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
  $options: "i",
});

const valueByAliases = (row: Record<string, unknown>, aliases: string[]) => {
  for (const alias of aliases) {
    const value = row[headerKey(alias)];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
};

const normalizeSheetRows = (workbook: XLSX.WorkBook, sheetName: string) => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const rows = XLSXModule.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
    blankrows: false,
  }) as Record<
    string,
    unknown
  >[];
  return rows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[headerKey(key)] = value;
    }
    return normalized;
  });
};

const getSheetHeaderKeys = (workbook: XLSX.WorkBook, sheetName: string) => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const sheetRange = sheet["!ref"];
  if (!sheetRange) return [];

  const range = XLSXModule.utils.decode_range(sheetRange);
  const headers: string[] = [];

  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const cellAddress = XLSXModule.utils.encode_cell({ r: range.s.r, c: col });
    const cellValue = sheet[cellAddress]?.v;
    const normalizedHeader = headerKey(cellValue);
    if (normalizedHeader) {
      headers.push(normalizedHeader);
    }
  }

  return headers;
};

const buildPreviewSheet = (
  workbook: XLSX.WorkBook,
  sheetName: string,
  limit = 5,
): PreviewSheet => {
  const headers = getSheetHeaderKeys(workbook, sheetName);
  const rows = normalizeSheetRows(workbook, sheetName).slice(0, limit);
  return {
    sheet: sheetName,
    headers,
    rows,
  };
};

const normalizeDateValue = (value: Date | null) => {
  if (!value) return null;
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
};

const parseNumericValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const negative = raw.startsWith("(") && raw.endsWith(")");
  const normalized = raw
    .replace(/[,%]/g, (match) => (match === "%" ? "%" : ""))
    .replace(/,/g, "")
    .replace(/[^\d.%()-]/g, "")
    .trim();
  if (!normalized) return null;
  const isPercent = normalized.endsWith("%");
  const numeric = Number(normalized.replace(/%/g, "").replace(/[()]/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const signed = negative ? -numeric : numeric;
  return isPercent ? signed : signed;
};

const parseNumber = (row: Record<string, unknown>, aliases: string[]) =>
  parseNumericValue(valueByAliases(row, aliases));

const parseDate = (row: Record<string, unknown>, aliases: string[]) =>
  normalizeDateValue(toDateOrNull(valueByAliases(row, aliases)));

const parseYearValues = (
  row: Record<string, unknown>,
  aliasesByYear: Record<string, string[]>,
) =>
  Object.fromEntries(
    Object.entries(aliasesByYear).map(([year, aliases]) => [year, parseNumber(row, aliases)]),
  );

const categoryAnnualAliases = Object.fromEntries(
  MF_ANNUAL_YEARS.map((year) => [year, [year]]),
) as Record<string, string[]>;

const fundAnnualAliases = Object.fromEntries(
  MF_ANNUAL_YEARS.map((year) => [
    year,
    [year, `${year}_fund`, `${year}_0`, `annual_return_${year}`, `fund_return_${year}`],
  ]),
) as Record<string, string[]>;

const benchmarkAnnualAliases = Object.fromEntries(
  MF_ANNUAL_YEARS.map((year) => [year, [`bench_${year}`, `${year}_1`, `benchmark_${year}`, `${year}_benchmark`]]),
) as Record<string, string[]>;

const parseBenchmarkYearlyFromRow = (row: Record<string, unknown>) => {
  const out: Record<string, number | null> = {};
  for (const [rawKey, rawValue] of Object.entries(row || {})) {
    const key = headerKey(rawKey);
    const match = key.match(/^bench_(\d{4})$/i);
    if (!match) continue;
    out[match[1]] = parseNumericValue(rawValue);
  }
  const seeded = parseYearValues(row, benchmarkAnnualAliases);
  for (const [year, value] of Object.entries(seeded)) {
    if (out[year] === undefined) out[year] = value;
  }
  return out;
};

const parseFundYearlyFromRow = (row: Record<string, unknown>) => {
  const out: Record<string, number | null> = {};
  for (const [rawKey, rawValue] of Object.entries(row || {})) {
    const key = headerKey(rawKey);
    const annualMatch = key.match(/^annual_return_(\d{4})(?:_\d+)?$/i);
    if (annualMatch) {
      out[annualMatch[1]] = parseNumericValue(rawValue);
      continue;
    }
    const plainYear = key.match(/^(\d{4})(?:_\d+)?$/);
    if (plainYear) {
      out[plainYear[1]] = parseNumericValue(rawValue);
    }
  }
  const seeded = parseYearValues(row, fundAnnualAliases);
  for (const [year, value] of Object.entries(seeded)) {
    if (out[year] === undefined) out[year] = value;
  }
  return out;
};

const parseCategoryYearlyFromRow = (row: Record<string, unknown>) => {
  const out: Record<string, number | null> = {};
  for (const [rawKey, rawValue] of Object.entries(row || {})) {
    const key = headerKey(rawKey);
    const prefixedYear = key.match(/^category_(\d{4})(?:_\d+)?$/i);
    if (prefixedYear) {
      out[prefixedYear[1]] = parseNumericValue(rawValue);
      continue;
    }
    const plainYear = key.match(/^(\d{4})(?:_\d+)?$/);
    if (plainYear) {
      out[plainYear[1]] = parseNumericValue(rawValue);
    }
  }
  return out;
};

const sectionForEntity = (
  summary: ImportSummary,
  entity: keyof ImportSummary,
) => summary[entity];

const addRowError = (
  summary: ImportSection,
  errors: ImportError[],
  sheet: string,
  row: number,
  message: string,
  identifier?: string,
) => {
  summary.errors += 1;
  errors.push({ sheet, row, message, identifier });
};

const addRowSkip = (
  skips: ImportSkip[],
  sheet: string,
  row: number,
  reason: string,
  identifier?: string,
) => {
  skips.push({ sheet, row, reason, identifier });
};

const validateRequiredHeaders = (
  entity: Exclude<MfImportEntity, "full-workbook">,
  sheetName: string,
  headerKeys: string[],
  summary: ImportSummary,
  errors: ImportError[],
) => {
  const section = sectionForEntity(summary, SHEETS[entity].key);
  const missingGroups = REQUIRED_HEADER_GROUPS[entity].filter(
    (group) => !group.some((alias) => headerKeys.includes(headerKey(alias))),
  );

  for (const group of missingGroups) {
    addRowError(
      section,
      errors,
      sheetName,
      1,
      `Missing required column. Add one of: ${group.join(", ")}`,
    );
  }

  return missingGroups.length === 0;
};

const toIsoDate = (value: Date | null | undefined) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const mapToPlainYearValue = (value: Record<string, unknown> | Map<string, unknown> | null | undefined, year: string) =>
  normalizeYearValueMap(value)[year] ?? "";

const formatPercentLabel = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return `${Number(value.toFixed(2)).toString()}%`;
};

const buildTopHoldingSummary = (
  holdings: Array<{ name?: string; net_assets_pct?: number | null }>,
) =>
  holdings
    .filter((item) => String(item.name || "").trim())
    .slice(0, 10)
    .map((item) => {
      const name = String(item.name || "").trim();
      const pctLabel = formatPercentLabel(item.net_assets_pct ?? null);
      return pctLabel ? `${name} ${pctLabel}` : name;
    });

const resolveFundForTopHolding = async (rawName: string, schemeCode?: string) => {
  const normalizedSchemeCode = String(schemeCode || "").trim();
  if (normalizedSchemeCode) {
    const bySchemeCode = await MFFund.findOne({
      scheme_code: exactRegex(normalizedSchemeCode),
      is_deleted: false,
    })
      .select("_id fund_name scheme_code plan_type option_type")
      .lean();
    if (bySchemeCode) return bySchemeCode;
  }

  const normalizedTarget = normalizeFundMatchKey(rawName);
  if (!normalizedTarget) return null;

  const funds = await MFFund.find({ is_deleted: false })
    .select("_id fund_name scheme_code plan_type option_type")
    .lean();

  const exactMatches = funds.filter(
    (item: any) => normalizeFundMatchKey(item.fund_name) === normalizedTarget,
  );
  const candidates = exactMatches.length > 0
    ? exactMatches
    : funds.filter((item: any) =>
        normalizeFundMatchKey(item.fund_name).includes(normalizedTarget) ||
        normalizedTarget.includes(normalizeFundMatchKey(item.fund_name)),
      );

  if (candidates.length === 0) return null;

  candidates.sort((left: any, right: any) => {
    const score = (item: any) =>
      (item.plan_type === "Regular" ? 2 : 0) +
      (item.option_type === "Growth" ? 2 : 0) +
      (item.option_type === "IDCW" ? 1 : 0);
    return score(right) - score(left);
  });

  return candidates[0];
};

const normalizeComparable = (value: unknown): unknown => {
  if (value instanceof Date) return toIsoDate(value);
  if (typeof value === "string") {
    const normalized = normalizeText(value);
    return normalized === "" ? null : normalized;
  }
  if (
    value &&
    typeof value === "object" &&
    ((value as any)._bsontype === "ObjectId" ||
      (value as any).constructor?.name === "ObjectId")
  ) {
    return String(value);
  }
  if (Array.isArray(value)) return value.map((item) => normalizeComparable(item));
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, nestedValue]) => nestedValue !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => [key, normalizeComparable(nestedValue)]);
    return Object.fromEntries(entries);
  }
  if (value === undefined) return null;
  return value;
};

const extractComparable = (
  source: Record<string, any> | null | undefined,
  shape: Record<string, any>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(shape)) {
    const sourceValue = source?.[key];
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = extractComparable(
        sourceValue && typeof sourceValue === "object" ? sourceValue : {},
        value as Record<string, any>,
      );
      continue;
    }
    result[key] = sourceValue ?? null;
  }
  return result;
};

const hasChanges = (
  source: Record<string, any> | null | undefined,
  nextData: Record<string, any>,
) =>
  JSON.stringify(normalizeComparable(extractComparable(source, nextData))) !==
  JSON.stringify(normalizeComparable(nextData));

const resolveSheetNames = (
  workbook: XLSX.WorkBook,
  entity: MfImportEntity,
): string[] => {
  const names = workbook.SheetNames || [];
  if (entity === "full-workbook") {
    return names;
  }
  const aliases = SHEETS[entity].aliases.map(normalizeText);
  return names.filter((sheetName) => aliases.includes(normalizeText(sheetName)));
};

const getPrimarySheetName = (
  entity: Exclude<MfImportEntity, "full-workbook">,
) => SHEETS[entity].aliases[0];

const findByNormalizedName = async (
  model: {
    find: (filter: Record<string, unknown>) => {
      select: (projection: string) => { lean: () => Promise<any[]> };
    };
  },
  name: string,
  select = "_id name",
) => {
  const normalizedTarget = normalizeText(name);
  if (!normalizedTarget) return null;
  const docs = await model.find({ is_deleted: false }).select(select).lean();
  return docs.find((doc) => normalizeText((doc as any).name) === normalizedTarget) || null;
};

const requireWorkbookPresence = (
  workbook: XLSX.WorkBook,
  entity: MfImportEntity,
) => {
  if (entity === "top-holdings") {
    if ((workbook.SheetNames || []).length === 0) {
      throw new Error("This workbook does not contain any sheets.");
    }
    return;
  }
  if (entity === "full-workbook") {
    const hasSupportedSheet = FULL_WORKBOOK_SEQUENCE.some(
      (item) => resolveSheetNames(workbook, item).length > 0,
    );
    if (!hasSupportedSheet) {
      const expectedSheets = FULL_WORKBOOK_SEQUENCE.flatMap(
        (item) => SHEETS[item].aliases,
      );
      throw new Error(
        `This workbook does not contain any supported MF sheets. Add at least one supported sheet such as: ${expectedSheets.join(", ")}`,
      );
    }
    return;
  }
  const matches = resolveSheetNames(workbook, entity);
  if (matches.length === 0) {
    throw new Error(
      `No supported sheet found for ${entity}. Expected one of: ${SHEETS[entity].aliases.join(", ")}`,
    );
  }
};

const parseTopHoldingsWorkbook = (workbook: XLSX.WorkBook) => {
  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) {
    throw new Error("Top holdings workbook does not contain any sheet.");
  }

  const rows = XLSXModule.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  }) as unknown[][];

  const detailMarkerIndex = rows.findIndex(
    (row) => normalizeText(row?.[0]) === normalizeText("Holdings Detail"),
  );
  const summaryHeaderIndex = rows.findIndex(
    (row) => normalizeText(row?.[0]) === normalizeText("Standard Name"),
  );

  if (detailMarkerIndex > 0 && summaryHeaderIndex >= 0 && rows[detailMarkerIndex + 1]) {
    const summaryValues = rows[summaryHeaderIndex + 1] || [];
    const sourceStandardName = String(summaryValues[0] || "").trim();
    const sourceIsin = String((rows[summaryHeaderIndex + 2] || [])[0] || "")
      .replace(/^ISIN-/i, "")
      .trim();
    const holdingsRows = rows.slice(detailMarkerIndex + 2).filter((row) =>
      String(row?.[0] || "").trim(),
    );

    return {
      sheetName,
      records: [
        {
          scheme_code: "",
          fund_name: sourceStandardName,
          source_standard_name: sourceStandardName,
          source_isin: sourceIsin,
          portfolio_date: summaryValues[1],
          prev_portfolio_date: summaryValues[2],
          stock_holdings: summaryValues[3],
          bond_holdings: summaryValues[4],
          assets_top_10_holdings_pct: summaryValues[5],
          turnover_pct: summaryValues[6],
          holdings: holdingsRows.map((row) => ({
            name: String(row[0] || "").trim(),
            net_assets_pct: parseNumericValue(row[1]),
            market_value: parseNumericValue(row[2]),
            share_amount: parseNumericValue(row[3]),
            share_change: parseNumericValue(row[4]),
            security_type: String(row[5] || "").trim(),
            sector: String(row[6] || "").trim(),
            maturity: String(row[7] || "").trim(),
            credit_quality_india: String(row[8] || "").trim(),
            country: String(row[9] || "").trim(),
          })),
        },
      ],
    };
  }

  const normalizedRows = normalizeSheetRows(workbook, sheetName);
  const grouped = new Map<string, any>();
  for (const row of normalizedRows) {
    const holdingName = String(valueByAliases(row, ["holding_name", "name"]) || "").trim();
    const sourceStandardName = String(
      valueByAliases(row, ["source_standard_name", "fund_name", "standard_name"]) || "",
    ).trim();
    if (!holdingName || !sourceStandardName) continue;

    const schemeCode = String(valueByAliases(row, ["scheme_code"]) || "").trim();
    const portfolioDate = String(valueByAliases(row, ["portfolio_date"]) || "").trim();
    const key = `${schemeCode}::${sourceStandardName}::${portfolioDate}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        scheme_code: schemeCode,
        fund_name: String(valueByAliases(row, ["fund_name", "source_standard_name"]) || sourceStandardName).trim(),
        source_standard_name: sourceStandardName,
        source_isin: String(valueByAliases(row, ["source_isin"]) || "").trim(),
        portfolio_date: valueByAliases(row, ["portfolio_date"]),
        prev_portfolio_date: valueByAliases(row, ["prev_portfolio_date"]),
        stock_holdings: valueByAliases(row, ["stock_holdings"]),
        bond_holdings: valueByAliases(row, ["bond_holdings"]),
        assets_top_10_holdings_pct: valueByAliases(row, ["assets_top_10_holdings_pct"]),
        turnover_pct: valueByAliases(row, ["turnover_pct"]),
        holdings: [],
      });
    }
    grouped.get(key).holdings.push({
      name: holdingName,
      net_assets_pct: parseNumericValue(valueByAliases(row, ["net_assets_pct"])),
      market_value: parseNumericValue(valueByAliases(row, ["market_value"])),
      share_amount: parseNumericValue(valueByAliases(row, ["share_amount"])),
      share_change: parseNumericValue(valueByAliases(row, ["share_change"])),
      security_type: String(valueByAliases(row, ["security_type"]) || "").trim(),
      sector: String(valueByAliases(row, ["sector"]) || "").trim(),
      maturity: String(valueByAliases(row, ["maturity"]) || "").trim(),
      credit_quality_india: String(valueByAliases(row, ["credit_quality_india"]) || "").trim(),
      country: String(valueByAliases(row, ["country"]) || "").trim(),
    });
  }

  const records = Array.from(grouped.values());
  if (records.length === 0) {
    throw new Error(
      "Top holdings workbook is not in a supported format. Use the client workbook layout or the exported Top_Holdings sheet.",
    );
  }
  return { sheetName, records };
};

const importTopHoldingsWorkbook = async (
  workbook: XLSX.WorkBook,
  validateOnly: boolean,
  forceManualTopHoldings = false,
) => {
  const summary = newSummary();
  const errors: ImportError[] = [];
  const skips: ImportSkip[] = [];
  const section = sectionForEntity(summary, "topHoldings");
  const parsed = parseTopHoldingsWorkbook(workbook);
  const previewRows: Record<string, unknown>[] = [];
  const uploadBatchId = new Types.ObjectId().toString();
  const uploadedAt = new Date();
  const affectedSchemeIdentities = new Set<string>();

  for (let index = 0; index < parsed.records.length; index += 1) {
    const record = parsed.records[index];
    const rowNumber = index + 2;
    try {
      const matchedFund = await resolveFundForTopHolding(record.fund_name, record.scheme_code);

      const isApiSynced = matchedFund ? (!!(matchedFund as any).mf_api_synced_at || (matchedFund as any).data_source === "api_sync") : false;
      if (isApiSynced && !forceManualTopHoldings) {
        addRowSkip(skips, parsed.sheetName, rowNumber, "Skipped - this scheme is linked to the MF API. Use the scheme's Top Holdings upload on the MF API dashboard (Schemes > [scheme] > Top Holdings) instead of the legacy importer. Pass forceManual=true to override.", record.scheme_code || record.fund_name);
        continue;
      }

      // forceManualTopHoldings=true: proceed with import, record manual override timestamp
      if (isApiSynced && forceManualTopHoldings && !validateOnly) {
        await MFFund.updateOne(
          { _id: (matchedFund as any)._id },
          { $set: { last_manual_import_at: new Date() } },
        );
      }

      const topHoldingsSummary = buildTopHoldingSummary(record.holdings);
      const portfolioDate = normalizeDateValue(toDateOrNull(record.portfolio_date));
      const prevPortfolioDate = normalizeDateValue(toDateOrNull(record.prev_portfolio_date));
      const schemeCode = String(matchedFund?.scheme_code || record.scheme_code || "").trim();
      const sourceIsin = String(record.source_isin || "").trim();
      const schemeIdentity = buildTopHoldingSchemeIdentity(schemeCode, sourceIsin);
      const holdings = Array.isArray(record.holdings) ? record.holdings : [];

      const nextData = {
        fund_id: matchedFund?._id ?? null,
        scheme_code: schemeCode,
        scheme_identity: schemeIdentity,
        fund_name: String(matchedFund?.fund_name || record.fund_name || record.source_standard_name || "").trim(),
        source_standard_name: String(record.source_standard_name || record.fund_name || "").trim(),
        source_isin: sourceIsin,
        portfolio_date: portfolioDate,
        prev_portfolio_date: prevPortfolioDate,
        stock_holdings: parseNumericValue(record.stock_holdings),
        bond_holdings: parseNumericValue(record.bond_holdings),
        assets_top_10_holdings_pct: parseNumericValue(record.assets_top_10_holdings_pct),
        turnover_pct: parseNumericValue(record.turnover_pct),
        top_holdings_summary: topHoldingsSummary,
        holdings,
        holdings_count: holdings.length,
        is_latest: false,
        upload_batch_id: uploadBatchId,
        uploaded_at: uploadedAt,
        snapshot_hash: "",
        is_active: 1,
        is_deleted: false,
        deleted_at: null,
      };
      nextData.snapshot_hash = computeTopHoldingSnapshotHash(nextData);

      if (!nextData.fund_name) {
        addRowError(section, errors, parsed.sheetName, rowNumber, "Fund name could not be resolved for top holdings import");
        continue;
      }
      if (!nextData.scheme_identity) {
        addRowError(section, errors, parsed.sheetName, rowNumber, "scheme_code is required for top holdings identity", nextData.fund_name);
        continue;
      }
      if (!nextData.portfolio_date) {
        addRowError(section, errors, parsed.sheetName, rowNumber, "portfolio_date is required", nextData.fund_name);
        continue;
      }

      const duplicate = await MFTopHolding.findOne({
        is_deleted: false,
        scheme_identity: nextData.scheme_identity,
        portfolio_date: nextData.portfolio_date,
        snapshot_hash: nextData.snapshot_hash,
      })
        .select("_id")
        .lean();

      previewRows.push({
        fund_name: nextData.fund_name,
        scheme_code: nextData.scheme_code,
        source_isin: nextData.source_isin,
        portfolio_date: toIsoDate(nextData.portfolio_date),
        holdings_count: nextData.holdings.length,
        top_holdings_summary: nextData.top_holdings_summary.join(", "),
        duplicate: duplicate ? "Yes" : "No",
      });

      if (duplicate) {
        section.skipped += 1;
        addRowSkip(
          skips,
          parsed.sheetName,
          rowNumber,
          "Duplicate snapshot hash for same scheme and portfolio date",
          nextData.fund_name,
        );
        continue;
      }

      const activeSource = await MFTopHolding.findOne({
        scheme_identity: nextData.scheme_identity,
        is_deleted: false,
      })
        .sort({ portfolio_date: -1, uploaded_at: -1, _id: -1 })
        .select("is_active")
        .lean();
      nextData.is_active = activeSource?.is_active === 0 ? 0 : 1;

      section.inserted += 1;
      if (!validateOnly) {
        await MFTopHolding.create(nextData);
        affectedSchemeIdentities.add(nextData.scheme_identity);
      }
    } catch (error: any) {
      addRowError(
        section,
        errors,
        parsed.sheetName,
        rowNumber,
        error?.message || "Failed to process top holdings workbook",
        String(record.fund_name || record.source_standard_name || ""),
      );
    }
  }

  if (!validateOnly) {
    for (const schemeIdentity of affectedSchemeIdentities) {
      await recomputeTopHoldingLatestForIdentity(schemeIdentity);
    }
  }

  return {
    entity: "top-holdings" as MfImportEntity,
    validateOnly,
    processedSheets: [parsed.sheetName],
    summary,
    errorCount: errors.length,
    errors: errors.slice(0, 500),
    skipCount: skips.length,
    skippedRows: skips.slice(0, 1000),
    previewSheets: [
      {
        sheet: parsed.sheetName,
        headers: ["fund_name", "scheme_code", "source_isin", "portfolio_date", "holdings_count", "top_holdings_summary", "duplicate"],
        rows: previewRows.slice(0, 5),
      },
    ],
  };
};

const resolveMainCategory = async (
  row: Record<string, unknown>,
  runtime: ImportRuntime,
  allowByName = true,
) => {
  const idValue = String(
    valueByAliases(row, ["main_category_id", "maincategoryid", "main_category_mongo_id"]) || "",
  ).trim();

  if (idValue && /^[a-f\d]{24}$/i.test(idValue)) {
    const byId = runtime.mainCategoriesById.get(idValue) || null;
    if (byId) return byId;
  }

  if (!allowByName) return null;

  const name = String(
    valueByAliases(row, ["main_category_name", "main_category", "fund_type"]) || "",
  ).trim();
  if (!name) return null;
  return runtime.mainCategoriesByName.get(normalizeText(name)) || null;
};

const resolveCategory = async (
  row: Record<string, unknown>,
  runtime: ImportRuntime,
  allowByName = true,
) => {
  const idValue = String(
    valueByAliases(row, ["category_id", "categoryid", "category_mongo_id", "sub_category_id"]) || "",
  ).trim();

  if (idValue && /^[a-f\d]{24}$/i.test(idValue)) {
    const byId = runtime.categoriesById.get(idValue) || null;
    if (byId) return byId;
  }

  if (!allowByName) return null;

  const name = String(
    valueByAliases(row, ["category_name", "category", "subcategory_name", "sub_category_name"]) || "",
  ).trim();
  if (!name) return null;

  const mainCategory = await resolveMainCategory(row, runtime);
  if (mainCategory?._id) {
    return (
      runtime.categoriesByScopedName.get(
        `${String(mainCategory._id)}::${normalizeText(name)}`,
      ) || null
    );
  }
  const matches = runtime.categoriesByName.get(normalizeText(name)) || [];
  return matches[0] || null;
};

const resolveAmc = async (
  row: Record<string, unknown>,
  runtime: ImportRuntime,
  allowByName = true,
) => {
  const idValue = String(
    valueByAliases(row, ["amc_id", "amcid", "amc_mongo_id"]) || "",
  ).trim();

  if (idValue && /^[a-f\d]{24}$/i.test(idValue)) {
    const byId = runtime.amcsById.get(idValue) || null;
    if (byId) return byId;
  }

  if (!allowByName) return null;

  const name = String(valueByAliases(row, ["amc_name", "amc", "fund_house"]) || "").trim();
  if (!name) return null;
  return runtime.amcsByName.get(normalizeText(name)) || null;
};

const upsertMainCategoryRow = async (
  row: Record<string, unknown>,
  rowNumber: number,
  sheetName: string,
  summary: ImportSummary,
  errors: ImportError[],
  validateOnly: boolean,
  runtime: ImportRuntime,
) => {
  const section = sectionForEntity(summary, "mainCategories");
  const name = String(valueByAliases(row, ["name", "main_category_name", "main_category"]) || "").trim();
  if (!name) {
    section.skipped += 1;
    return;
  }
  const dedupeKey = normalizeText(name);
  if (runtime.processedKeys.mainCategories.has(dedupeKey)) {
    section.skipped += 1;
    return;
  }
  runtime.processedKeys.mainCategories.add(dedupeKey);

  try {
    const existing = runtime.mainCategoriesByName.get(dedupeKey) || null;

    const nextData: Omit<StagedMainCategory, "_id"> = {
      name,
      description: String(valueByAliases(row, ["description"]) || "").trim(),
      sort_order: parseNumber(row, ["sort_order", "sortorder"]) ?? 0,
      is_active: toBoolean(valueByAliases(row, ["is_active"]), true) ? 1 : 0,
      is_deleted: false,
      deleted_at: null,
    };

    if (!existing) {
      section.inserted += 1;
      if (!validateOnly) {
        const created = await MFMainCategory.create(nextData);
        cacheMainCategory(runtime, created.toObject() as StagedMainCategory);
      } else {
        cacheMainCategory(runtime, {
          _id: new Types.ObjectId(),
          ...nextData,
        });
      }
      return;
    }

    if (!hasChanges(existing as Record<string, any>, nextData)) {
      section.skipped += 1;
      cacheMainCategory(runtime, existing);
      return;
    }

    section.updated += 1;
    if (!validateOnly) {
      await MFMainCategory.updateOne({ _id: (existing as any)._id }, nextData);
    }
    cacheMainCategory(runtime, {
      ...(existing as StagedMainCategory),
      ...nextData,
    });
  } catch (error: any) {
    addRowError(section, errors, sheetName, rowNumber, error?.message || "Failed to process main category row", name);
  }
};

const upsertCategoryRow = async (
  row: Record<string, unknown>,
  rowNumber: number,
  sheetName: string,
  summary: ImportSummary,
  errors: ImportError[],
  validateOnly: boolean,
  runtime: ImportRuntime,
) => {
  const section = sectionForEntity(summary, "categories");
  const name = String(
    valueByAliases(row, ["category_name", "name", "subcategory_name", "sub_category_name"]) || "",
  ).trim();
  if (!name) {
    section.skipped += 1;
    return;
  }

  try {
    const mainCategory = await resolveMainCategory(row, runtime);
    if (!mainCategory?._id) {
      addRowError(section, errors, sheetName, rowNumber, "Main category could not be resolved", name);
      return;
    }
    const dedupeKey = `${String(mainCategory._id)}::${normalizeText(name)}`;
    if (runtime.processedKeys.categories.has(dedupeKey)) {
      section.skipped += 1;
      return;
    }
    runtime.processedKeys.categories.add(dedupeKey);

    const existing = runtime.categoriesByScopedName.get(dedupeKey) || null;

    const nextData: Omit<StagedCategory, "_id"> = {
      name,
      main_category_id: mainCategory._id,
      description: String(valueByAliases(row, ["description", "short_description"]) || "").trim(),
      category_returns: {
        trailing: {
          "1w": parseNumber(row, ["category_trailing_1w", "category_1w"]),
          "1m": parseNumber(row, ["category_trailing_1m", "category_1m"]),
          "3m": parseNumber(row, ["category_trailing_3m", "category_3m"]),
          "6m": parseNumber(row, ["category_trailing_6m", "category_6m"]),
          "1y": parseNumber(row, ["category_trailing_1y", "category_1y"]),
          "3y": parseNumber(row, ["category_trailing_3y", "category_3y"]),
          "5y": parseNumber(row, ["category_trailing_5y", "category_5y"]),
          "10y": parseNumber(row, ["category_trailing_10y", "category_10y"]),
          since_launch: parseNumber(row, ["since_launch", "category_since_launch"]),
        },
        annual: {
          ytd: parseNumber(row, ["category_ytd", "ytd"]),
          yearly_returns: parseCategoryYearlyFromRow(row),
        },
      },
      category_average_returns: {
        trailing: buildNumericObject(CATEGORY_TRAILING_KEYS, {}),
        annual: { ytd: null, yearly_returns: {} },
      },
      risk_level: String(valueByAliases(row, ["risk_level", "risk"]) || "").trim(),
      suggested_use_case: String(valueByAliases(row, ["suggested_use_case", "use_case"]) || "").trim(),
      suggested_use_case_note: String(
        valueByAliases(row, ["suggested_use_case_note", "use_case_note"]) || "",
      ).trim(),
      is_active: toBoolean(valueByAliases(row, ["is_active"]), true) ? 1 : 0,
      is_deleted: false,
      deleted_at: null,
    };

    if (!existing) {
      section.inserted += 1;
      if (!validateOnly) {
        const created = await MFCategory.create(nextData);
        cacheCategory(runtime, created.toObject() as unknown as StagedCategory);
        await recomputeCategoryAverageReturns(String(created._id));
      } else {
        cacheCategory(runtime, {
          _id: new Types.ObjectId(),
          ...nextData,
        });
      }
      return;
    }

    if (!hasChanges(existing as Record<string, any>, nextData)) {
      section.skipped += 1;
      cacheCategory(runtime, existing);
      return;
    }

    section.updated += 1;
    if (!validateOnly) {
      await MFCategory.updateOne({ _id: (existing as any)._id }, nextData);
      await recomputeCategoryAverageReturns(String((existing as any)._id));
    }
    cacheCategory(runtime, {
      ...(existing as StagedCategory),
      ...nextData,
    });
  } catch (error: any) {
    addRowError(section, errors, sheetName, rowNumber, error?.message || "Failed to process category row", name);
  }
};

const upsertAmcRow = async (
  row: Record<string, unknown>,
  rowNumber: number,
  sheetName: string,
  summary: ImportSummary,
  errors: ImportError[],
  validateOnly: boolean,
  runtime: ImportRuntime,
) => {
  const section = sectionForEntity(summary, "amcs");
  const name = String(valueByAliases(row, ["name", "amc_name", "amc"]) || "").trim();
  if (!name) {
    section.skipped += 1;
    return;
  }
  const dedupeKey = normalizeText(name);
  if (runtime.processedKeys.amcs.has(dedupeKey)) {
    section.skipped += 1;
    return;
  }
  runtime.processedKeys.amcs.add(dedupeKey);

  try {
    const existing = runtime.amcsByName.get(dedupeKey) || null;
    const nextData: Omit<StagedAmc, "_id"> = {
      name,
      is_active: toBoolean(valueByAliases(row, ["is_active"]), true) ? 1 : 0,
      is_deleted: false,
      deleted_at: null,
    };

    if (!existing) {
      section.inserted += 1;
      if (!validateOnly) {
        const created = await MFAmc.create(nextData);
        cacheAmc(runtime, created.toObject() as StagedAmc);
      } else {
        cacheAmc(runtime, {
          _id: new Types.ObjectId(),
          ...nextData,
        });
      }
      return;
    }

    if (!hasChanges(existing as Record<string, any>, nextData)) {
      section.skipped += 1;
      cacheAmc(runtime, existing);
      return;
    }

    section.updated += 1;
    if (!validateOnly) {
      await MFAmc.updateOne({ _id: (existing as any)._id }, nextData);
    }
    cacheAmc(runtime, {
      ...(existing as StagedAmc),
      ...nextData,
    });
  } catch (error: any) {
    addRowError(section, errors, sheetName, rowNumber, error?.message || "Failed to process AMC row", name);
  }
};

const upsertBenchmarkRow = async (
  row: Record<string, unknown>,
  rowNumber: number,
  sheetName: string,
  summary: ImportSummary,
  errors: ImportError[],
  validateOnly: boolean,
  runtime: ImportRuntime,
) => {
  const section = sectionForEntity(summary, "benchmarks");
  const name = String(
    valueByAliases(row, ["benchmark_name", "name", "benchmark", "benchmark_index_name"]) || "",
  ).trim();
  if (!name) return;
  const key = normalizeText(name);
  if (runtime.processedKeys.benchmarks.has(key)) {
    section.skipped += 1;
    return;
  }
  runtime.processedKeys.benchmarks.add(key);

  try {
    const categoryName = String(valueByAliases(row, ["category_name", "category"]) || "").trim();
    const mainCategoryName = String(valueByAliases(row, ["main_category_name", "main_category", "fund_type"]) || "").trim();
    const mainCategory = mainCategoryName ? await resolveMainCategory(row, runtime) : null;
    const category = await resolveCategory(row, runtime);
    const existing = await MFBenchmark.findOne({
      name: exactRegex(name),
      is_deleted: false,
    }).lean();
    const nextData = {
      name,
      category: categoryName || category?.name || "",
      type: String(valueByAliases(row, ["type"]) || "index").trim() || "index",
      category_id: category?._id || null,
      main_category_id: category?.main_category_id || mainCategory?._id || null,
      is_active: toBoolean(valueByAliases(row, ["is_active"]), true) ? 1 : 0,
      is_deleted: false,
      deleted_at: null,
    };
    if (!existing) {
      section.inserted += 1;
      if (!validateOnly) await MFBenchmark.create(nextData);
      return;
    }
    if (!hasChanges(existing as Record<string, any>, nextData)) {
      section.skipped += 1;
      return;
    }
    section.updated += 1;
    if (!validateOnly) await MFBenchmark.updateOne({ _id: (existing as any)._id }, nextData);
  } catch (error: any) {
    addRowError(section, errors, sheetName, rowNumber, error?.message || "Failed to process benchmark row", name);
  }
};

const upsertBenchmarkReturnRow = async (
  row: Record<string, unknown>,
  rowNumber: number,
  sheetName: string,
  summary: ImportSummary,
  errors: ImportError[],
  validateOnly: boolean,
  runtime: ImportRuntime,
  fallbackDate: Date,
  allowMissingDate = false,
) => {
  const section = sectionForEntity(summary, "benchmarkReturns");
  const benchmarkName = String(
    valueByAliases(row, ["benchmark_name", "name", "benchmark", "benchmark_index_name"]) || "",
  ).trim();
  const rawDate =
    parseDate(row, ["date", "last_updated_date", "as_on_date"]) ||
    (allowMissingDate ? normalizeDateValue(fallbackDate) : null);
  if (!benchmarkName && !rawDate) return;
  if (!benchmarkName || !rawDate) {
    addRowError(section, errors, sheetName, rowNumber, "benchmark_name and date are required", benchmarkName);
    return;
  }

  try {
    const benchmark = await MFBenchmark.findOne({
      name: exactRegex(benchmarkName),
      is_deleted: false,
    }).select("_id");
    const benchmarkExistsInCurrentWorkbook = runtime.processedKeys.benchmarks.has(
      normalizeText(benchmarkName),
    );
    if (!benchmark?._id && !(validateOnly && benchmarkExistsInCurrentWorkbook)) {
      addRowError(section, errors, sheetName, rowNumber, "Benchmark could not be resolved", benchmarkName);
      return;
    }
    const date = new Date(rawDate);
    const normalizedDate = normalizeDateValue(date);
    if (!normalizedDate) {
      addRowError(section, errors, sheetName, rowNumber, "Invalid date", benchmarkName);
      return;
    }
    const benchmarkIdentity =
      benchmark?._id
        ? String(benchmark._id)
        : `workbook:${normalizeText(benchmarkName)}`;
    const dedupeKey = `${benchmarkIdentity}::${normalizedDate.toISOString().slice(0, 10)}`;
    if (runtime.processedKeys.benchmarkReturns.has(dedupeKey)) {
      section.skipped += 1;
      return;
    }
    runtime.processedKeys.benchmarkReturns.add(dedupeKey);
    const yearlyReturns = parseBenchmarkYearlyFromRow(row);
    const nextData = {
      benchmark_id: benchmark?._id || null,
      date: normalizedDate,
      trailing: {
        "1w": parseNumber(row, ["benchmark_trailing_1w", "return_1w", "1w", "w1"]),
        "1m": parseNumber(row, ["benchmark_trailing_1m", "return_1m", "1m", "m1"]),
        "3m": parseNumber(row, ["benchmark_trailing_3m", "return_3m", "3m", "m3"]),
        "6m": parseNumber(row, ["benchmark_trailing_6m", "return_6m", "6m", "m6"]),
        "1y": parseNumber(row, ["benchmark_trailing_1y", "return_1y", "1y", "y1"]),
        "3y": parseNumber(row, ["benchmark_trailing_3y", "return_3y", "3y", "y3"]),
        "5y": parseNumber(row, ["benchmark_trailing_5y", "return_5y", "5y", "y5"]),
        "10y": parseNumber(row, ["benchmark_trailing_10y", "return_10y", "10y", "y10"]),
        since_launch: parseNumber(row, ["since_launch", "return_since_inception", "since_inception"]),
      },
      annual: {
        ytd: parseNumber(row, ["bench_ytd", "bench_YTD", "return_ytd", "ytd"]),
        yearly_returns: yearlyReturns,
      },
      is_deleted: false,
      deleted_at: null,
    };
    const existing =
      benchmark?._id
        ? await MFBenchmarkReturn.findOne({
            benchmark_id: benchmark._id,
            date: normalizedDate,
            is_deleted: false,
          }).lean()
        : null;
    if (!existing) {
      section.inserted += 1;
      if (!validateOnly && benchmark?._id) await MFBenchmarkReturn.create(nextData);
      return;
    }
    if (!hasChanges(existing as Record<string, any>, nextData)) {
      section.skipped += 1;
      return;
    }
    section.updated += 1;
    if (!validateOnly) await MFBenchmarkReturn.updateOne({ _id: (existing as any)._id }, nextData);
  } catch (error: any) {
    addRowError(section, errors, sheetName, rowNumber, error?.message || "Failed to process benchmark return row", benchmarkName);
  }
};

const upsertFundRow = async (
  row: Record<string, unknown>,
  rowNumber: number,
  sheetName: string,
  summary: ImportSummary,
  errors: ImportError[],
  skips: ImportSkip[],
  validateOnly: boolean,
  runtime: ImportRuntime,
) => {
  const section = sectionForEntity(summary, "funds");
  const schemeCode = String(valueByAliases(row, ["scheme_code", "schemecode", "code"]) || "").trim();
  const fundName = String(valueByAliases(row, ["fund_name", "scheme_name", "fund"]) || "").trim();

  if (!schemeCode && !fundName) {
    section.skipped += 1;
    addRowSkip(skips, sheetName, rowNumber, "Both scheme_code and fund_name are empty");
    return;
  }
  if (!schemeCode) {
    addRowError(section, errors, sheetName, rowNumber, "scheme_code is required for strict fund matching", fundName);
    return;
  }
  if (!fundName) {
    addRowError(section, errors, sheetName, rowNumber, "fund_name is required", schemeCode);
    return;
  }
  const dedupeKey = normalizeText(schemeCode);
  if (runtime.processedKeys.funds.has(dedupeKey)) {
    section.skipped += 1;
    addRowSkip(skips, sheetName, rowNumber, "Duplicate scheme_code within workbook", schemeCode);
    return;
  }
  runtime.processedKeys.funds.add(dedupeKey);

  try {
    const category = await resolveCategory(row, runtime);
    if (!category?._id) {
      addRowError(section, errors, sheetName, rowNumber, "Category could not be resolved", schemeCode);
      return;
    }

    const amc = await resolveAmc(row, runtime);
    if (!amc?._id) {
      addRowError(section, errors, sheetName, rowNumber, "AMC could not be resolved", schemeCode);
      return;
    }

    const planTypeRaw = String(valueByAliases(row, ["plan_type"]) || "").trim();
    const optionTypeRaw = String(valueByAliases(row, ["option_type"]) || "").trim();
    const planType = ["Regular", "Direct"].includes(planTypeRaw) ? planTypeRaw : "";
    const optionType = ["Growth", "IDCW"].includes(optionTypeRaw) ? optionTypeRaw : "";
    const isPopularFromSheet =
      runtime.popularFundSchemeCodes.has(dedupeKey) ||
      normalizeText(sheetName) === normalizeText("Popular_Funds") ||
      toBoolean(valueByAliases(row, ["is_popular", "popular"]), false);

    const existing = await MFFund.findOne({
      scheme_code: exactRegex(schemeCode),
      is_deleted: false,
    }).lean();

    const benchmarkIndexName = String(
      valueByAliases(row, ["benchmark_index_name", "benchmark", "benchmark_name"]) || "",
    ).trim();
    const benchmarkTrailingValues = buildNumericObject(BENCHMARK_TRAILING_KEYS, {
      d1: parseNumber(row, ["benchmark_trailing_1d", "benchmark_1d"]),
      w1: parseNumber(row, ["benchmark_trailing_1w"]),
      m1: parseNumber(row, ["benchmark_trailing_1m", "benchmark_1m"]),
      m3: parseNumber(row, ["benchmark_trailing_3m", "benchmark_3m"]),
      m6: parseNumber(row, ["benchmark_trailing_6m", "benchmark_6m"]),
      y1: parseNumber(row, ["benchmark_trailing_1y", "benchmark_return_1y"]),
      y3: parseNumber(row, ["benchmark_trailing_3y", "benchmark_return_3y"]),
      y5: parseNumber(row, ["benchmark_trailing_5y", "benchmark_return_5y"]),
      y10: parseNumber(row, ["benchmark_trailing_10y", "benchmark_return_10y"]),
      ytd: parseNumber(row, ["bench_ytd", "benchmark_ytd", "ytd_1"]),
    });
    const benchmarkAnnualValues = parseYearValues(row, benchmarkAnnualAliases);
    const benchmarkCategoryName = String(
      valueByAliases(row, ["category_name", "category"]) || category?.name || "",
    ).trim();
    const benchmarkTypeName = String(
      valueByAliases(row, ["main_category_name", "fund_type"]) || "",
    ).trim();

    let benchmarkId: Types.ObjectId | null = null;
    if (benchmarkIndexName) {
      const existingBenchmark = await MFBenchmark.findOne({
        name: exactRegex(benchmarkIndexName),
        is_deleted: false,
      }).select("_id category type");
      if (existingBenchmark?._id) {
        benchmarkId = existingBenchmark._id as Types.ObjectId;
        const shouldBackfillCategory =
          (!String((existingBenchmark as any).category || "").trim() &&
            benchmarkCategoryName) ||
          (!String((existingBenchmark as any).type || "").trim() &&
            benchmarkTypeName);

        if (!validateOnly && shouldBackfillCategory) {
          await MFBenchmark.updateOne(
            { _id: benchmarkId },
            {
              $set: {
                category:
                  benchmarkCategoryName ||
                  String((existingBenchmark as any).category || "").trim(),
                type:
                  benchmarkTypeName ||
                  String((existingBenchmark as any).type || "").trim() ||
                  "index",
              },
            },
          );
        }
      } else if (!validateOnly) {
        const createdBenchmark = await MFBenchmark.create({
          name: benchmarkIndexName,
          type: benchmarkTypeName || "index",
          category: benchmarkCategoryName,
          is_active: 1,
          is_deleted: false,
        });
        benchmarkId = createdBenchmark._id as Types.ObjectId;
      }
    }

    const fundTrailingValues = {
      d1: parseNumber(row, ["return_1d", "1d_return", "returns_1d"]),
      w1: parseNumber(row, ["fund_trailing_return_1w", "trailing_return_1w", "return_1w"]),
      m1: parseNumber(row, ["fund_trailing_return_1m", "trailing_return_1m", "return_1m", "1m_return", "returns_1m"]),
      m3: parseNumber(row, ["fund_trailing_return_3m", "trailing_return_3m", "return_3m", "3m_return", "returns_3m"]),
      m6: parseNumber(row, ["fund_trailing_return_6m", "trailing_return_6m", "return_6m", "6m_return", "returns_6m"]),
      y1: parseNumber(row, ["fund_trailing_return_1y", "trailing_return_1y", "return_1y", "1y_return", "returns_y1"]),
      y3_cagr: parseNumber(row, ["fund_trailing_return_3y_cagr", "fund_trailing_return_3y", "return_3y_cagr", "return_3y", "3y_cagr", "returns_y3_cagr"]),
      y5_cagr: parseNumber(row, ["fund_trailing_return_5y_cagr", "fund_trailing_return_5y", "return_5y_cagr", "return_5y", "5y_cagr", "returns_y5_cagr"]),
      y10_cagr: parseNumber(row, ["fund_trailing_return_10y_cagr", "fund_trailing_return_10y", "return_10y_cagr", "return_10y", "10y_cagr", "returns_y10_cagr"]),
      ytd: parseNumber(row, ["ytd", "tot_ret_ytd_mo-end", "tot_ret_ytd_mo_end"]),
      since_inception: parseNumber(row, ["since_inception_returns", "since_inception_return", "since_inception", "since_launch", "inception_return"]),
    };
    const fundAnnualValues = parseFundYearlyFromRow(row);

    const nextData = {
      scheme_code: schemeCode,
      isin: String(valueByAliases(row, ["isin", "isin_number", "isin_no"]) || "").trim(),
      isin_number: String(valueByAliases(row, ["isin_number", "isin", "isin_no"]) || "").trim(),
      fund_name: fundName,
      amc_id: amc._id,
      category_id: category._id,
      plan_type: planType,
      option_type: optionType,
      nav_Current: parseNumber(row, ["nav_current", "nav", "nav_current_value"]),
      nav_date: parseDate(row, ["nav_date", "nav_as_on", "as_on_date"]),
      aum: parseNumber(row, ["aum", "aum_cr", "aum_in_cr"]),
      aum_cr: parseNumber(row, ["aum_cr", "aum", "aum_in_cr"]),
      expense_ratio: parseNumber(row, ["expense_ratio", "expense"]),
      returns: {
        ...buildNumericObject(FUND_RETURN_KEYS, fundTrailingValues),
        d1: fundTrailingValues.d1,
        since_inception: fundTrailingValues.since_inception,
        trailing: {
          "1w": fundTrailingValues.w1,
          "1m": fundTrailingValues.m1,
          "3m": fundTrailingValues.m3,
          "6m": fundTrailingValues.m6,
          "1y": fundTrailingValues.y1,
          "3y": fundTrailingValues.y3_cagr,
          "5y": fundTrailingValues.y5_cagr,
          "10y": fundTrailingValues.y10_cagr,
          since_launch: fundTrailingValues.since_inception,
        },
        annual: {
          ytd: fundTrailingValues.ytd,
          yearly_returns: fundAnnualValues,
        },
      },
      risk_metrics: {
        sharpe_3y: parseNumber(row, ["sharpe_3y", "sharpe_ratio_3y"]),
        sharpe_5y: parseNumber(row, ["sharpe_5y", "sharpe_ratio_5y"]),
        std_dev_3y: parseNumber(row, ["std_dev_3y", "std_dev"]),
        std_dev_5y: parseNumber(row, ["std_dev_5y"]),
        beta_3y: parseNumber(row, ["beta_3y", "beta"]),
        beta_5y: parseNumber(row, ["beta_5y"]),
        alpha_3y: parseNumber(row, ["alpha_3y", "alpha"]),
        alpha_5y: parseNumber(row, ["alpha_5y"]),
        max_drawdown_5y: parseNumber(row, ["max_drawdown_5y", "max_drawdown"]),
        max_drawdown_10y: parseNumber(row, ["max_drawdown_10y"]),
        turnover_ratio: parseNumber(row, ["turnover_ratio", "portfolio_turnover_ratio"]),
      },
      fund_manager: String(valueByAliases(row, ["fund_manager", "manager"]) || "").trim(),
      launch_date: parseDate(row, ["launch_date", "inception_date"]),
      benchmark_id: benchmarkId,
      min_investment: parseNumber(row, ["min_investment", "minimum_investment"]),
      sip_allowed: toBoolean(valueByAliases(row, ["sip_allowed"]), true),
      min_sip_investment: parseNumber(row, ["min_sip_investment", "minimum_sip_investment"]),
      lumpsum_allowed: toBoolean(valueByAliases(row, ["lumpsum_allowed"]), true),
      min_lumpsum_investment: parseNumber(row, ["min_lumpsum_investment", "minimum_lumpsum_investment", "lump_sum_min_investment"]),
      exit_load: String(valueByAliases(row, ["exit_load", "exit_load_details"]) || "").trim(),
      is_featured: toBoolean(valueByAliases(row, ["is_featured", "featured"]), false),
      is_popular: isPopularFromSheet,
      fund_objective: String(valueByAliases(row, ["fund_objective", "objective"]) || "").trim(),
      investment_strategy: String(valueByAliases(row, ["investment_strategy", "strategy"]) || "").trim(),
      domestic_equity_pct: parseNumber(row, ["domestic_equity_pct"]),
      international_equity_pct: parseNumber(row, ["international_equity_pct"]),
      debt_pct: parseNumber(row, ["debt_pct"]),
      other_pct: parseNumber(row, ["other_pct"]),
      gold_pct: parseNumber(row, ["gold_pct"]),
      cash_pct: parseNumber(row, ["cash_pct"]),
      large_cap_pct: parseNumber(row, ["large_cap_pct"]),
      mid_cap_pct: parseNumber(row, ["mid_cap_pct"]),
      small_cap_pct: parseNumber(row, ["small_cap_pct"]),
      tax_type: String(valueByAliases(row, ["tax_type"]) || "").trim(),
      riskometer_label: String(valueByAliases(row, ["riskometer_label"]) || "").trim(),
      is_active: toBoolean(valueByAliases(row, ["is_active"]), true) ? 1 : 0,
      is_deleted: false,
      deleted_at: null,
    };

    if (!existing) {
      section.inserted += 1;
      if (!validateOnly) {
        const created = await MFFund.create(nextData);
        if (benchmarkId) {
          const normalizedToday = normalizeDateValue(new Date());
          if (normalizedToday) {
            await MFBenchmarkReturn.findOneAndUpdate(
              { benchmark_id: benchmarkId, date: normalizedToday, is_deleted: false },
              {
                $set: {
                  trailing: {
                    "1w": benchmarkTrailingValues?.w1 ?? null,
                    "1m": benchmarkTrailingValues?.m1 ?? null,
                    "3m": benchmarkTrailingValues?.m3 ?? null,
                    "6m": benchmarkTrailingValues?.m6 ?? null,
                    "1y": benchmarkTrailingValues?.y1 ?? null,
                    "3y": benchmarkTrailingValues?.y3 ?? null,
                    "5y": benchmarkTrailingValues?.y5 ?? null,
                    "10y": benchmarkTrailingValues?.y10 ?? null,
                    since_launch: null,
                  },
                  annual: {
                    ytd: benchmarkTrailingValues?.ytd ?? null,
                    yearly_returns: benchmarkAnnualValues,
                  },
                  is_deleted: false,
                  deleted_at: null,
                },
              },
              { upsert: true, setDefaultsOnInsert: true },
            );
          }
        }
        await recomputeCategoryAverageReturns(String(created.category_id));
      }
      return;
    }

    const isApiSynced = !!(existing as any).mf_api_synced_at || (existing as any).data_source === "api_sync";
    let updatePayload: any = nextData;
    let hasSkippedApiFields = false;

    if (isApiSynced) {
      updatePayload = {
        sip_allowed: nextData.sip_allowed,
        lumpsum_allowed: nextData.lumpsum_allowed,
        min_lumpsum_investment: nextData.min_lumpsum_investment,
        is_featured: nextData.is_featured,
        is_popular: nextData.is_popular,
        is_active: nextData.is_active,
        is_deleted: nextData.is_deleted,
        deleted_at: nextData.deleted_at,
        last_updated_date: nextData.nav_date,
        last_manual_import_at: new Date(),
        "returns.annual.yearly_returns": nextData.returns.annual.yearly_returns,
        "risk_metrics.sharpe_5y": nextData.risk_metrics.sharpe_5y,
        "risk_metrics.std_dev_3y": nextData.risk_metrics.std_dev_3y,
        "risk_metrics.std_dev_5y": nextData.risk_metrics.std_dev_5y,
        "risk_metrics.beta_3y": nextData.risk_metrics.beta_3y,
        "risk_metrics.beta_5y": nextData.risk_metrics.beta_5y,
        "risk_metrics.alpha_3y": nextData.risk_metrics.alpha_3y,
        "risk_metrics.alpha_5y": nextData.risk_metrics.alpha_5y,
        "risk_metrics.max_drawdown_5y": nextData.risk_metrics.max_drawdown_5y,
        "risk_metrics.max_drawdown_10y": nextData.risk_metrics.max_drawdown_10y,
      };
      hasSkippedApiFields = true;
    } else {
      updatePayload = { ...nextData, data_source: "manual", last_manual_import_at: new Date() };
    }

    if (!hasChanges(existing as Record<string, any>, isApiSynced ? updatePayload : nextData)) {
      section.skipped += 1;
      addRowSkip(skips, sheetName, rowNumber, "No changes detected for existing fund", schemeCode || fundName);
      return;
    }

    if (hasSkippedApiFields) {
      addRowSkip(skips, sheetName, rowNumber, "Skipped API-managed fields - scheme is linked to AdvisorKhoj. Use the MF API dashboard to update core fields.", schemeCode || fundName);
    }

    section.updated += 1;
    if (!validateOnly) {
      await MFFund.updateOne({ _id: (existing as any)._id }, isApiSynced ? { $set: updatePayload } : updatePayload);
    }
    if (!validateOnly && benchmarkId) {
      const normalizedToday = normalizeDateValue(new Date());
      if (normalizedToday) {
        await MFBenchmarkReturn.findOneAndUpdate(
          { benchmark_id: benchmarkId, date: normalizedToday, is_deleted: false },
          {
            $set: {
              trailing: {
                "1w": benchmarkTrailingValues?.w1 ?? null,
                "1m": benchmarkTrailingValues?.m1 ?? null,
                "3m": benchmarkTrailingValues?.m3 ?? null,
                "6m": benchmarkTrailingValues?.m6 ?? null,
                "1y": benchmarkTrailingValues?.y1 ?? null,
                "3y": benchmarkTrailingValues?.y3 ?? null,
                "5y": benchmarkTrailingValues?.y5 ?? null,
                "10y": benchmarkTrailingValues?.y10 ?? null,
                since_launch: null,
              },
              annual: {
                ytd: benchmarkTrailingValues?.ytd ?? null,
                yearly_returns: benchmarkAnnualValues,
              },
              is_deleted: false,
              deleted_at: null,
            },
          },
          { upsert: true, setDefaultsOnInsert: true },
        );
      }
    }
    if (!validateOnly) {
      const affectedCategoryIds = [
        String((existing as any).category_id || ""),
        String(category._id || ""),
      ].filter(Boolean);
      for (const categoryId of [...new Set(affectedCategoryIds)]) {
        await recomputeCategoryAverageReturns(categoryId);
      }
    }
  } catch (error: any) {
    addRowError(section, errors, sheetName, rowNumber, error?.message || "Failed to process fund row", schemeCode || fundName);
  }
};

const upsertNfoRow = async (
  row: Record<string, unknown>,
  rowNumber: number,
  sheetName: string,
  summary: ImportSummary,
  errors: ImportError[],
  validateOnly: boolean,
  runtime: ImportRuntime,
) => {
  const section = sectionForEntity(summary, "nfos");
  const nfoId = String(valueByAliases(row, ["nfo_id", "nfoid", "code"]) || "").trim();
  const fundName = String(valueByAliases(row, ["fund_name", "scheme_name", "nfo_name"]) || "").trim();

  if (!nfoId && !fundName) {
    section.skipped += 1;
    return;
  }
  if (!nfoId) {
    addRowError(section, errors, sheetName, rowNumber, "nfo_id is required for strict matching", fundName);
    return;
  }
  const dedupeKey = normalizeText(nfoId);
  if (runtime.processedKeys.nfos.has(dedupeKey)) {
    section.skipped += 1;
    return;
  }
  runtime.processedKeys.nfos.add(dedupeKey);

  try {
    const category = await resolveCategory(row, runtime);
    if (!category?._id) {
      addRowError(section, errors, sheetName, rowNumber, "Category could not be resolved", nfoId);
      return;
    }

    const amc = await resolveAmc(row, runtime);
    if (!amc?._id) {
      addRowError(section, errors, sheetName, rowNumber, "AMC could not be resolved", nfoId);
      return;
    }

    const startDate = parseDate(row, ["subscription_start_date", "open_date"]);
    const endDate = parseDate(row, ["subscription_end_date", "close_date"]);
    if (startDate && endDate && endDate < startDate) {
      addRowError(section, errors, sheetName, rowNumber, "subscription_end_date must be greater than or equal to subscription_start_date", nfoId);
      return;
    }

    const existing = await MFNfo.findOne({
      nfo_id: exactRegex(nfoId),
      is_deleted: false,
    }).lean();

    const nextData = {
      nfo_id: nfoId,
      fund_name: fundName,
      amc_id: amc._id,
      category_id: category._id,
      fund_objective_short: String(valueByAliases(row, ["fund_objective_short", "objective"]) || "").trim(),
      subscription_start_date: startDate,
      subscription_end_date: endDate,
      min_investment: parseNumber(row, ["min_investment", "minimum_investment"]),
      benchmark: String(valueByAliases(row, ["benchmark"]) || "").trim(),
      risk_level: String(valueByAliases(row, ["risk_level", "risk"]) || "").trim(),
      is_open: toBoolean(valueByAliases(row, ["is_open", "open"]), true),
      is_active: toBoolean(valueByAliases(row, ["is_active"]), true) ? 1 : 0,
      is_deleted: false,
      deleted_at: null,
    };

    if (!existing) {
      section.inserted += 1;
      if (!validateOnly) await MFNfo.create(nextData);
      return;
    }

    if (!hasChanges(existing as Record<string, any>, nextData)) {
      section.skipped += 1;
      return;
    }

    section.updated += 1;
    if (!validateOnly) await MFNfo.updateOne({ _id: (existing as any)._id }, nextData);
  } catch (error: any) {
    addRowError(section, errors, sheetName, rowNumber, error?.message || "Failed to process NFO row", nfoId || fundName);
  }
};

const upsertIndexSnapshotRow = async (
  row: Record<string, unknown>,
  rowNumber: number,
  sheetName: string,
  summary: ImportSummary,
  errors: ImportError[],
  validateOnly: boolean,
  runtime: ImportRuntime,
) => {
  const section = sectionForEntity(summary, "indexSnapshots");
  const benchmarkIndexName = String(
    valueByAliases(row, ["benchmark_index_name", "benchmark", "index_name"]) || "",
  ).trim();
  const lastUpdatedDate = parseDate(row, ["last_updated_date", "date", "as_on_date"]);
  if (!benchmarkIndexName && !lastUpdatedDate) {
    section.skipped += 1;
    return;
  }
  if (!benchmarkIndexName || !lastUpdatedDate) {
    addRowError(section, errors, sheetName, rowNumber, "benchmark_index_name and last_updated_date are required", benchmarkIndexName);
    return;
  }
  const dedupeKey = `${normalizeText(benchmarkIndexName)}::${toIsoDate(lastUpdatedDate)}`;
  if (runtime.processedKeys.indexSnapshots.has(dedupeKey)) {
    section.skipped += 1;
    return;
  }
  runtime.processedKeys.indexSnapshots.add(dedupeKey);

  try {
    const mainCategory = await resolveMainCategory(row, runtime);
    if (!mainCategory?._id) {
      addRowError(section, errors, sheetName, rowNumber, "Main category could not be resolved", benchmarkIndexName);
      return;
    }

    const category = await resolveCategory(row, runtime);
    if (!category?._id) {
      addRowError(section, errors, sheetName, rowNumber, "Category could not be resolved", benchmarkIndexName);
      return;
    }

    if (String(category.main_category_id) !== String(mainCategory._id)) {
      addRowError(
        section,
        errors,
        sheetName,
        rowNumber,
        "Category does not belong to the selected main category",
        benchmarkIndexName,
      );
      return;
    }

    let benchmarkId: Types.ObjectId | null = null;
    const existingBenchmark = await MFBenchmark.findOne({
      name: exactRegex(benchmarkIndexName),
      is_deleted: false,
    }).select("_id name type category category_id main_category_id");

    if (!existingBenchmark) {
      if (!validateOnly) {
        const createdBenchmark = await MFBenchmark.create({
          name: benchmarkIndexName,
          category: String(category.name || "").trim(),
          category_id: category._id,
          main_category_id: mainCategory._id,
          type: String(mainCategory.name || "index").trim() || "index",
          is_active: 1,
          is_deleted: false,
        });
        benchmarkId = createdBenchmark._id as Types.ObjectId;
      }
    } else {
      benchmarkId = existingBenchmark._id as Types.ObjectId;
      const benchmarkUpdate: Record<string, unknown> = {};
      if (String((existingBenchmark as any).category_id || "") !== String(category._id)) {
        benchmarkUpdate.category_id = category._id;
      }
      if (String((existingBenchmark as any).main_category_id || "") !== String(mainCategory._id)) {
        benchmarkUpdate.main_category_id = mainCategory._id;
      }
      if (!String((existingBenchmark as any).category || "").trim()) {
        benchmarkUpdate.category = String(category.name || "").trim();
      }
      if (!String((existingBenchmark as any).type || "").trim()) {
        benchmarkUpdate.type = String(mainCategory.name || "index").trim() || "index";
      }
      if (!validateOnly && Object.keys(benchmarkUpdate).length > 0) {
        await MFBenchmark.updateOne({ _id: existingBenchmark._id }, { $set: benchmarkUpdate });
      }
    }

    if (!validateOnly && benchmarkId) {
      const normalizedDate = normalizeDateValue(lastUpdatedDate);
      if (normalizedDate) {
        await MFBenchmarkReturn.findOneAndUpdate(
          { benchmark_id: benchmarkId, date: normalizedDate, is_deleted: false },
          {
            $set: {
              return_1d: parseNumber(row, ["return_1d", "1d_return", "d1"]),
              return_1w: parseNumber(row, ["return_1w", "1w_return", "w1"]),
              return_1m: parseNumber(row, ["return_1m", "1m_return", "m1"]),
              return_3m: parseNumber(row, ["return_3m", "3m_return", "m3"]),
              return_6m: parseNumber(row, ["return_6m", "6m_return", "m6"]),
              return_1y: parseNumber(row, ["return_1y", "1y_return", "y1"]),
              return_3y: parseNumber(row, ["return_3y", "3y_return", "y3"]),
              return_5y: parseNumber(row, ["return_5y", "5y_return", "y5"]),
              return_10y: parseNumber(row, ["return_10y", "10y_return", "y10"]),
              is_deleted: false,
              deleted_at: null,
            },
          },
          { upsert: true, setDefaultsOnInsert: true },
        );
      }
    }

    const dayStart = new Date(lastUpdatedDate);
    const dayEnd = new Date(lastUpdatedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const existing = await MFIndexSnapshot.findOne({
      benchmark_index_name: exactRegex(benchmarkIndexName),
      last_updated_date: { $gte: dayStart, $lte: dayEnd },
      is_deleted: false,
    }).lean();

    const nextData = {
      benchmark_index_name: benchmarkIndexName,
      main_category_id: mainCategory._id,
      category_id: category._id,
      returns: {
        d1: parseNumber(row, ["return_1d", "1d_return", "d1"]),
        w1: parseNumber(row, ["return_1w", "1w_return", "w1"]),
        m1: parseNumber(row, ["return_1m", "1m_return", "m1"]),
        m3: parseNumber(row, ["return_3m", "3m_return", "m3"]),
        m6: parseNumber(row, ["return_6m", "6m_return", "m6"]),
        y1: parseNumber(row, ["return_1y", "1y_return", "y1"]),
        y3: parseNumber(row, ["return_3y", "3y_return", "y3"]),
        y5: parseNumber(row, ["return_5y", "5y_return", "y5"]),
        y10: parseNumber(row, ["return_10y", "10y_return", "y10"]),
      },
      last_updated_date: lastUpdatedDate,
      is_active: toBoolean(valueByAliases(row, ["is_active"]), true) ? 1 : 0,
      is_deleted: false,
      deleted_at: null,
    };

    if (!existing) {
      section.inserted += 1;
      if (!validateOnly) await MFIndexSnapshot.create(nextData);
      return;
    }

    if (!hasChanges(existing as Record<string, any>, nextData)) {
      section.skipped += 1;
      return;
    }

    section.updated += 1;
    if (!validateOnly) await MFIndexSnapshot.updateOne({ _id: (existing as any)._id }, nextData);
  } catch (error: any) {
    addRowError(section, errors, sheetName, rowNumber, error?.message || "Failed to process index snapshot row", benchmarkIndexName);
  }
};

const processRows = async (
  workbook: XLSX.WorkBook,
  entity: Exclude<MfImportEntity, "full-workbook">,
  summary: ImportSummary,
  errors: ImportError[],
  skips: ImportSkip[],
  validateOnly: boolean,
  processedSheets: string[],
  runtime: ImportRuntime,
  importDate: Date,
) => {
  const matchingSheets = resolveSheetNames(workbook, entity).sort((left, right) => {
    if (entity !== "funds") return 0;
    const priority = (sheetName: string) => {
      const normalized = normalizeText(sheetName);
      if (normalized === normalizeText("Scheme_Details")) return 0;
      if (normalized === normalizeText("Funds")) return 1;
      if (normalized === normalizeText("Popular_Funds")) return 2;
      return 3;
    };
    return priority(left) - priority(right);
  });
  for (const sheetName of matchingSheets) {
    processedSheets.push(sheetName);
    const headerKeys = getSheetHeaderKeys(workbook, sheetName);
    if (!validateRequiredHeaders(entity, sheetName, headerKeys, summary, errors)) {
      continue;
    }
    const rows = normalizeSheetRows(workbook, sheetName);
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 2;
      if (entity === "main-categories") {
        await upsertMainCategoryRow(row, rowNumber, sheetName, summary, errors, validateOnly, runtime);
      } else if (entity === "categories") {
        await upsertCategoryRow(row, rowNumber, sheetName, summary, errors, validateOnly, runtime);
      } else if (entity === "amcs") {
        await upsertAmcRow(row, rowNumber, sheetName, summary, errors, validateOnly, runtime);
      } else if (entity === "funds") {
        await upsertFundRow(row, rowNumber, sheetName, summary, errors, skips, validateOnly, runtime);
      } else if (entity === "benchmarks") {
        await upsertBenchmarkRow(row, rowNumber, sheetName, summary, errors, validateOnly, runtime);
        await upsertBenchmarkReturnRow(
          row,
          rowNumber,
          sheetName,
          summary,
          errors,
          validateOnly,
          runtime,
          importDate,
          true,
        );
      } else if (entity === "benchmark-returns") {
        await upsertBenchmarkReturnRow(
          row,
          rowNumber,
          sheetName,
          summary,
          errors,
          validateOnly,
          runtime,
          importDate,
          false,
        );
      } else if (entity === "nfo") {
        await upsertNfoRow(row, rowNumber, sheetName, summary, errors, validateOnly, runtime);
      } else if (entity === "index-snapshots") {
        await upsertIndexSnapshotRow(row, rowNumber, sheetName, summary, errors, validateOnly, runtime);
      }
    }
  }
};

const buildWorkbook = () => XLSXModule.utils.book_new();

const appendSheet = (
  workbook: XLSX.WorkBook,
  name: string,
  rows: Array<Record<string, unknown> | unknown[]>,
  headers: string[],
) => {
  const useAoa = rows.some((row) => Array.isArray(row));
  const worksheet = useAoa
    ? XLSXModule.utils.aoa_to_sheet(
        rows.length > 0 ? [headers, ...(rows as unknown[][])] : [headers],
      )
    : rows.length > 0
      ? XLSXModule.utils.json_to_sheet(rows as Record<string, unknown>[], {
          header: headers,
        })
      : XLSXModule.utils.aoa_to_sheet([headers]);
  XLSXModule.utils.book_append_sheet(workbook, worksheet, name);
};

const exportMainCategoriesRows = async () => {
  const items = await MFMainCategory.find({ is_deleted: false })
    .sort({ sort_order: 1, name: 1 })
    .lean();
  return items.map((item) => ({
    main_category_name: prettyText(item.name),
    description: item.description || "",
    sort_order: item.sort_order ?? 0,
    is_active: item.is_active === 1 ? "Yes" : "No",
  }));
};

const exportCategoryRows = async () => {
  const items = await MFCategory.find({ is_deleted: false })
    .populate("main_category_id", "name")
    .sort({ name: 1 })
    .lean();

  const yearSet = new Set<string>();
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 9;
  for (const item of items as any[]) {
    const years = Object.keys(item?.category_returns?.annual?.yearly_returns || {});
    years
      .filter(
        (year) =>
          /^\d{4}$/.test(year) &&
          Number(year) < currentYear &&
          Number(year) >= minYear,
      )
      .forEach((year) => yearSet.add(year));
  }
  if (yearSet.size === 0) {
    EXPORT_ANNUAL_YEARS.forEach((year) => yearSet.add(year));
  }
  const annualYears = [...yearSet].sort((a, b) => Number(b) - Number(a));

  const rows = items.map((item: any) => [
    String(item._id || ""),
    prettyText(item.name),
    prettyText(item.main_category_id?.name || ""),
    item.description || "",
    item.category_returns?.trailing?.["1w"] ?? "",
    item.category_returns?.trailing?.["1m"] ?? "",
    item.category_returns?.trailing?.["3m"] ?? "",
    item.category_returns?.trailing?.["6m"] ?? "",
    item.category_returns?.trailing?.["1y"] ?? "",
    item.category_returns?.trailing?.["3y"] ?? "",
    item.category_returns?.trailing?.["5y"] ?? "",
    item.category_returns?.trailing?.["10y"] ?? "",
    item.category_returns?.trailing?.since_launch ?? "",
    item.category_returns?.annual?.ytd ?? "",
    ...annualYears.map((year) =>
      mapToPlainYearValue(item.category_returns?.annual?.yearly_returns, year),
    ),
    item.risk_level || "",
    item.suggested_use_case || "",
    item.suggested_use_case_note || "",
    item.is_active === 1 ? "Yes" : "No",
  ]);

  const headers = [
    "category_id",
    "category_name",
    "main_category_name",
    "description",
    "category_trailing_1w",
    "category_trailing_1m",
    "category_trailing_3m",
    "category_trailing_6m",
    "category_trailing_1y",
    "category_trailing_3y",
    "category_trailing_5y",
    "category_trailing_10y",
    "since_launch",
    "category_ytd",
    ...annualYears.map((year) => `category_${year}`),
    "risk_level",
    "suggested_use_case",
    "suggested_use_case_note",
    "is_active",
  ];

  return { rows, headers };
};

const exportAmcRows = async () => {
  const items = await MFAmc.find({ is_deleted: false }).sort({ name: 1 }).lean();
  return items.map((item) => ({
    amc_name: prettyText(item.name),
    is_active: item.is_active === 1 ? "Yes" : "No",
  }));
};

const exportBenchmarkRows = async () => {
  const items = await MFBenchmark.find({ is_deleted: false })
    .populate("category_id", "name")
    .populate("main_category_id", "name")
    .sort({ name: 1 })
    .lean();
  const benchmarkIds = items.map((item: any) => item._id);
  const latestReturns = benchmarkIds.length
    ? await MFBenchmarkReturn.aggregate([
        {
          $match: {
            is_deleted: false,
            benchmark_id: { $in: benchmarkIds },
          },
        },
        { $sort: { date: -1, updated_at: -1 } },
        {
          $group: {
            _id: "$benchmark_id",
            latest: { $first: "$$ROOT" },
          },
        },
      ])
    : [];
  const returnByBenchmarkId = new Map<string, any>();
  latestReturns.forEach((item: any) => {
    returnByBenchmarkId.set(String(item._id), item.latest);
  });

  return items.map((item: any) => ({
    ...(() => {
      const row = returnByBenchmarkId.get(String(item._id));
      const yearlyReturns = row?.annual?.yearly_returns || row?.annual || {};
      return {
        benchmark_trailing_1w: row?.trailing?.["1w"] ?? "",
        benchmark_trailing_1m: row?.trailing?.["1m"] ?? "",
        benchmark_trailing_3m: row?.trailing?.["3m"] ?? "",
        benchmark_trailing_6m: row?.trailing?.["6m"] ?? "",
        benchmark_trailing_1y: row?.trailing?.["1y"] ?? "",
        benchmark_trailing_3y: row?.trailing?.["3y"] ?? "",
        benchmark_trailing_5y: row?.trailing?.["5y"] ?? "",
        benchmark_trailing_10y: row?.trailing?.["10y"] ?? "",
        since_launch: row?.trailing?.since_launch ?? "",
        bench_YTD: row?.annual?.ytd ?? "",
        ...Object.fromEntries(
          MF_ANNUAL_YEARS.map((year) => [
            `bench_${year}`,
            mapToPlainYearValue(yearlyReturns, year),
          ]),
        ),
      };
    })(),
    benchmark_index_name: prettyText(item.name || ""), /* benchmark_index_name is expected by importer */
    category: prettyText(item.category_id?.name || item.category || ""),
    main_category: prettyText(item.main_category_id?.name || ""),
    type: item.type || "",
    is_active: item.is_active === 1 ? "Yes" : "No",
  }));
};

const exportBenchmarkReturnRows = async () => {
  const items = await MFBenchmarkReturn.find({ is_deleted: false })
    .populate("benchmark_id", "name")
    .sort({ date: -1 })
    .lean();
  const yearSet = new Set<string>();
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 9;
  for (const item of items as any[]) {
    const years = Object.keys(item?.annual?.yearly_returns || item?.annual || {});
    years
      .filter(
        (year) =>
          /^\d{4}$/.test(year) &&
          Number(year) < currentYear &&
          Number(year) >= minYear,
      )
      .forEach((year) => yearSet.add(year));
  }
  if (yearSet.size === 0) {
    EXPORT_ANNUAL_YEARS.forEach((year) => yearSet.add(year));
  }
  const dynamicYears = [...yearSet].sort((a, b) => Number(b) - Number(a));
  const headers = [...BENCHMARK_RETURN_FIXED_HEADERS, ...dynamicYears.map((year) => `bench_${year}`)];

  const rows = items.map((item: any) => ({
    benchmark_index_name: prettyText(item.benchmark_id?.name || ""),
    date: toIsoDate(item.date),
    benchmark_trailing_1w: item?.trailing?.["1w"] ?? "",
    benchmark_trailing_1m: item?.trailing?.["1m"] ?? "",
    benchmark_trailing_3m: item?.trailing?.["3m"] ?? "",
    benchmark_trailing_6m: item?.trailing?.["6m"] ?? "",
    benchmark_trailing_1y: item?.trailing?.["1y"] ?? "",
    benchmark_trailing_3y: item?.trailing?.["3y"] ?? "",
    benchmark_trailing_5y: item?.trailing?.["5y"] ?? "",
    benchmark_trailing_10y: item?.trailing?.["10y"] ?? "",
    since_launch: item?.trailing?.since_launch ?? "",
    bench_YTD: item?.annual?.ytd ?? "",
    ...Object.fromEntries(
      dynamicYears.map((year) => [
        `bench_${year}`,
        mapToPlainYearValue(item?.annual?.yearly_returns || item?.annual, year),
      ]),
    ),
  }));

  return { rows, headers };
};

const resolveFundAnnualYearsForExport = (items: any[]) => {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 9;
  const importedYears = items.flatMap((item) =>
    Object.keys(item?.returns?.annual?.yearly_returns || item?.returns?.annual || {})
      .filter((year) => /^\d{4}$/.test(year))
      .map((year) => Number(year))
      .filter(
        (year) => Number.isFinite(year) && year < currentYear && year >= minYear,
      ),
  );
  const startYear = importedYears.length > 0 ? Math.max(...importedYears) : currentYear - 1;
  return Array.from({ length: 9 }, (_, index) => String(startYear - index));
};

const buildFundHeaders = (annualYears: string[]) => [
  "scheme_code",
  "isin_number",
  "fund_name",
  "amc_name",
  "category_name",
  "main_category_name",
  "plan_type",
  "option_type",
  "nav_current",
  "nav_date",
  "aum_cr",
  "expense_ratio",
  "return_1d",
  "Fund trailing return_1w",
  "Fund trailing return_1m",
  "Fund trailing return_3m",
  "Fund trailing return_6m",
  "Fund trailing return_1y",
  "Fund trailing return_3y",
  "Fund trailing return_5y",
  "Fund trailing return_10y",
  "Fund trailing since_launch",
  "YTD",
  ...annualYears,
  "sharpe_3y",
  "sharpe_5y",
  "std_dev_3y",
  "std_dev_5y",
  "beta_3y",
  "beta_5y",
  "alpha_3y",
  "alpha_5y",
  "max_drawdown_5y",
  "max_drawdown_10y",
  "turnover_ratio",
  "fund_manager",
  "launch_date",
  "min_investment",
  "sip_allowed",
  "min_sip_investment",
  "lumpsum_allowed",
  "min_lumpsum_investment",
  "exit_load",
  "is_featured",
  "is_popular",
  "fund_objective",
  "investment_strategy",
  "domestic_equity_pct",
  "international_equity_pct",
  "debt_pct",
  "other_pct",
  "gold_pct",
  "cash_pct",
  "large_cap_pct",
  "mid_cap_pct",
  "small_cap_pct",
  "tax_type",
  "riskometer_label",
  // Benchmark trailing returns — written to MFBenchmarkReturn on import
  "benchmark_trailing_1w",
  "benchmark_trailing_1m",
  "benchmark_trailing_3m",
  "benchmark_trailing_6m",
  "benchmark_trailing_1y",
  "benchmark_trailing_3y",
  "benchmark_trailing_5y",
  "benchmark_trailing_10y",
  "bench_ytd",
  ...annualYears.map((year) => `bench_${year}`),
  // Metadata (read-only on import for API-synced funds)
  "mf_api_synced_at",
  "is_active",
];

const exportFundRows = async (onlyPopular = false, annualYears: string[] = EXPORT_ANNUAL_YEARS) => {
  const filter: Record<string, unknown> = { is_deleted: false };
  if (onlyPopular) filter.is_popular = true;

  const items = await MFFund.find(filter)
    .populate("amc_id", "name")
    .populate("benchmark_id", "name")
    .populate({
      path: "category_id",
      select: "name main_category_id",
      populate: { path: "main_category_id", select: "name" },
    })
    .sort({ fund_name: 1 })
    .lean();

  return items.map((item: any) => [
    item.scheme_code || "",
    item.isin_number || item.isin || "",
    prettyText(item.fund_name),
    prettyText(item.amc_id?.name || ""),
    prettyText(item.category_id?.name || ""),
    prettyText(item.category_id?.main_category_id?.name || ""),
    item.plan_type || "",
    item.option_type || "",
    item.nav_Current ?? "",
    toIsoDate(item.nav_date),
    item.aum_cr ?? "",
    item.expense_ratio ?? "",
    item.returns?.d1 ?? "",
    item.returns?.trailing?.["1w"] ?? item.returns?.w1 ?? "",
    item.returns?.trailing?.["1m"] ?? item.returns?.m1 ?? "",
    item.returns?.trailing?.["3m"] ?? item.returns?.m3 ?? "",
    item.returns?.trailing?.["6m"] ?? item.returns?.m6 ?? "",
    item.returns?.trailing?.["1y"] ?? item.returns?.y1 ?? "",
    item.returns?.trailing?.["3y"] ?? item.returns?.y3_cagr ?? "",
    item.returns?.trailing?.["5y"] ?? item.returns?.y5_cagr ?? "",
    item.returns?.trailing?.["10y"] ?? item.returns?.y10_cagr ?? "",
    item.returns?.trailing?.since_launch ?? item.returns?.since_inception ?? "",
    item.returns?.annual?.ytd ?? item.returns?.ytd ?? "",
    ...annualYears.map((year) =>
      mapToPlainYearValue(item.returns?.annual?.yearly_returns || item.returns?.annual, year),
    ),
    item.risk_metrics?.sharpe_3y ?? "",
    item.risk_metrics?.sharpe_5y ?? "",
    item.risk_metrics?.std_dev_3y ?? "",
    item.risk_metrics?.std_dev_5y ?? "",
    item.risk_metrics?.beta_3y ?? "",
    item.risk_metrics?.beta_5y ?? "",
    item.risk_metrics?.alpha_3y ?? "",
    item.risk_metrics?.alpha_5y ?? "",
    item.risk_metrics?.max_drawdown_5y ?? "",
    item.risk_metrics?.max_drawdown_10y ?? "",
    item.risk_metrics?.turnover_ratio ?? "",
    item.fund_manager || "",
    toIsoDate(item.launch_date),
    item.min_investment ?? "",
    item.sip_allowed ? "Yes" : "No",
    item.min_sip_investment ?? "",
    item.lumpsum_allowed ? "Yes" : "No",
    item.min_lumpsum_investment ?? "",
    item.exit_load || "",
    item.is_featured ? "Yes" : "No",
    item.is_popular ? "Yes" : "No",
    item.fund_objective || "",
    item.investment_strategy || "",
    item.domestic_equity_pct ?? "",
    item.international_equity_pct ?? "",
    item.debt_pct ?? "",
    item.other_pct ?? "",
    item.gold_pct ?? "",
    item.cash_pct ?? "",
    item.large_cap_pct ?? "",
    item.mid_cap_pct ?? "",
    item.small_cap_pct ?? "",
    item.tax_type || "",
    item.riskometer_label || "",
    item.benchmark_returns_trailing?.["1w"]  ?? "",
    item.benchmark_returns_trailing?.["1m"]  ?? "",
    item.benchmark_returns_trailing?.["3m"]  ?? "",
    item.benchmark_returns_trailing?.["6m"]  ?? "",
    item.benchmark_returns_trailing?.["1y"]  ?? "",
    item.benchmark_returns_trailing?.["3y"]  ?? "",
    item.benchmark_returns_trailing?.["5y"]  ?? "",
    item.benchmark_returns_trailing?.["10y"] ?? "",
    item.benchmark_returns_trailing?.ytd     ?? "",
    ...annualYears.map((year) =>
      mapToPlainYearValue(item.benchmark_returns_annual, year)
    ),
    item.mf_api_synced_at
      ? new Date(item.mf_api_synced_at).toISOString().slice(0, 10)
      : "",
    item.is_active === 1 ? "Yes" : "No",
  ]);
};

const exportNfoRows = async () => {
  const items = await MFNfo.find({ is_deleted: false })
    .populate("amc_id", "name")
    .populate({
      path: "category_id",
      select: "name main_category_id",
      populate: { path: "main_category_id", select: "name" },
    })
    .sort({ fund_name: 1 })
    .lean();

  return items.map((item: any) => ({
    nfo_id: item.nfo_id || "",
    fund_name: prettyText(item.fund_name),
    amc_name: prettyText(item.amc_id?.name || ""),
    category_name: prettyText(item.category_id?.name || ""),
    main_category_name: prettyText(item.category_id?.main_category_id?.name || ""),
    fund_objective_short: item.fund_objective_short || "",
    subscription_start_date: toIsoDate(item.subscription_start_date),
    subscription_end_date: toIsoDate(item.subscription_end_date),
    min_investment: item.min_investment ?? "",
    benchmark: item.benchmark || "",
    risk_level: item.risk_level || "",
    is_open: item.is_open ? "Yes" : "No",
    is_active: item.is_active === 1 ? "Yes" : "No",
  }));
};

const exportIndexSnapshotRows = async () => {
  const items = await MFIndexSnapshot.find({ is_deleted: false })
    .populate("main_category_id", "name")
    .populate("category_id", "name")
    .sort({ last_updated_date: -1, benchmark_index_name: 1 })
    .lean();

  return items.map((item: any) => ({
    benchmark_index_name: item.benchmark_index_name,
    main_category_name: prettyText(item.main_category_id?.name || ""),
    category_name: prettyText(item.category_id?.name || ""),
    return_1d: item.returns?.d1 ?? "",
    return_1w: item.returns?.w1 ?? "",
    return_1m: item.returns?.m1 ?? "",
    return_3m: item.returns?.m3 ?? "",
    return_6m: item.returns?.m6 ?? "",
    return_1y: item.returns?.y1 ?? "",
    return_3y: item.returns?.y3 ?? "",
    return_5y: item.returns?.y5 ?? "",
    return_10y: item.returns?.y10 ?? "",
    last_updated_date: toIsoDate(item.last_updated_date),
    is_active: item.is_active === 1 ? "Yes" : "No",
  }));
};

const exportTopHoldingRows = async () => {
  const items = await MFTopHolding.find({ is_deleted: false })
    .populate("fund_id", "fund_name scheme_code")
    .sort({ portfolio_date: -1, fund_name: 1 })
    .lean();

  return items.flatMap((item: any) => {
    const holdings = Array.isArray(item.holdings) && item.holdings.length > 0
      ? item.holdings
      : [{}];
    return holdings.map((holding: any) => ({
      scheme_code: item.scheme_code || item.fund_id?.scheme_code || "",
      fund_name: prettyText(item.fund_name || item.fund_id?.fund_name || ""),
      source_standard_name: item.source_standard_name || "",
      source_isin: item.source_isin || "",
      portfolio_date: toIsoDate(item.portfolio_date),
      prev_portfolio_date: toIsoDate(item.prev_portfolio_date),
      stock_holdings: item.stock_holdings ?? "",
      bond_holdings: item.bond_holdings ?? "",
      assets_top_10_holdings_pct: item.assets_top_10_holdings_pct ?? "",
      turnover_pct: item.turnover_pct ?? "",
      holding_name: holding.name || "",
      net_assets_pct: holding.net_assets_pct ?? "",
      market_value: holding.market_value ?? "",
      share_amount: holding.share_amount ?? "",
      share_change: holding.share_change ?? "",
      security_type: holding.security_type || "",
      sector: holding.sector || "",
      maturity: holding.maturity || "",
      credit_quality_india: holding.credit_quality_india || "",
      country: holding.country || "",
      is_active: item.is_active === 1 ? "Yes" : "No",
    }));
  });
};

const runImportPipeline = async (
  workbook: XLSX.WorkBook,
  entity: MfImportEntity,
  validateOnly: boolean,
  importDate: Date,
) => {
  const summary = newSummary();
  const errors: ImportError[] = [];
  const skips: ImportSkip[] = [];
  const processedSheets: string[] = [];
  const runtime = await newRuntime();

  const popularFundSheets = resolveSheetNames(workbook, "funds").filter(
    (sheetName) => normalizeText(sheetName) === normalizeText("Popular_Funds"),
  );
  for (const sheetName of popularFundSheets) {
    const rows = normalizeSheetRows(workbook, sheetName);
    for (const row of rows) {
      const schemeCode = String(
        valueByAliases(row, ["scheme_code", "schemecode", "code"]) || "",
      ).trim();
      if (schemeCode) {
        runtime.popularFundSchemeCodes.add(normalizeText(schemeCode));
      }
    }
  }

  if (entity === "full-workbook") {
    for (const nextEntity of FULL_WORKBOOK_SEQUENCE) {
      if (resolveSheetNames(workbook, nextEntity).length > 0) {
        await processRows(
          workbook,
          nextEntity,
          summary,
          errors,
          skips,
          validateOnly,
          processedSheets,
          runtime,
          importDate,
        );
      }
    }
  } else {
    await processRows(
      workbook,
      entity,
      summary,
      errors,
      skips,
      validateOnly,
      processedSheets,
      runtime,
      importDate,
    );
  }

  return {
    entity,
    validateOnly,
    processedSheets,
    summary,
    errorCount: errors.length,
    errors: errors.slice(0, 500),
    skipCount: skips.length,
    skippedRows: skips.slice(0, 1000),
    previewSheets: processedSheets
      .slice(0, 3)
      .map((sheetName) => buildPreviewSheet(workbook, sheetName)),
  };
};

export const importMfExcel = async (options: ImportOptions) => {
  const {
    filePath,
    entity,
    validateOnly = false,
    forceManualTopHoldings = false,
    logSource,
    fileName,
    triggeredBy
  } = options;
  const importDate = new Date();
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Excel file not found at path: ${resolvedPath}`);
  }

  const workbook = XLSXModule.readFile(resolvedPath, {
    cellDates: true,
    cellNF: true,
    cellText: true,
    cellFormula: true,
  });
  requireWorkbookPresence(workbook, entity);

  if (entity === "top-holdings") {
    if (!validateOnly) {
      const validationReport = await importTopHoldingsWorkbook(workbook, true, options.forceManualTopHoldings);
      if (validationReport.errorCount > 0) {
        return {
          success: false,
          filePath: resolvedPath,
          fileName: path.basename(resolvedPath),
          sheetsDetected: workbook.SheetNames || [],
          ...validationReport,
        };
      }
    }

    const report = await importTopHoldingsWorkbook(workbook, validateOnly, options.forceManualTopHoldings);
    return {
      success: true,
      filePath: resolvedPath,
      fileName: path.basename(resolvedPath),
      sheetsDetected: workbook.SheetNames || [],
      ...report,
    };
  }

  if (!validateOnly) {
    const validationReport = await runImportPipeline(
      workbook,
      entity,
      true,
      importDate,
    );
    if (validationReport.errorCount > 0) {
      return {
        success: false,
        filePath: resolvedPath,
        fileName: path.basename(resolvedPath),
        sheetsDetected: workbook.SheetNames || [],
        ...validationReport,
      };
    }
  }

  const report = await runImportPipeline(
    workbook,
    entity,
    validateOnly,
    importDate,
  );

  return {
    success: true,
    filePath: resolvedPath,
    fileName: path.basename(resolvedPath),
    sheetsDetected: workbook.SheetNames || [],
    ...report,
  };
};

export const exportMfExcel = async ({ entity, mode = "data" }: ExportOptions) => {
  const workbook = buildWorkbook();
  const includeRows = mode === "data";
  const maybeRows = async (
    loader: () => Promise<Array<Record<string, unknown> | unknown[]>>,
  ) =>
    includeRows ? await loader() : [];

  if (entity === "full-workbook") {
    const allFundItems = includeRows
      ? await MFFund.find({ is_deleted: false }).select("returns.annual").lean()
      : [];
    const annualYears = includeRows ? resolveFundAnnualYearsForExport(allFundItems as any[]) : EXPORT_ANNUAL_YEARS;
    const fundHeaders = buildFundHeaders(annualYears);
    appendSheet(workbook, "Main_Categories", await maybeRows(exportMainCategoriesRows), MAIN_CATEGORY_HEADERS);
    const categoryExport = includeRows
      ? await exportCategoryRows()
      : { rows: [] as Array<Record<string, unknown> | unknown[]>, headers: CATEGORY_HEADERS };
    appendSheet(workbook, "Categories_Master", categoryExport.rows, categoryExport.headers);
    appendSheet(workbook, "AMCs", await maybeRows(exportAmcRows), AMC_HEADERS);
    appendSheet(workbook, "Popular_Funds", await maybeRows(() => exportFundRows(true, annualYears)), fundHeaders);
    appendSheet(workbook, "Scheme_Details", await maybeRows(() => exportFundRows(false, annualYears)), fundHeaders);
    appendSheet(workbook, "NFO_List", await maybeRows(exportNfoRows), NFO_HEADERS);
    appendSheet(workbook, "Index_Data", await maybeRows(exportIndexSnapshotRows), INDEX_SNAPSHOT_HEADERS);
  } else if (entity === "main-categories") {
    appendSheet(workbook, getPrimarySheetName("main-categories"), await maybeRows(exportMainCategoriesRows), MAIN_CATEGORY_HEADERS);
  } else if (entity === "categories") {
    const categoryExport = includeRows
      ? await exportCategoryRows()
      : { rows: [] as Array<Record<string, unknown> | unknown[]>, headers: CATEGORY_HEADERS };
    appendSheet(workbook, getPrimarySheetName("categories"), categoryExport.rows, categoryExport.headers);
  } else if (entity === "amcs") {
    appendSheet(workbook, getPrimarySheetName("amcs"), await maybeRows(exportAmcRows), AMC_HEADERS);
  } else if (entity === "funds") {
    const allFundItems = includeRows
      ? await MFFund.find({ is_deleted: false }).select("returns.annual").lean()
      : [];
    const annualYears = includeRows ? resolveFundAnnualYearsForExport(allFundItems as any[]) : EXPORT_ANNUAL_YEARS;
    const fundHeaders = buildFundHeaders(annualYears);
    appendSheet(workbook, "Popular_Funds", await maybeRows(() => exportFundRows(true, annualYears)), fundHeaders);
    appendSheet(workbook, "Scheme_Details", await maybeRows(() => exportFundRows(false, annualYears)), fundHeaders);
  } else if (entity === "benchmarks") {
    appendSheet(workbook, getPrimarySheetName("benchmarks"), await maybeRows(exportBenchmarkRows), BENCHMARK_HEADERS);
  } else if (entity === "benchmark-returns") {
    const benchmarkReturnExport = includeRows
      ? await exportBenchmarkReturnRows()
      : { rows: [] as Array<Record<string, unknown>>, headers: BENCHMARK_RETURN_FIXED_HEADERS };
    appendSheet(
      workbook,
      getPrimarySheetName("benchmark-returns"),
      benchmarkReturnExport.rows,
      benchmarkReturnExport.headers,
    );
  } else if (entity === "nfo") {
    appendSheet(workbook, getPrimarySheetName("nfo"), await maybeRows(exportNfoRows), NFO_HEADERS);
  } else if (entity === "index-snapshots") {
    appendSheet(workbook, getPrimarySheetName("index-snapshots"), await maybeRows(exportIndexSnapshotRows), INDEX_SNAPSHOT_HEADERS);
  } else if (entity === "top-holdings") {
    appendSheet(workbook, getPrimarySheetName("top-holdings"), await maybeRows(exportTopHoldingRows), TOP_HOLDING_HEADERS);
  }

  const buffer = XLSXModule.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return {
    fileName: `mf-${entity}-${mode}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  };
};





