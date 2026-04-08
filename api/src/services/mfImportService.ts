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
import { toBoolean, toDateOrNull, toNumberOrNull } from "./mfUtils";

const XLSXModule: any = (XLSX as any).default || XLSX;

export type MfImportEntity =
  | "main-categories"
  | "categories"
  | "amcs"
  | "funds"
  | "nfo"
  | "index-snapshots"
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
  nfos: ImportSection;
  indexSnapshots: ImportSection;
};

type ImportError = {
  sheet: string;
  row: number;
  message: string;
  identifier?: string;
};

type ImportOptions = {
  filePath: string;
  entity: MfImportEntity;
  validateOnly?: boolean;
};

type ExportOptions = {
  entity: MfImportEntity;
};

type ImportRuntime = {
  processedKeys: {
    mainCategories: Set<string>;
    categories: Set<string>;
    amcs: Set<string>;
    funds: Set<string>;
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
  benchmark_index_name: string;
  benchmark_return_type: "Annual" | "Trailing";
  benchmark_returns: {
    y1: number | null;
    y3: number | null;
    y5: number | null;
    y10: number | null;
  };
  category_average_returns: {
    y1: number | null;
    y3: number | null;
    y5: number | null;
    y10: number | null;
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
  nfo: {
    key: "nfos",
    aliases: ["NFO_List", "NFO", "NFOs"],
  },
  "index-snapshots": {
    key: "indexSnapshots",
    aliases: ["Index_Data", "Index Snapshots", "IndexSnapshots"],
  },
};

const FULL_WORKBOOK_SEQUENCE: Array<Exclude<MfImportEntity, "full-workbook">> = [
  "main-categories",
  "categories",
  "amcs",
  "funds",
  "nfo",
  "index-snapshots",
];

const MAIN_CATEGORY_HEADERS = [
  "main_category_name",
  "description",
  "sort_order",
  "is_active",
];

const CATEGORY_HEADERS = [
  "category_name",
  "main_category_name",
  "description",
  "benchmark_index_name",
  "benchmark_return_type",
  "benchmark_y1",
  "benchmark_y3",
  "benchmark_y5",
  "benchmark_y10",
  "category_average_y1",
  "category_average_y3",
  "category_average_y5",
  "category_average_y10",
  "risk_level",
  "suggested_use_case",
  "suggested_use_case_note",
  "is_active",
];

const AMC_HEADERS = ["amc_name", "is_active"];

const FUND_HEADERS = [
  "scheme_code",
  "fund_name",
  "amc_name",
  "category_name",
  "main_category_name",
  "plan_type",
  "option_type",
  "aum_cr",
  "expense_ratio",
  "return_1d",
  "return_1m",
  "return_3m",
  "return_6m",
  "return_1y",
  "return_3y_cagr",
  "return_5y_cagr",
  "return_10y_cagr",
  "sharpe_3y",
  "std_dev_3y",
  "beta_3y",
  "alpha_3y",
  "max_drawdown_5y",
  "turnover_ratio",
  "fund_manager",
  "launch_date",
  "benchmark_index_name",
  "benchmark_trailing_1d",
  "benchmark_trailing_1m",
  "benchmark_trailing_3m",
  "benchmark_trailing_6m",
  "benchmark_trailing_1y",
  "benchmark_trailing_3y",
  "benchmark_trailing_5y",
  "benchmark_trailing_10y",
  "benchmark_annual_1y",
  "benchmark_annual_3y",
  "benchmark_annual_5y",
  "benchmark_annual_10y",
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
  "top_holdings",
  "equity_pct",
  "debt_pct",
  "other_pct",
  "tax_type",
  "riskometer_label",
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

const INDEX_SNAPSHOT_HEADERS = [
  "benchmark_index_name",
  "main_category_name",
  "category_name",
  "return_1y",
  "return_3y",
  "return_5y",
  "return_10y",
  "last_updated_date",
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
    ["last_updated_date", "date", "as_on_date"],
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
  nfos: newSection(),
  indexSnapshots: newSection(),
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
        "_id name main_category_id description benchmark_index_name benchmark_return_type benchmark_returns category_average_returns risk_level suggested_use_case suggested_use_case_note is_active is_deleted deleted_at",
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
  const rows = XLSXModule.utils.sheet_to_json(sheet, { defval: "" }) as Record<
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
  const rows = XLSXModule.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  }) as unknown[][];
  const firstRow = Array.isArray(rows[0]) ? rows[0] : [];
  return firstRow
    .map((value) => headerKey(value))
    .filter(Boolean);
};

const normalizeDateValue = (value: Date | null) => {
  if (!value) return null;
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const parseNumber = (row: Record<string, unknown>, aliases: string[]) =>
  toNumberOrNull(valueByAliases(row, aliases));

const parseDate = (row: Record<string, unknown>, aliases: string[]) =>
  normalizeDateValue(toDateOrNull(valueByAliases(row, aliases)));

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
      benchmark_index_name: String(valueByAliases(row, ["benchmark_index_name", "benchmark"]) || "").trim(),
      benchmark_return_type:
        String(valueByAliases(row, ["benchmark_return_type"]) || "Trailing").trim() === "Annual"
          ? "Annual"
          : "Trailing",
      benchmark_returns: {
        y1: parseNumber(row, ["benchmark_y1", "benchmark_1y", "benchmark_1y_return", "y1"]),
        y3: parseNumber(row, ["benchmark_y3", "benchmark_3y", "benchmark_3y_return", "y3"]),
        y5: parseNumber(row, ["benchmark_y5", "benchmark_5y", "benchmark_5y_return", "y5"]),
        y10: parseNumber(row, ["benchmark_y10", "benchmark_10y", "benchmark_10y_return", "y10"]),
      },
      category_average_returns: {
        y1: parseNumber(row, ["category_average_y1", "category_average_1y"]),
        y3: parseNumber(row, ["category_average_y3", "category_average_3y"]),
        y5: parseNumber(row, ["category_average_y5", "category_average_5y"]),
        y10: parseNumber(row, ["category_average_y10", "category_average_10y"]),
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
        cacheCategory(runtime, created.toObject() as StagedCategory);
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

const upsertFundRow = async (
  row: Record<string, unknown>,
  rowNumber: number,
  sheetName: string,
  summary: ImportSummary,
  errors: ImportError[],
  validateOnly: boolean,
  runtime: ImportRuntime,
) => {
  const section = sectionForEntity(summary, "funds");
  const schemeCode = String(valueByAliases(row, ["scheme_code", "schemecode", "code"]) || "").trim();
  const fundName = String(valueByAliases(row, ["fund_name", "scheme_name", "fund"]) || "").trim();

  if (!schemeCode && !fundName) {
    section.skipped += 1;
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
    const topHoldings = String(valueByAliases(row, ["top_holdings", "top_5_holdings"]) || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const isPopularFromSheet =
      runtime.popularFundSchemeCodes.has(dedupeKey) ||
      normalizeText(sheetName) === normalizeText("Popular_Funds") ||
      toBoolean(valueByAliases(row, ["is_popular", "popular"]), false);

    const existing = await MFFund.findOne({
      scheme_code: exactRegex(schemeCode),
      is_deleted: false,
    }).lean();

    const nextData = {
      scheme_code: schemeCode,
      fund_name: fundName,
      amc_id: amc._id,
      category_id: category._id,
      plan_type: planType,
      option_type: optionType,
      aum_cr: parseNumber(row, ["aum_cr", "aum"]),
      expense_ratio: parseNumber(row, ["expense_ratio", "expense"]),
      returns: {
        d1: parseNumber(row, ["return_1d", "1d_return", "returns_1d"]),
        m1: parseNumber(row, ["return_1m", "1m_return", "returns_1m"]),
        m3: parseNumber(row, ["return_3m", "3m_return", "returns_3m"]),
        m6: parseNumber(row, ["return_6m", "6m_return", "returns_6m"]),
        y1: parseNumber(row, ["return_1y", "1y_return", "returns_y1"]),
        y3_cagr: parseNumber(row, ["return_3y_cagr", "3y_cagr", "returns_y3_cagr"]),
        y5_cagr: parseNumber(row, ["return_5y_cagr", "5y_cagr", "returns_y5_cagr"]),
        y10_cagr: parseNumber(row, ["return_10y_cagr", "10y_cagr", "returns_y10_cagr"]),
      },
      risk_metrics: {
        sharpe_3y: parseNumber(row, ["sharpe_3y", "sharpe_ratio_3y"]),
        std_dev_3y: parseNumber(row, ["std_dev_3y", "std_dev"]),
        beta_3y: parseNumber(row, ["beta_3y", "beta"]),
        alpha_3y: parseNumber(row, ["alpha_3y", "alpha"]),
        max_drawdown_5y: parseNumber(row, ["max_drawdown_5y", "max_drawdown"]),
        turnover_ratio: parseNumber(row, ["turnover_ratio", "portfolio_turnover_ratio"]),
      },
      fund_manager: String(valueByAliases(row, ["fund_manager", "manager"]) || "").trim(),
      launch_date: parseDate(row, ["launch_date", "inception_date"]),
      benchmark_index_name: String(valueByAliases(row, ["benchmark_index_name", "benchmark"]) || "").trim(),
      benchmark_returns_trailing: {
        d1: parseNumber(row, ["benchmark_trailing_1d", "benchmark_1d"]),
        m1: parseNumber(row, ["benchmark_trailing_1m", "benchmark_1m"]),
        m3: parseNumber(row, ["benchmark_trailing_3m", "benchmark_3m"]),
        m6: parseNumber(row, ["benchmark_trailing_6m", "benchmark_6m"]),
        y1: parseNumber(row, ["benchmark_trailing_1y", "benchmark_return_1y"]),
        y3: parseNumber(row, ["benchmark_trailing_3y", "benchmark_return_3y"]),
        y5: parseNumber(row, ["benchmark_trailing_5y", "benchmark_return_5y"]),
        y10: parseNumber(row, ["benchmark_trailing_10y", "benchmark_return_10y"]),
      },
      benchmark_returns_annual: {
        y1: parseNumber(row, ["benchmark_annual_1y"]),
        y3: parseNumber(row, ["benchmark_annual_3y"]),
        y5: parseNumber(row, ["benchmark_annual_5y"]),
        y10: parseNumber(row, ["benchmark_annual_10y"]),
      },
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
      top_holdings: topHoldings,
      asset_allocation: {
        equity_pct: parseNumber(row, ["equity_pct", "equity"]),
        debt_pct: parseNumber(row, ["debt_pct", "debt"]),
        other_pct: parseNumber(row, ["other_pct", "other"]),
      },
      tax_type: String(valueByAliases(row, ["tax_type"]) || "").trim(),
      riskometer_label: String(valueByAliases(row, ["riskometer_label", "riskometer"]) || "").trim(),
      is_active: toBoolean(valueByAliases(row, ["is_active"]), true) ? 1 : 0,
      is_deleted: false,
      deleted_at: null,
    };

    if (!existing) {
      section.inserted += 1;
      if (!validateOnly) await MFFund.create(nextData);
      return;
    }

    if (!hasChanges(existing as Record<string, any>, nextData)) {
      section.skipped += 1;
      return;
    }

    section.updated += 1;
    if (!validateOnly) await MFFund.updateOne({ _id: (existing as any)._id }, nextData);
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
    const category = await resolveCategory(row, runtime);
    const mainCategoryId = category?.main_category_id
      ? category.main_category_id
      : (await resolveMainCategory(row, runtime))?._id || null;

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
      main_category_id: mainCategoryId,
      category_id: category?._id || null,
      returns: {
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
  validateOnly: boolean,
  processedSheets: string[],
  runtime: ImportRuntime,
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
        await upsertFundRow(row, rowNumber, sheetName, summary, errors, validateOnly, runtime);
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
  rows: Record<string, unknown>[],
  headers: string[],
) => {
  const worksheet =
    rows.length > 0
      ? XLSXModule.utils.json_to_sheet(rows, { header: headers })
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

  return items.map((item: any) => ({
    category_name: prettyText(item.name),
    main_category_name: prettyText(item.main_category_id?.name || ""),
    description: item.description || "",
    benchmark_index_name: item.benchmark_index_name || "",
    benchmark_return_type: item.benchmark_return_type || "Trailing",
    benchmark_y1: item.benchmark_returns?.y1 ?? "",
    benchmark_y3: item.benchmark_returns?.y3 ?? "",
    benchmark_y5: item.benchmark_returns?.y5 ?? "",
    benchmark_y10: item.benchmark_returns?.y10 ?? "",
    category_average_y1: item.category_average_returns?.y1 ?? "",
    category_average_y3: item.category_average_returns?.y3 ?? "",
    category_average_y5: item.category_average_returns?.y5 ?? "",
    category_average_y10: item.category_average_returns?.y10 ?? "",
    risk_level: item.risk_level || "",
    suggested_use_case: item.suggested_use_case || "",
    suggested_use_case_note: item.suggested_use_case_note || "",
    is_active: item.is_active === 1 ? "Yes" : "No",
  }));
};

const exportAmcRows = async () => {
  const items = await MFAmc.find({ is_deleted: false }).sort({ name: 1 }).lean();
  return items.map((item) => ({
    amc_name: prettyText(item.name),
    is_active: item.is_active === 1 ? "Yes" : "No",
  }));
};

const exportFundRows = async (onlyPopular = false) => {
  const filter: Record<string, unknown> = { is_deleted: false };
  if (onlyPopular) filter.is_popular = true;

  const items = await MFFund.find(filter)
    .populate("amc_id", "name")
    .populate({
      path: "category_id",
      select: "name main_category_id",
      populate: { path: "main_category_id", select: "name" },
    })
    .sort({ fund_name: 1 })
    .lean();

  return items.map((item: any) => ({
    scheme_code: item.scheme_code || "",
    fund_name: prettyText(item.fund_name),
    amc_name: prettyText(item.amc_id?.name || ""),
    category_name: prettyText(item.category_id?.name || ""),
    main_category_name: prettyText(item.category_id?.main_category_id?.name || ""),
    plan_type: item.plan_type || "",
    option_type: item.option_type || "",
    aum_cr: item.aum_cr ?? "",
    expense_ratio: item.expense_ratio ?? "",
    return_1d: item.returns?.d1 ?? "",
    return_1m: item.returns?.m1 ?? "",
    return_3m: item.returns?.m3 ?? "",
    return_6m: item.returns?.m6 ?? "",
    return_1y: item.returns?.y1 ?? "",
    return_3y_cagr: item.returns?.y3_cagr ?? "",
    return_5y_cagr: item.returns?.y5_cagr ?? "",
    return_10y_cagr: item.returns?.y10_cagr ?? "",
    sharpe_3y: item.risk_metrics?.sharpe_3y ?? "",
    std_dev_3y: item.risk_metrics?.std_dev_3y ?? "",
    beta_3y: item.risk_metrics?.beta_3y ?? "",
    alpha_3y: item.risk_metrics?.alpha_3y ?? "",
    max_drawdown_5y: item.risk_metrics?.max_drawdown_5y ?? "",
    turnover_ratio: item.risk_metrics?.turnover_ratio ?? "",
    fund_manager: item.fund_manager || "",
    launch_date: toIsoDate(item.launch_date),
    benchmark_index_name: item.benchmark_index_name || "",
    benchmark_trailing_1d: item.benchmark_returns_trailing?.d1 ?? "",
    benchmark_trailing_1m: item.benchmark_returns_trailing?.m1 ?? "",
    benchmark_trailing_3m: item.benchmark_returns_trailing?.m3 ?? "",
    benchmark_trailing_6m: item.benchmark_returns_trailing?.m6 ?? "",
    benchmark_trailing_1y: item.benchmark_returns_trailing?.y1 ?? "",
    benchmark_trailing_3y: item.benchmark_returns_trailing?.y3 ?? "",
    benchmark_trailing_5y: item.benchmark_returns_trailing?.y5 ?? "",
    benchmark_trailing_10y: item.benchmark_returns_trailing?.y10 ?? "",
    benchmark_annual_1y: item.benchmark_returns_annual?.y1 ?? "",
    benchmark_annual_3y: item.benchmark_returns_annual?.y3 ?? "",
    benchmark_annual_5y: item.benchmark_returns_annual?.y5 ?? "",
    benchmark_annual_10y: item.benchmark_returns_annual?.y10 ?? "",
    min_investment: item.min_investment ?? "",
    sip_allowed: item.sip_allowed ? "Yes" : "No",
    min_sip_investment: item.min_sip_investment ?? "",
    lumpsum_allowed: item.lumpsum_allowed ? "Yes" : "No",
    min_lumpsum_investment: item.min_lumpsum_investment ?? "",
    exit_load: item.exit_load || "",
    is_featured: item.is_featured ? "Yes" : "No",
    is_popular: item.is_popular ? "Yes" : "No",
    fund_objective: item.fund_objective || "",
    investment_strategy: item.investment_strategy || "",
    top_holdings: Array.isArray(item.top_holdings) ? item.top_holdings.join(", ") : "",
    equity_pct: item.asset_allocation?.equity_pct ?? "",
    debt_pct: item.asset_allocation?.debt_pct ?? "",
    other_pct: item.asset_allocation?.other_pct ?? "",
    tax_type: item.tax_type || "",
    riskometer_label: item.riskometer_label || "",
    is_active: item.is_active === 1 ? "Yes" : "No",
  }));
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
    return_1y: item.returns?.y1 ?? "",
    return_3y: item.returns?.y3 ?? "",
    return_5y: item.returns?.y5 ?? "",
    return_10y: item.returns?.y10 ?? "",
    last_updated_date: toIsoDate(item.last_updated_date),
    is_active: item.is_active === 1 ? "Yes" : "No",
  }));
};

const runImportPipeline = async (
  workbook: XLSX.WorkBook,
  entity: MfImportEntity,
  validateOnly: boolean,
) => {
  const summary = newSummary();
  const errors: ImportError[] = [];
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
          validateOnly,
          processedSheets,
          runtime,
        );
      }
    }
  } else {
    await processRows(
      workbook,
      entity,
      summary,
      errors,
      validateOnly,
      processedSheets,
      runtime,
    );
  }

  return {
    entity,
    validateOnly,
    processedSheets,
    summary,
    errorCount: errors.length,
    errors: errors.slice(0, 500),
  };
};

