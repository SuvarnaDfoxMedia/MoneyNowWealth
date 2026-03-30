import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import MFMainCategory from "../models/mfMainCategoryModel";
import MFCategory from "../models/mfCategoryModel";
import MFAmc from "../models/mfAmcModel";
import MFFund from "../models/mfFundModel";
import MFNfo from "../models/mfNfoModel";
import MFIndexSnapshot from "../models/mfIndexSnapshotModel";
import { toBoolean, toDateOrNull, toNumberOrNull } from "./mfUtils";

const XLSXModule: any = (XLSX as any).default || XLSX;

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
  dryRun?: boolean;
};

const newSection = (): ImportSection => ({
  inserted: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
});

const headerKey = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

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
  const rows = XLSXModule.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];
  return rows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) normalized[headerKey(k)] = v;
    return normalized;
  });
};

const ensureMainCategory = async (
  fundTypeRaw: unknown,
  summary: ImportSummary,
  dryRun: boolean,
) => {
  const name = String(fundTypeRaw || "").trim();
  if (!name) return null;
  const existing = await MFMainCategory.findOne({
    name: new RegExp(`^${name}$`, "i"),
    is_deleted: false,
  }).select("_id name");

  if (!existing) {
    summary.mainCategories.inserted += 1;
    if (!dryRun) {
      await MFMainCategory.create({
        name,
        is_active: 1,
        is_deleted: false,
      });
    } else {
      return { _id: undefined };
    }
  } else if (existing.name !== name) {
    summary.mainCategories.updated += 1;
    if (!dryRun) {
      await MFMainCategory.updateOne({ _id: existing._id }, { name, is_active: 1, is_deleted: false });
    }
  } else {
    summary.mainCategories.skipped += 1;
  }

  return await MFMainCategory.findOne({ name: new RegExp(`^${name}$`, "i"), is_deleted: false }).select("_id");
};

const ensureAmc = async (amcNameRaw: unknown, summary: ImportSummary, dryRun: boolean) => {
  const name = String(amcNameRaw || "").trim();
  if (!name) return null;
  const existing = await MFAmc.findOne({ name }).select("_id name");
  if (existing) {
    summary.amcs.skipped += 1;
    return existing;
  }

  summary.amcs.inserted += 1;
  if (dryRun) return null;
  return await MFAmc.create({
    name,
    is_active: 1,
    is_deleted: false,
  });
};

const parseNumber = (row: Record<string, unknown>, aliases: string[]) =>
  toNumberOrNull(valueByAliases(row, aliases));

const parseDate = (row: Record<string, unknown>, aliases: string[]) =>
  toDateOrNull(valueByAliases(row, aliases));

const findCategoryByRow = async (
  row: Record<string, unknown>,
  categoryMap: Map<string, string>,
  dryRun: boolean,
) => {
  const categoryId = valueByAliases(row, ["category_id", "categoryid", "sub_category_id"]);
  const categoryName = valueByAliases(row, ["category_name", "category"]);

  if (categoryId !== undefined) {
    const mappedId = categoryMap.get(String(categoryId).trim());
    if (mappedId) return dryRun ? ({ _id: mappedId } as any) : MFCategory.findById(mappedId).select("_id name");
  }

  if (categoryName !== undefined) {
    const byName = await MFCategory.findOne({
      name: new RegExp(`^${String(categoryName).trim()}$`, "i"),
      is_deleted: false,
    }).select("_id");
    if (byName) return byName;
  }

return null;
};

const upsertCategoryMaster = async (
  row: Record<string, unknown>,
  idx: number,
  summary: ImportSummary,
  errors: ImportError[],
  categoryMap: Map<string, string>,
  dryRun: boolean,
) => {
  const categoryId = String(valueByAliases(row, ["category_id", "categoryid", "sub_category_id"]) || "").trim();
  const categoryName = String(valueByAliases(row, ["category_name", "subcategory_name", "sub_category_name"]) || "").trim();
  const fundType = valueByAliases(row, [
    "fund_type",
    "fund_type_equity_hybrid_debt_index_elss",
    "main_category",
    "category_type",
  ]);

  if (!categoryId || !categoryName || !fundType) {
    summary.categories.skipped += 1;
    return;
  }

  try {
    const mainCategory = await ensureMainCategory(fundType, summary, dryRun);
    if (!mainCategory) {
      summary.categories.errors += 1;
      errors.push({ sheet: "Categories_Master", row: idx + 2, message: "Main category not found", identifier: categoryId });
      return;
    }

    const existing = await MFCategory.findOne({
      name: new RegExp(`^${categoryName}$`, "i"),
      main_category_id: mainCategory._id,
      is_deleted: false,
    }).select("_id name");
    const nextData: Record<string, unknown> = {
      name: categoryName,
      main_category_id: mainCategory._id,
      description: String(valueByAliases(row, ["short_description", "description"]) || "").trim(),
      benchmark_index_name: String(valueByAliases(row, ["benchmark_index_name", "benchmark"]) || "").trim(),
      benchmark_return_type:
        String(valueByAliases(row, ["benchmark_return_type", "benchmark_type", "return_type"]) || "Trailing")
          .trim()
          .toLowerCase() === "annual"
          ? "Annual"
          : "Trailing",
      benchmark_returns: {
        y1: parseNumber(row, ["benchmark_y1", "benchmark_1y", "benchmark_1y_return", "y1"]),
        y3: parseNumber(row, ["benchmark_y3", "benchmark_3y", "benchmark_3y_return", "y3"]),
        y5: parseNumber(row, ["benchmark_y5", "benchmark_5y", "benchmark_5y_return", "y5"]),
        y10: parseNumber(row, ["benchmark_y10", "benchmark_10y", "benchmark_10y_return", "y10"]),
      },
      category_average_returns: {
        y1: parseNumber(row, ["category_average_y1", "category_avg_1y", "category_average_1y"]),
        y3: parseNumber(row, ["category_average_y3", "category_avg_3y", "category_average_3y"]),
        y5: parseNumber(row, ["category_average_y5", "category_avg_5y", "category_average_5y"]),
        y10: parseNumber(row, ["category_average_y10", "category_avg_10y", "category_average_10y"]),
      },
      risk_level: String(valueByAliases(row, ["risk_level", "risk_level_low_moderate_high", "risk"]) || "").trim(),
      suggested_use_case: String(valueByAliases(row, ["suggested_use_case", "use_case"]) || "").trim(),
      suggested_use_case_note: String(
        valueByAliases(row, ["suggested_use_case_note", "use_case_note", "use_case_description"]) || "",
      ).trim(),
      is_active: toBoolean(valueByAliases(row, ["is_active", "is_active_yes_no"]), true) ? 1 : 0,
      is_deleted: false,
    };

    if (!existing) {
      summary.categories.inserted += 1;
      if (!dryRun) {
        const created = await MFCategory.create({ ...nextData });
        categoryMap.set(categoryId, String(created._id));
      } else {
        categoryMap.set(categoryId, `dry-run-${categoryId}`);
      }
      return;
    }

    summary.categories.updated += 1;
    if (!dryRun) {
      await MFCategory.updateOne({ _id: existing._id }, { ...nextData });
      categoryMap.set(categoryId, String(existing._id));
    } else {
      categoryMap.set(categoryId, `dry-run-${categoryId}`);
    }
  } catch (error: any) {
    summary.categories.errors += 1;
    errors.push({
      sheet: "Categories_Master",
      row: idx + 2,
      message: error?.message || "Failed to process category row",
      identifier: categoryId || categoryName,
    });
  }
};