export const importMfExcel = async ({
  filePath,
  entity,
  validateOnly = false,
}: ImportOptions) => {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Excel file not found at path: ${resolvedPath}`);
  }

  const workbook = XLSXModule.readFile(resolvedPath, { cellDates: true });
  requireWorkbookPresence(workbook, entity);

  if (!validateOnly) {
    const validationReport = await runImportPipeline(workbook, entity, true);
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

  const report = await runImportPipeline(workbook, entity, validateOnly);

  return {
    success: true,
    filePath: resolvedPath,
    fileName: path.basename(resolvedPath),
    sheetsDetected: workbook.SheetNames || [],
    ...report,
  };
};

export const exportMfExcel = async ({ entity }: ExportOptions) => {
  const workbook = buildWorkbook();

  if (entity === "full-workbook") {
    appendSheet(workbook, "Main_Categories", await exportMainCategoriesRows(), MAIN_CATEGORY_HEADERS);
    appendSheet(workbook, "Categories_Master", await exportCategoryRows(), CATEGORY_HEADERS);
    appendSheet(workbook, "AMCs", await exportAmcRows(), AMC_HEADERS);
    appendSheet(workbook, "Popular_Funds", await exportFundRows(true), FUND_HEADERS);
    appendSheet(workbook, "Scheme_Details", await exportFundRows(false), FUND_HEADERS);
    appendSheet(workbook, "NFO_List", await exportNfoRows(), NFO_HEADERS);
    appendSheet(workbook, "Index_Data", await exportIndexSnapshotRows(), INDEX_SNAPSHOT_HEADERS);
  } else if (entity === "main-categories") {
    appendSheet(workbook, getPrimarySheetName("main-categories"), await exportMainCategoriesRows(), MAIN_CATEGORY_HEADERS);
  } else if (entity === "categories") {
    appendSheet(workbook, getPrimarySheetName("categories"), await exportCategoryRows(), CATEGORY_HEADERS);
  } else if (entity === "amcs") {
    appendSheet(workbook, getPrimarySheetName("amcs"), await exportAmcRows(), AMC_HEADERS);
  } else if (entity === "funds") {
    appendSheet(workbook, "Scheme_Details", await exportFundRows(false), FUND_HEADERS);
  } else if (entity === "nfo") {
    appendSheet(workbook, getPrimarySheetName("nfo"), await exportNfoRows(), NFO_HEADERS);
  } else if (entity === "index-snapshots") {
    appendSheet(workbook, getPrimarySheetName("index-snapshots"), await exportIndexSnapshotRows(), INDEX_SNAPSHOT_HEADERS);
  }

  const buffer = XLSXModule.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return {
    fileName: `mf-${entity}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  };
};