const upsertFund = async (
  row: Record<string, unknown>,
  idx: number,
  sourceSheet: string,
  summary: ImportSummary,
  errors: ImportError[],
  categoryMap: Map<string, string>,
  dryRun: boolean,
) => {
  const fundName = String(valueByAliases(row, ["fund_name", "scheme_name", "fund"]) || "").trim();
  const schemeCode = String(valueByAliases(row, ["scheme_code", "schemecode", "code"]) || "").trim();

  if (!fundName) {
    summary.funds.skipped += 1;
    return;
  }

  try {
    const category = await findCategoryByRow(row, categoryMap, dryRun);
    if (!category) {
      summary.funds.errors += 1;
      errors.push({
        sheet: sourceSheet,
        row: idx + 2,
        message: "Category mapping not found",
        identifier: fundName,
      });
      return;
    }

    const amcName = valueByAliases(row, ["amc_name", "amc", "fund_house"]);
    const amc = await ensureAmc(amcName, summary, dryRun);
    const resolvedAmcId = amc?._id;
    if (!resolvedAmcId) {
      summary.funds.errors += 1;
      errors.push({
        sheet: sourceSheet,
        row: idx + 2,
        message: "AMC mapping not found",
        identifier: fundName,
      });
      return;
    }
    const planTypeRaw = String(
      valueByAliases(row, ["plan_type", "plan_type_regular_direct", "plan"]) || "",
    ).trim();
    const optionTypeRaw = String(
      valueByAliases(row, ["option_type", "option_growth_idcw", "option"]) || "",
    ).trim();
    const plan_type = ["Regular", "Direct"].includes(planTypeRaw) ? planTypeRaw : "";
    const option_type = ["Growth", "IDCW"].includes(optionTypeRaw) ? optionTypeRaw : "";

    const existing =
      (schemeCode
        ? await MFFund.findOne({
            scheme_code: schemeCode,
            is_deleted: false,
          }).select("_id")
        : null) ||
      (await MFFund.findOne({
        fund_name: fundName,
        amc_id: resolvedAmcId,
        category_id: category._id,
        plan_type,
        option_type,
      }).select("_id"));

    const nextData: Record<string, unknown> = {
      scheme_code: schemeCode,
      fund_name: fundName,
      amc_id: resolvedAmcId,
      category_id: category._id,
      plan_type,
      option_type,
      aum_cr: parseNumber(row, ["aum_cr", "aum"]),
      expense_ratio: parseNumber(row, ["expense_ratio", "expense"]),
      returns: {
        d1: parseNumber(row, ["return_1d", "1d_return", "d1", "returns_1d"]) ?? 0,
        m1: parseNumber(row, ["return_1m", "1m_return", "m1", "returns_1m"]) ?? 0,
        m3: parseNumber(row, ["return_3m", "3m_return", "m3", "returns_3m"]) ?? 0,
        m6: parseNumber(row, ["return_6m", "6m_return", "m6", "returns_6m"]) ?? 0,
        y1: parseNumber(row, ["return_1y", "1y_return", "y1", "returns_y1"]),
        y3_cagr: parseNumber(row, ["return_3y_cagr", "3y_cagr", "y3_cagr", "returns_y3_cagr"]),
        y5_cagr: parseNumber(row, ["return_5y_cagr", "5y_cagr", "y5_cagr", "returns_y5_cagr"]),
        y10_cagr: parseNumber(row, ["return_10y_cagr", "10y_cagr", "y10_cagr", "returns_y10_cagr"]),
      },
      risk_metrics: {
        sharpe_3y: parseNumber(row, ["sharpe_3y", "sharpe_ratio_3y", "sharpe"]),
        std_dev_3y: parseNumber(row, ["std_dev_3y", "std_dev"]),
        beta_3y: parseNumber(row, ["beta_3y", "beta"]),
        alpha_3y: parseNumber(row, ["alpha_3y", "alpha"]),
        max_drawdown_5y: parseNumber(row, ["max_drawdown_5y", "max_drawdown"]),
        turnover_ratio: parseNumber(row, ["turnover_ratio", "portfolio_turnover_ratio", "turnover"]),
      },
      fund_manager: String(valueByAliases(row, ["fund_manager", "manager"]) || "").trim(),
      launch_date: parseDate(row, ["launch_date", "inception_date"]),
      benchmark_index_name: String(
        valueByAliases(row, ["benchmark_index_name", "benchmark"]) || "",
      ).trim(),
      benchmark_returns_trailing: {
        d1: parseNumber(row, ["benchmark_trailing_1d", "benchmark_1d", "benchmark_return_1d"]) ?? 0,
        m1: parseNumber(row, ["benchmark_trailing_1m", "benchmark_1m", "benchmark_return_1m"]) ?? 0,
        m3: parseNumber(row, ["benchmark_trailing_3m", "benchmark_3m", "benchmark_return_3m"]) ?? 0,
        m6: parseNumber(row, ["benchmark_trailing_6m", "benchmark_6m", "benchmark_return_6m"]) ?? 0,
        y1: parseNumber(row, ["benchmark_trailing_1y", "benchmark_1y", "benchmark_return_1y"]),
        y3: parseNumber(row, ["benchmark_trailing_3y", "benchmark_3y", "benchmark_return_3y"]),
        y5: parseNumber(row, ["benchmark_trailing_5y", "benchmark_5y", "benchmark_return_5y"]),
        y10: parseNumber(row, ["benchmark_trailing_10y", "benchmark_10y", "benchmark_return_10y"]),
      },
      benchmark_returns_annual: {
        y1: parseNumber(row, ["benchmark_annual_1y", "benchmark_annual_return_1y"]),
        y3: parseNumber(row, ["benchmark_annual_3y", "benchmark_annual_return_3y"]),
        y5: parseNumber(row, ["benchmark_annual_5y", "benchmark_annual_return_5y"]),
        y10: parseNumber(row, ["benchmark_annual_10y", "benchmark_annual_return_10y"]),
      },
      min_investment: parseNumber(row, ["min_investment", "minimum_investment"]),
      sip_allowed: toBoolean(valueByAliases(row, ["sip_allowed", "sip_enabled", "sip_active"]), true),
      min_sip_investment: parseNumber(row, [
        "min_sip_investment",
        "minimum_sip_investment",
        "sip_min_investment",
      ]),
      lumpsum_allowed: toBoolean(
        valueByAliases(row, ["lumpsum_allowed", "lumpsum_enabled", "lumpsum_active"]),
        true,
      ),
      min_lumpsum_investment: parseNumber(row, [
        "min_lumpsum_investment",
        "minimum_lumpsum_investment",
        "lumpsum_min_investment",
        "lump_sum_min_investment",
      ]),
      exit_load: String(valueByAliases(row, ["exit_load", "exit_load_details"]) || "").trim(),
      is_featured: toBoolean(valueByAliases(row, ["is_featured", "is_featured_yes_no", "featured"]), false),
      fund_objective: String(valueByAliases(row, ["fund_objective", "objective"]) || "").trim(),
      investment_strategy: String(valueByAliases(row, ["investment_strategy", "strategy"]) || "").trim(),
      top_holdings: String(valueByAliases(row, ["top_holdings", "top_5_holdings"]) || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      asset_allocation: {
        equity_pct: parseNumber(row, ["equity_pct", "equity"]),
        debt_pct: parseNumber(row, ["debt_pct", "debt"]),
        other_pct: parseNumber(row, ["other_pct", "other"]),
      },
      tax_type: String(valueByAliases(row, ["tax_type"]) || "").trim(),
      riskometer_label: String(valueByAliases(row, ["riskometer_label", "riskometer"]) || "").trim(),
      is_active: 1,
      is_deleted: false,
    };

    if (!existing) {
      summary.funds.inserted += 1;
      if (!dryRun) {
        await MFFund.create({ ...nextData });
      }
      return;
    }

    summary.funds.updated += 1;
    if (!dryRun) {
      await MFFund.updateOne({ _id: existing._id }, { ...nextData });
    }
  } catch (error: any) {
    summary.funds.errors += 1;
    errors.push({
      sheet: sourceSheet,
      row: idx + 2,
      message: error?.message || "Failed to process fund row",
      identifier: fundName,
    });
  }
};

const upsertNfo = async (
  row: Record<string, unknown>,
  idx: number,
  summary: ImportSummary,
  errors: ImportError[],
  categoryMap: Map<string, string>,
  dryRun: boolean,
) => {
  const nfoId = String(valueByAliases(row, ["nfo_id", "nfoid", "code"]) || "").trim();
  const fundName = String(valueByAliases(row, ["fund_name", "scheme_name", "nfo_name"]) || "").trim();
  if (!fundName) {
    summary.nfos.skipped += 1;
    return;
  }

  try {
    const category = await findCategoryByRow(row, categoryMap, dryRun);
    if (!category) {
      summary.nfos.errors += 1;
      errors.push({ sheet: "NFO_List", row: idx + 2, message: "Category mapping not found", identifier: fundName });
      return;
    }

    const amc = await ensureAmc(valueByAliases(row, ["amc_name", "amc", "fund_house"]), summary, dryRun);
    const resolvedAmcId = amc?._id;
    if (!resolvedAmcId) {
      summary.nfos.errors += 1;
      errors.push({ sheet: "NFO_List", row: idx + 2, message: "AMC mapping not found", identifier: fundName });
      return;
    }

    const startDate = parseDate(row, ["subscription_start_date", "open_date"]);
    const endDate = parseDate(row, ["subscription_end_date", "close_date"]);
    if (startDate && endDate && endDate < startDate) {
      summary.nfos.errors += 1;
      errors.push({
        sheet: "NFO_List",
        row: idx + 2,
        message: "subscription_end_date must be greater than or equal to subscription_start_date",
        identifier: fundName,
      });
      return;
    }

    const existing =
      (nfoId
        ? await MFNfo.findOne({
            nfo_id: nfoId,
            is_deleted: false,
          }).select("_id")
        : null) ||
      (await MFNfo.findOne({
        fund_name: fundName,
        amc_id: resolvedAmcId,
        category_id: category._id,
        subscription_start_date: startDate || null,
        subscription_end_date: endDate || null,
      }).select("_id"));

    const nextData: Record<string, unknown> = {
      nfo_id: nfoId,
      fund_name: fundName,
      amc_id: resolvedAmcId,
      category_id: category._id,
      fund_objective_short: String(valueByAliases(row, ["fund_objective_short", "objective"]) || "").trim(),
      subscription_start_date: startDate,
      subscription_end_date: endDate,
      min_investment: parseNumber(row, ["min_investment", "minimum_investment"]),
      benchmark: String(valueByAliases(row, ["benchmark"]) || "").trim(),
      risk_level: String(valueByAliases(row, ["risk_level", "risk"]) || "").trim(),
      is_open: toBoolean(valueByAliases(row, ["is_open", "open"]), true),
      is_active: 1,
      is_deleted: false,
    };

    if (!existing) {
      summary.nfos.inserted += 1;
      if (!dryRun) {
        await MFNfo.create({ ...nextData });
      }
      return;
    }

    summary.nfos.updated += 1;
    if (!dryRun) {
      await MFNfo.updateOne({ _id: existing._id }, { ...nextData });
    }
  } catch (error: any) {
    summary.nfos.errors += 1;
    errors.push({
      sheet: "NFO_List",
      row: idx + 2,
      message: error?.message || "Failed to process NFO row",
      identifier: fundName,
    });
  }
};

const upsertIndexSnapshot = async (
  row: Record<string, unknown>,
  idx: number,
  summary: ImportSummary,
  errors: ImportError[],
  categoryMap: Map<string, string>,
  dryRun: boolean,
) => {
  const benchmarkIndexName = String(
    valueByAliases(row, ["benchmark_index_name", "benchmark", "index_name"]) || "",
  ).trim();
  const dateValue = parseDate(row, ["last_updated_date", "date", "as_on_date"]);

  if (!benchmarkIndexName || !dateValue) {
    summary.indexSnapshots.skipped += 1;
    return;
  }

  try {
    const category = await findCategoryByRow(row, categoryMap, dryRun);
    let mainCategoryId: string | null = null;
    if (category?._id) {
      const categoryDoc = dryRun ? null : await MFCategory.findById(category._id).select("main_category_id");
      mainCategoryId = (categoryDoc?.main_category_id as any) || null;
    }
    const existing = await MFIndexSnapshot.findOne({
      benchmark_index_name: benchmarkIndexName,
      last_updated_date: dateValue,
    }).select("_id");

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
      last_updated_date: dateValue,
      is_active: 1,
      is_deleted: false,
    };

    if (!existing) {
      summary.indexSnapshots.inserted += 1;
      if (!dryRun) await MFIndexSnapshot.create(nextData);
      return;
    }

    summary.indexSnapshots.updated += 1;
    if (!dryRun) await MFIndexSnapshot.updateOne({ _id: existing._id }, nextData);
  } catch (error: any) {
    summary.indexSnapshots.errors += 1;
    errors.push({
      sheet: "Index_Data",
      row: idx + 2,
      message: error?.message || "Failed to process index snapshot row",
      identifier: benchmarkIndexName,
    });
  }
};

export const importMfExcel = async ({ filePath, dryRun = false }: ImportOptions) => {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Excel file not found at path: ${resolvedPath}`);
  }

  const workbook = XLSXModule.readFile(resolvedPath, { cellDates: true });
  const sheetNames = workbook.SheetNames || [];

  const summary: ImportSummary = {
    mainCategories: newSection(),
    categories: newSection(),
    amcs: newSection(),
    funds: newSection(),
    nfos: newSection(),
    indexSnapshots: newSection(),
  };
  const errors: ImportError[] = [];
  const categoryMap = new Map<string, string>();

  const categoriesRows = normalizeSheetRows(workbook, "Categories_Master");
  for (let i = 0; i < categoriesRows.length; i += 1) {
    await upsertCategoryMaster(categoriesRows[i], i, summary, errors, categoryMap, dryRun);
  }

  const popularFundRows = normalizeSheetRows(workbook, "Popular_Funds");
  for (let i = 0; i < popularFundRows.length; i += 1) {
    await upsertFund(popularFundRows[i], i, "Popular_Funds", summary, errors, categoryMap, dryRun);
  }

  const fundDetailRows = normalizeSheetRows(workbook, "Scheme_Details");
  for (let i = 0; i < fundDetailRows.length; i += 1) {
    await upsertFund(fundDetailRows[i], i, "Scheme_Details", summary, errors, categoryMap, dryRun);
  }

  const nfoRows = normalizeSheetRows(workbook, "NFO_List");
  for (let i = 0; i < nfoRows.length; i += 1) {
    await upsertNfo(nfoRows[i], i, summary, errors, categoryMap, dryRun);
  }

  const indexRows = normalizeSheetRows(workbook, "Index_Data");
  for (let i = 0; i < indexRows.length; i += 1) {
    await upsertIndexSnapshot(indexRows[i], i, summary, errors, categoryMap, dryRun);
  }

  return {
    success: true,
    filePath: resolvedPath,
    dryRun,
    sheetsDetected: sheetNames,
    summary,
    errorCount: errors.length,
    errors: errors.slice(0, 200),
  };
};
