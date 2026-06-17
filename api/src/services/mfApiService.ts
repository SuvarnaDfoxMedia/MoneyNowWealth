import axios from "axios";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import MfApiScheme from "../models/mfApiSchemeModel";
import MfApiSyncLog from "../models/mfApiSyncLogModel";
import MfApiNavHistory from "../models/mfApiNavHistoryModel";
import MFFund from "../models/mfFundModel";
import { syncApiSchemeToManual } from "./mfApiBridgeService";
import { recomputeAllCategoryAverageReturns } from "./mfCategoryService";
import { parseSchemeTitle } from "../utils/schemeParser";

const MF_API_BASE =
  (process.env.MF_EXTERNAL_API_BASE || "https://mfapi.advisorkhoj.com").trim();
const MF_API_KEY =
  (process.env.MF_EXTERNAL_API_KEY || "42842c3f-57f9-4444-8dc8-953c1183e99b").trim();

type SyncContext = {
  userId?: string;
  role?: string;
};

type RawObject = Record<string, any>;

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.list)) return value.list;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.result)) return value.result;
  if (Array.isArray(value?.schemes)) return value.schemes;
  if (Array.isArray(value?.scheme_list)) return value.scheme_list;
  return [];
};

const pick = (source: RawObject | null | undefined, keys: string[]) => {
  if (!source || typeof source !== "object") return "";
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

const normalizeString = (value: unknown) => String(value ?? "").trim();

const normalizeDate = (value: unknown) => {
  if (!value) return null;
  const text = String(value).trim();
  const dayFirst = text.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  let parsed: Date;
  if (dayFirst) {
    const [, dd, mm, yyyy] = dayFirst;
    parsed = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
  } else {
    parsed = new Date(text);
  }
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(String(value).replace(/,/g, "").replace(/%/g, "").trim());
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(text)) return true;
  if (["0", "false", "no", "n"].includes(text)) return false;
  return null;
};

const asList = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.list)) return value.list;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.result)) return value.result;
  if (Array.isArray(value?.items)) return value.items;
  return null;
};

const detailSource = (payload: RawObject, latestInfo?: RawObject | null) => ({
  ...payload,
  ...(latestInfo || {}),
});

const buildExternalKey = (payload: RawObject) => {
  const schemeCode = normalizeString(
    pick(payload, [
      "scheme_code",
      "schemeCode",
      "code",
      "scheme_id",
      "schemeId",
      "scheme_amfi_code",
      "scheme_isin",
    ]),
  );
  const name = normalizeString(
    pick(payload, [
      "scheme_name",
      "schemeName",
      "name",
      "fund_name",
      "scheme",
      "scheme_amfi",
    ]),
  );
  const plan = normalizeString(pick(payload, ["plan_type", "planType", "plan"])).toLowerCase();
  const option = normalizeString(
    pick(payload, ["option_type", "optionType", "option"]),
  ).toLowerCase();
  const fallback = [name, plan, option].filter(Boolean).join("|");
  return schemeCode || fallback;
};
const inferPlanType = (name: string): string => {
  const lower = name.toLowerCase();
  if (/\bdirect\b/.test(lower)) return "Direct";
  if (/\bregular\b/.test(lower)) return "Regular";
  return "";
};

const inferOptionType = (name: string): string => {
  const lower = name.toLowerCase();
  if (/\bdividend\b/.test(lower) || /\bidcw\b/.test(lower)) return "Dividend";
  if (/\bgrowth\b/.test(lower)) return "Growth";
  if (/\bbonus\b/.test(lower)) return "Bonus";
  return "";
};

const normalizeScheme = (payload: RawObject, latestInfo?: RawObject | null) => {
  const source = detailSource(payload, latestInfo);
  const schemeName = normalizeString(
    pick(payload, [
      "scheme_name",
      "schemeName",
      "name",
      "fund_name",
      "scheme",
      "scheme_amfi",
    ]),
  );
  const externalSchemeId = normalizeString(
    pick(payload, [
      "scheme_id",
      "schemeId",
      "scheme_code",
      "schemeCode",
      "scheme_amfi_code",
      "scheme_isin",
    ]),
  );
  const amcName = normalizeString(
    pick(payload, [
      "amc_name",
      "amcName",
      "amc",
      "fund_house",
      "company_name",
      "scheme_company",
    ]),
  );
  const schemeCode = normalizeString(
    pick(payload, ["scheme_code", "schemeCode", "scheme_amfi_code"]),
  );
  const isin = normalizeString(
    pick(payload, ["isin", "isin_no", "isinNumber", "isin_number", "scheme_isin"]),
  );
  const planType = (() => {
    const explicit = normalizeString(
      pick(payload, ["plan_type", "planType", "plan", "scheme_plan"]),
    );
    return explicit || inferPlanType(schemeName);
  })();
  const optionType = (() => {
    const explicit = normalizeString(
      pick(payload, ["option_type", "optionType", "option", "scheme_option"]),
    );
    return explicit || inferOptionType(schemeName);
  })();
  const category = normalizeString(
    pick(payload, [
      "category",
      "scheme_category",
      "category_name",
      "scheme_advisorkhoj_category",
    ]),
  );
  const subCategory = normalizeString(
    pick(payload, ["sub_category", "subCategory", "subcategory"]),
  );
  const latestNav = normalizeNumber(
    pick(source, [
      "nav",
      "latest_nav",
      "latestNav",
      "nav_value",
      "current_nav",
      "scheme_nav",
    ]),
  );
  const latestDate = normalizeDate(
    pick(source, ["nav_date", "latest_date", "latestDate", "date", "scheme_date"]),
  );
  const latestInfoPayload = {
    nav_change: normalizeNumber(
      pick(source, [
        "nav_change",
        "latest_nav_change",
        "change",
        "navChange",
      ]),
    ),
    nav_change_percentage: normalizeNumber(
      pick(source, [
        "nav_change_percentage",
        "navChangePercentage",
        "change_percentage",
        "nav_pct_change",
      ]),
    ),
  };

  const performanceList =
    asList(
      pick(source, [
        "scheme_performance_list",
        "performance_list",
        "performance",
        "return_list",
      ]),
    ) ?? [];
  const riskStatisticsList =
    asList(
      pick(source, [
        "risk_statistics_list",
        "risk_statistics",
        "risk_list",
        "riskStats",
      ]),
    ) ?? [];
  const peerComparisonList =
    asList(
      pick(source, [
        "scheme_peer_comparision_list",
        "scheme_peer_comparison_list",
        "peer_comparison_list",
        "peer_list",
      ]),
    ) ?? [];

  return {
    external_key: buildExternalKey(payload),
    external_scheme_id: externalSchemeId,
    scheme_name: schemeName || "Unnamed Scheme",
    amc_name: amcName,
    scheme_code: schemeCode,
    isin,
    plan_type: planType,
    option_type: optionType,
    category,
    sub_category: subCategory,
    latest_nav: latestNav,
    latest_date: latestDate,
    latest_info: latestInfoPayload,
    latest_info_raw: latestInfo ?? null,
    scheme_objective: normalizeString(
      pick(source, ["scheme_objective", "objective", "fund_objective"]),
    ),
    scheme_manager: normalizeString(
      pick(source, ["scheme_manager", "manager", "fund_manager"]),
    ),
    riskometer_value: normalizeString(
      pick(source, ["riskometer_value", "riskometer_label", "riskometer"]),
    ),
    scheme_inception_date: normalizeDate(
      pick(source, ["scheme_inception_date", "launch_date", "inception_date"]),
    ),
    asset_class: normalizeString(pick(source, ["asset_class", "assetClass"])),
    scheme_benchmark: normalizeString(
      pick(source, ["scheme_benchmark", "benchmark", "benchmark_name"]),
    ),
    scheme_status: normalizeString(pick(source, ["scheme_status", "scheme_open_close"])),
    minimum_investment: normalizeNumber(
      pick(source, ["minimum_investment", "min_investment", "min_lumpsum_investment"]),
    ),
    sip_minimum_amount: normalizeNumber(
      pick(source, ["sip_minimum_amount", "min_sip_investment", "sip_minimum_investment"]),
    ),
    minimum_topup: normalizeNumber(pick(source, ["minimum_topup", "topup_amount"])),
    exit_load: normalizeString(pick(source, ["exit_load", "exitLoad"])),
    expense_ratio_percentage: normalizeNumber(
      pick(source, ["expense_ratio_percentage", "expense_ratio", "expenseRatio"]),
    ),
    expense_ratio_date: normalizeDate(
      pick(source, ["expense_ratio_date", "expenseRatioDate"]),
    ),
    scheme_assets: normalizeNumber(
      pick(source, ["scheme_assets", "aum", "aum_cr", "assets", "asset_value"]),
    ),
    scheme_asset_date: normalizeDate(
      pick(source, ["scheme_asset_date", "asset_date", "aum_date"]),
    ),
    scheme_turnover: normalizeString(
      pick(source, ["scheme_turnover", "turnover_ratio", "turnover"]),
    ),
    rating: normalizeString(pick(source, ["rating", "scheme_rating"])),
    rating_value: normalizeNumber(pick(source, ["rating_value", "ratingScore"])),
    market_cap_largecap_percent: normalizeNumber(
      pick(source, ["market_cap_largecap_percent", "large_cap_pct"]),
    ),
    market_cap_midcap_percent: normalizeNumber(
      pick(source, ["market_cap_midcap_percent", "mid_cap_pct"]),
    ),
    market_cap_smallcap_percent: normalizeNumber(
      pick(source, ["market_cap_smallcap_percent", "small_cap_pct"]),
    ),
    scheme_inception_return: normalizeNumber(
      pick(source, ["scheme_inception_return", "since_inception", "inception_return"]),
    ),
    benchmark_inception_return: normalizeNumber(
      pick(source, ["benchmark_inception_return", "benchmark_inception_return_pct"]),
    ),
    upmarket_capture_ratio: normalizeNumber(
      pick(source, ["upmarket_capture_ratio", "upmarketCaptureRatio"]),
    ),
    downmarket_capture_ratio: normalizeNumber(
      pick(source, ["downmarket_capture_ratio", "downmarketCaptureRatio"]),
    ),
    is_dividend_scheme: normalizeBoolean(
      pick(source, ["is_dividend_scheme", "dividend_scheme", "isDividendScheme"]),
    ),
    scheme_performance_list: performanceList,
    risk_statistics_list: riskStatisticsList,
    scheme_peer_comparision_list: peerComparisonList,
    raw_payload: payload,
  };
};

const requestExternalSchemes = async () => {
  const response = await axios.get(`${MF_API_BASE}/getAllMutualFundSchemesRegAndDir`, {
    params: { key: MF_API_KEY },
  });
  return response.data;
};

const requestExternalLatestInfo = async (schemeName: string) => {
  const response = await axios.post(
    `${MF_API_BASE}/getSchemeInfoLatest`,
    {},
    {
      params: { key: MF_API_KEY, scheme: schemeName },
    },
  );
  return response.data;
};

const normalizeLatestInfo = (value: any) => {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return value[0] ?? null;
  if (value?.scheme_info && typeof value.scheme_info === "object") return value.scheme_info;
  if (value?.data && typeof value.data === "object") return value.data;
  if (value?.result && typeof value.result === "object") return value.result;
  return value;
};

const isRateLimitedResponse = (value: any) =>
  Number(value?.status) === 429 ||
  /maximum number of allowed requests exceeded/i.test(String(value?.msg || value?.message || ""));

const getLatestInfoErrorMessage = (value: any) => {
  if (isRateLimitedResponse(value)) return "External API rate limit reached";
  return String(value?.msg || value?.message || value?.status_msg || "Failed to fetch latest info");
};

const createSyncLog = async (payload: {
  action: string;
  status: "success" | "failed" | "running" | "queued" | string;
  message?: string;
  error?: string;
  scheme_id?: string;
  scheme_name?: string;
  external_scheme_id?: string;
  response?: unknown;
  payloadData?: unknown;
  context?: SyncContext;
}) => {
  return MfApiSyncLog.create({
    action: payload.action,
    status: payload.status,
    message: payload.message || "",
    error: payload.error || "",
    scheme_id: payload.scheme_id || null,
    scheme_name: payload.scheme_name || "",
    external_scheme_id: payload.external_scheme_id || "",
    response: payload.response ?? null,
    payload: payload.payloadData ?? null,
    created_by_role: payload.context?.role || "",
    created_by_user: payload.context?.userId || null,
  });
};

// ─── Extract structured fields from raw API response ─────────────────────────

const extractStructuredFields = (latestInfo: RawObject) => {
  const perfList = Array.isArray(latestInfo?.scheme_performance_list)
    ? latestInfo.scheme_performance_list
    : [];

  const schemePerfRow = perfList[0] || {};
  const benchmarkRow  = perfList[1] || {};
  const categoryRow   = perfList[2] || {};

  const riskList = Array.isArray(latestInfo?.risk_statistics_list)
    ? latestInfo.risk_statistics_list
    : [];
  const riskRow = riskList[0] || {};

  const trailing_returns = {
    "1w":         normalizeNumber(schemePerfRow.one_week_return),
    "1m":         normalizeNumber(schemePerfRow.one_month_return),
    "3m":         normalizeNumber(schemePerfRow.three_month_return),
    "6m":         normalizeNumber(schemePerfRow.six_month_return),
    "1y":         normalizeNumber(schemePerfRow.one_year_return),
    "2y":         normalizeNumber(schemePerfRow.two_year_return),
    "3y":         normalizeNumber(schemePerfRow.three_year_return),
    "5y":         normalizeNumber(schemePerfRow.five_year_return),
    "10y":        normalizeNumber(schemePerfRow.ten_year_return),
    since_launch: normalizeNumber(schemePerfRow.inception_year_return),
    ytd:          normalizeNumber(schemePerfRow.ytd_return),
    d1:           null, // Not available from AdvisorKhoj API
  };

  const annual_returns = {
    ytd:            normalizeNumber(schemePerfRow.ytd_return),
    yearly_returns: {}, // NOT available from API — manual import only
  };

  const benchmark_returns = {
    benchmark_name: normalizeString(latestInfo?.scheme_benchmark || benchmarkRow.scheme_name || ""),
    "1w":           normalizeNumber(benchmarkRow.one_week_return),
    "1m":           normalizeNumber(benchmarkRow.one_month_return),
    "3m":           normalizeNumber(benchmarkRow.three_month_return),
    "6m":           normalizeNumber(benchmarkRow.six_month_return),
    "1y":           normalizeNumber(benchmarkRow.one_year_return),
    "2y":           normalizeNumber(benchmarkRow.two_year_return),
    "3y":           normalizeNumber(benchmarkRow.three_year_return),
    "5y":           normalizeNumber(benchmarkRow.five_year_return),
    "10y":          normalizeNumber(benchmarkRow.ten_year_return),
    since_launch:   normalizeNumber(benchmarkRow.inception_year_return),
    ytd:            normalizeNumber(benchmarkRow.ytd_return),
  };

  const category_avg_returns = {
    category_name: normalizeString(categoryRow.scheme_name || ""),
    "1w":          normalizeNumber(categoryRow.one_week_return),
    "1m":          normalizeNumber(categoryRow.one_month_return),
    "3m":          normalizeNumber(categoryRow.three_month_return),
    "6m":          normalizeNumber(categoryRow.six_month_return),
    "1y":          normalizeNumber(categoryRow.one_year_return),
    "2y":          normalizeNumber(categoryRow.two_year_return),
    "3y":          normalizeNumber(categoryRow.three_year_return),
    "5y":          normalizeNumber(categoryRow.five_year_return),
    "10y":         normalizeNumber(categoryRow.ten_year_return),
    since_launch:  normalizeNumber(categoryRow.inception_year_return),
    ytd:           normalizeNumber(categoryRow.ytd_return),
  };

  const risk_metrics = {
    volatility_3y:     normalizeNumber(riskRow.volatility_cm_3year),
    sharpe_3y:         normalizeNumber(riskRow.sharpratio_cm_3year),
    alpha_1y:          normalizeNumber(riskRow.alpha_cm_1year),
    beta_1y:           normalizeNumber(riskRow.beta_cm_1year),
    sortino:           normalizeNumber(riskRow.shortino_ratio),
    yield_to_maturity: normalizeNumber(riskRow.yield_to_maturity),
    average_maturity:  normalizeNumber(riskRow.average_maturity),
  };

  const market_cap = {
    large_cap_pct: normalizeNumber(latestInfo?.market_cap_largecap_percent),
    mid_cap_pct:   normalizeNumber(latestInfo?.market_cap_midcap_percent),
    small_cap_pct: normalizeNumber(latestInfo?.market_cap_smallcap_percent),
  };

  return {
    trailing_returns,
    annual_returns,
    benchmark_returns,
    category_avg_returns,
    risk_metrics,
    market_cap,
    nav_change:            normalizeNumber(latestInfo?.nav_change),
    nav_change_percentage: normalizeNumber(latestInfo?.nav_change_percentage),
  };
};

// ─────────────────────────────────────────────────────────────────────────────

const upsertScheme = async (payload: RawObject, latestInfo?: RawObject | null) => {
  const normalized = normalizeScheme(payload, latestInfo);
  const structured = latestInfo ? extractStructuredFields(latestInfo) : {};
  const existing = await MfApiScheme.findOne({
    external_key: normalized.external_key,
    is_deleted: { $ne: true },
  });

  let sync_status = "queued";
  let last_sync_error = "";

  if (latestInfo !== null) {
    const hasNav = normalized.latest_nav !== null && normalized.latest_nav !== undefined;
    const hasSchemeCode = Boolean(normalized.scheme_code);
    const hasSchemeName = Boolean(normalized.scheme_name);
    
    const tr = (structured as any).trailing_returns || {};
    const hasTrailingReturns = Object.values(tr).some(v => v !== null && v !== undefined);

    if (hasNav && hasSchemeCode && hasSchemeName && hasTrailingReturns) {
      sync_status = "success";
    } else {
      sync_status = "failed";
      last_sync_error = "API returned empty or invalid object data";
    }
  }

  const updateData = {
    ...normalized,
    ...structured,
    sync_status,
    last_synced_at: new Date(),
    last_sync_error,
  };

  if (existing) {
    return MfApiScheme.findByIdAndUpdate(existing._id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  return MfApiScheme.create(updateData);
};

type SyncOptions = {
  activeOnly?: boolean;
  offlineMode?: boolean;
};

export const syncAllSchemes = async (context: SyncContext = {}, options: SyncOptions = {}) => {
  // Fire and forget
  backgroundMasterSync(context, options).catch((err) => {
    console.error("Background master sync failed:", err);
  });

  return {
    success: true,
    message: "MF API master sync started in background.",
    inserted: 0,
    updated: 0,
    failed: 0,
    total: 0,
  };
};

const backgroundMasterSync = async (context: SyncContext = {}, options: SyncOptions = {}) => {
  const externalResponse = await requestExternalSchemes();
  
  if (isRateLimitedResponse(externalResponse)) {
    await createSyncLog({
      action: "sync-all",
      status: "failed",
      message: "External API rate limit reached. Please try again later.",
      response: externalResponse,
      context,
    });
    return;
  }

  const rows = asArray(externalResponse);

  if (rows.length === 0) {
    await createSyncLog({
      action: "sync-all",
      status: "failed",
      message: `External API returned no schemes. ${externalResponse?.msg || ""}`,
      response: externalResponse,
      context,
    });
    return;
  }

  const log = await createSyncLog({
    action: "sync-all",
    status: "running",
    message: `Master Sync started for ${rows.length} schemes`,
    response: { total: rows.length },
    context,
  });

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const normalized = normalizeScheme(row);

      const upsertResult = await MfApiScheme.findOneAndUpdate(
        { external_key: normalized.external_key, is_deleted: { $ne: true } },
        {
          $set: {
            scheme_name: normalized.scheme_name,
            amc_name: normalized.amc_name,
            scheme_code: normalized.scheme_code,
            isin: normalized.isin,
            category: normalized.category,
            plan_type: normalized.plan_type,
            option_type: normalized.option_type,
            external_scheme_id: normalized.external_scheme_id,
            raw_payload: normalized.raw_payload,
            last_seen_date: new Date(),
          },
          $setOnInsert: {
            is_active: false,
            is_new: true,
            sync_status: "queued",
            first_seen_date: new Date(),
            latest_nav: null,
            last_sync_error: "",
          },
        },
        { upsert: true, new: false, runValidators: false }
      ) as any;

      if (upsertResult === null) {
        inserted += 1;
      } else {
        updated += 1;
      }
    } catch (error: any) {
      failed += 1;
      await createSyncLog({
        action: "sync-all-item",
        status: "failed",
        message: "Failed to sync scheme during batch sync",
        error: error?.message || "Unknown error",
        payloadData: row,
        context,
      });
    }
  }

  await MfApiSyncLog.findByIdAndUpdate(log._id, {
    status: failed > 0 ? "partial" : "success",
    message: `Master Sync completed: ${inserted} inserted, ${updated} updated, ${failed} failed. Detail sync started.`,
    response: { inserted, updated, failed, total: rows.length },
  });

  if (options.activeOnly) {
    await MfApiScheme.updateMany(
      { is_deleted: { $ne: true }, is_active: true },
      { $set: { sync_status: "queued" } },
    );
  } else {
    // Reset all for full coverage
    await MfApiScheme.updateMany(
      { is_deleted: { $ne: true } },
      { $set: { sync_status: "queued" } },
    );
  }

  // Kick off background job for detailed sync
  processDetailedSyncBatch(String(log._id), context, options).catch(err => {
    console.error("Background sync detail batch failed:", err);
  });
};

const updateSyncLogProgress = async (
  logId: string,
  payload: { message?: string; status?: string; response?: unknown },
) => {
  await MfApiSyncLog.findByIdAndUpdate(logId, {
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.message ? { message: payload.message } : {}),
    ...(payload.response !== undefined ? { response: payload.response } : {}),
  });
};

export const processDetailedSyncBatch = async (
  parentLogId: string,
  context: SyncContext = {},
  options: SyncOptions = {},
) => {
  try {
    // ── Phase 1: Active schemes first ──────────────────────────────────────
    const activeSchemes = await MfApiScheme.find({
      is_deleted: { $ne: true },
      is_active: true,
      sync_status: "queued",
    }).select("_id scheme_name raw_payload external_scheme_id scheme_code isin amc_name plan_type option_type").lean();

    // ── Phase 2: Inactive schemes (queued but never synced, or queued from master) ──
    const inactiveSchemes = options.activeOnly
      ? []
      : await MfApiScheme.find({
          is_deleted: { $ne: true },
          is_active: { $ne: true },
          sync_status: "queued",
        }).select("_id scheme_name raw_payload external_scheme_id scheme_code isin amc_name plan_type option_type").lean();

    const totalActive   = activeSchemes.length;
    const totalInactive = inactiveSchemes.length;
    const total = totalActive + totalInactive;

    let processed = 0;
    let errors = 0;

    await updateSyncLogProgress(parentLogId, {
      status: "running",
      message: options.activeOnly
        ? `Master sync done. Processing ${totalActive} active schemes only. Starting active phase.`
        : `Master sync done. Processing ${totalActive} active + ${totalInactive} inactive schemes. Starting active phase.`,
      response: {
        total,
        active: totalActive,
        inactive: totalInactive,
        processed,
        errors,
        phase: "active",
      },
    });

    // Helper: process one batch with delay
    const processBatch = async (batch: typeof activeSchemes, delayMs: number) => {
      await Promise.allSettled(
        batch.map(async (schemeDoc) => {
          try {
            await syncOneScheme(
              {
                schemeId: String(schemeDoc._id),
                schemeName: schemeDoc.scheme_name,
                externalSchemeId: schemeDoc.external_scheme_id || schemeDoc.scheme_code,
              },
              context,
              options
            );
            processed += 1;
          } catch {
            errors += 1;
          }
        })
      );
      if (delayMs > 0 && !options.offlineMode) await new Promise((r) => setTimeout(r, delayMs));
    };

    // Phase 1: Active in batches of 20, 200ms between batches
    const activeBatchSize = 20;
    for (let i = 0; i < activeSchemes.length; i += activeBatchSize) {
      const batch = activeSchemes.slice(i, i + activeBatchSize);
      await processBatch(batch, 200);
      await updateSyncLogProgress(parentLogId, {
        message: `[Active] Processed ${Math.min(i + activeBatchSize, totalActive)}/${totalActive} active schemes | ${errors} errors`,
        response: {
          total,
          active: totalActive,
          inactive: totalInactive,
          processed,
          errors,
          phase: options.activeOnly ? "active-only" : "active",
        },
      });
    }

    if (!options.activeOnly) {
      await updateSyncLogProgress(parentLogId, {
        message: `Active phase complete (${totalActive} schemes). Starting inactive phase for ${totalInactive} schemes...`,
        response: {
          total,
          active: totalActive,
          inactive: totalInactive,
          processed,
          errors,
          phase: "inactive",
        },
      });

      // Phase 2: Inactive in batches of 10, 500ms between batches
      const inactiveBatchSize = 10;
      for (let i = 0; i < inactiveSchemes.length; i += inactiveBatchSize) {
        const batch = inactiveSchemes.slice(i, i + inactiveBatchSize);
        await processBatch(batch, 500);
        await updateSyncLogProgress(parentLogId, {
          message: `[Inactive] Processed ${Math.min(i + inactiveBatchSize, totalInactive)}/${totalInactive} inactive schemes | Active: ${totalActive} done | Total errors: ${errors}`,
          response: {
            total,
            active: totalActive,
            inactive: totalInactive,
            processed,
            errors,
            phase: "inactive",
          },
        });
      }
    }

    await updateSyncLogProgress(parentLogId, {
      status: errors > 0 ? "failed" : "success",
      message: options.activeOnly
        ? `Active sync complete: ${processed} success, ${errors} failed out of ${totalActive} active schemes`
        : `Full sync complete: ${processed} success, ${errors} failed out of ${total} (${totalActive} active + ${totalInactive} inactive)`,
      response: {
        total,
        active: totalActive,
        inactive: totalInactive,
        processed,
        errors,
        phase: "complete",
      },
    });

    // Recompute all categories after entire batch is completed
    try {
      await recomputeAllCategoryAverageReturns();
      await updateSyncLogProgress(parentLogId, {
        message: options.activeOnly
          ? `Active sync & category recompute complete: ${processed} success, ${errors} failed out of ${totalActive}`
          : `Full sync & category recompute complete: ${processed} success, ${errors} failed out of ${total}`,
      });
    } catch (err: any) {
      console.error("Bulk category recompute failed after sync:", err);
    }

  } catch (error: any) {
    await MfApiSyncLog.findByIdAndUpdate(parentLogId, {
      status: "failed",
      message: `Background processing crashed: ${error?.message || "Unknown error"}`,
    });
  }
};

export const syncOneScheme = async (
  payload: { schemeId?: string; schemeName?: string; externalSchemeId?: string },
  context: SyncContext = {},
  options: SyncOptions = {},
) => {
  let schemeDoc = null as any;
  if (payload.schemeId) {
    schemeDoc = await MfApiScheme.findById(payload.schemeId);
  }
  const schemeName =
    payload.schemeName ||
    schemeDoc?.scheme_name ||
    "";

  if (!schemeName) {
    throw new Error("schemeName or schemeId is required");
  }

  // Use full name for external API lookup - AdvisorKhoj requires the exact scheme name
  // as it appears in getAllMutualFundSchemesRegAndDir. parseSchemeTitle is used only
  // for normalizing plan_type/option_type into stored DB fields, not for the API call.
  let latestInfo;
  if (options.offlineMode) {
    latestInfo = schemeDoc?.latest_info_raw || {};
  } else {
    latestInfo = await requestExternalLatestInfo(schemeName);
  }
  
  const latestPayload = normalizeLatestInfo(latestInfo);

  if (isRateLimitedResponse(latestPayload)) {
    const errorMessage = getLatestInfoErrorMessage(latestPayload);
    const normalized = normalizeScheme(
      schemeDoc?.raw_payload || {
        scheme_name: schemeName,
        scheme_code: payload.externalSchemeId || schemeDoc?.scheme_code || "",
        isin: schemeDoc?.isin || "",
        amc_name: schemeDoc?.amc_name || "",
        plan_type: schemeDoc?.plan_type || "",
        option_type: schemeDoc?.option_type || "",
      },
      latestPayload,
    );

    const existing = schemeDoc
      ? schemeDoc
      : await MfApiScheme.findOne({
          external_key: normalized.external_key,
          is_deleted: { $ne: true },
        });

    const saved = existing
      ? await MfApiScheme.findByIdAndUpdate(
          existing._id,
          {
            ...normalized,
            sync_status: "failed",
            last_synced_at: new Date(),
            last_sync_error: errorMessage,
          },
          { new: true, runValidators: true },
        )
      : await MfApiScheme.create({
          ...normalized,
          sync_status: "failed",
          last_synced_at: new Date(),
          last_sync_error: errorMessage,
        });

    await createSyncLog({
      action: "sync-one",
      status: "failed",
      message: `Failed to sync ${saved.scheme_name}`,
      error: errorMessage,
      scheme_id: String(saved._id),
      scheme_name: saved.scheme_name,
      external_scheme_id: saved.external_scheme_id || "",
      response: latestInfo,
      payloadData: payload,
      context,
    });

    throw new Error(errorMessage);
  }

  const normalized = normalizeScheme(
    schemeDoc?.raw_payload || {
      scheme_name: schemeName,
      scheme_code: payload.externalSchemeId || schemeDoc?.scheme_code || "",
      isin: schemeDoc?.isin || "",
      amc_name: schemeDoc?.amc_name || "",
      plan_type: schemeDoc?.plan_type || "",
      option_type: schemeDoc?.option_type || "",
    },
    latestPayload,
  );

  const existing = schemeDoc
    ? schemeDoc
    : await MfApiScheme.findOne({ external_key: normalized.external_key, is_deleted: { $ne: true } });

  const structured = latestPayload ? extractStructuredFields(latestPayload) : {};

  let saved;
  if (existing) {
    saved = await MfApiScheme.findByIdAndUpdate(
      existing._id,
      {
        ...normalized,
        ...structured,
        sync_status: "success",
        last_synced_at: new Date(),
        last_sync_error: "",
      },
      { new: true, runValidators: true },
    );
  } else {
    saved = await MfApiScheme.create({
      ...normalized,
      ...structured,
      sync_status: "success",
      last_synced_at: new Date(),
      last_sync_error: "",
    });
  }

  // ─── Record NAV history snapshot (one entry per scheme per day) ─────────
  if (saved?.latest_nav != null && saved?.latest_date) {
    try {
      await MfApiNavHistory.findOneAndUpdate(
        { scheme_id: saved._id, date: saved.latest_date },
        {
          $setOnInsert: {
            scheme_id:      saved._id,
            scheme_name:    saved.scheme_name,
            external_key:   saved.external_key,
            date:           saved.latest_date,
            nav:            saved.latest_nav,
            nav_change:     (saved as any).nav_change ?? null,
            nav_change_pct: (saved as any).nav_change_percentage ?? null,
          },
        },
        { upsert: true, new: false }, // $setOnInsert: don't overwrite if already exists for that date
      );
    } catch {
      // NAV history failure must not break main sync
    }
  }

  // ── Sync to manual MFFund collection (hybrid bridge) ─────────────────────
  if (saved?.is_active) {
    await syncApiSchemeToManual(String(saved._id)).catch((err) => {
      console.error("[hybrid-bridge] syncOneScheme → syncApiSchemeToManual failed:", err?.message);
    });
  }

  await createSyncLog({
    action: "sync-one",
    status: "success",
    message: `Synced ${saved.scheme_name}`,
    scheme_id: String(saved._id),
    scheme_name: saved.scheme_name,
    external_scheme_id: saved.external_scheme_id || "",
    response: latestInfo,
    payloadData: payload,
    context,
  });

  return {
    success: true,
    message: "Scheme sync completed",
    data: saved,
  };
};

export const getDashboardSummary = async () => {
  const [
    totalSchemes,
    activeSchemes,
    inactiveSchemes,
    newSchemes,
    syncedSchemes,
    failedSchemes,
    pendingSchemes,
    recentSchemes,
    recentLogs,
    bridgedFunds,
    activeBridgedFunds,
  ] = await Promise.all([
    MfApiScheme.countDocuments({ is_deleted: { $ne: true } }),
    MfApiScheme.countDocuments({ is_deleted: { $ne: true }, is_active: true }),
    MfApiScheme.countDocuments({ is_deleted: { $ne: true }, is_active: { $ne: true } }),
    MfApiScheme.countDocuments({ is_deleted: { $ne: true }, is_new: true }),
    MfApiScheme.countDocuments({ is_deleted: { $ne: true }, sync_status: "success" }),
    MfApiScheme.countDocuments({ is_deleted: { $ne: true }, sync_status: "failed" }),
    MfApiScheme.countDocuments({ is_deleted: { $ne: true }, sync_status: "queued" }),
    MfApiScheme.find({ is_deleted: { $ne: true } }).sort({ updated_at: -1 }).limit(5).lean(),
    MfApiSyncLog.find({}).sort({ created_at: -1 }).limit(5).lean(),
    MFFund.countDocuments({ mf_api_scheme_id: { $ne: null, $exists: true }, is_deleted: false }),
    MFFund.countDocuments({ mf_api_scheme_id: { $ne: null, $exists: true }, is_deleted: false, is_active: 1 }),
  ]);

  const lastSync = await MfApiScheme.findOne({ is_deleted: { $ne: true }, last_synced_at: { $ne: null } })
    .sort({ last_synced_at: -1 })
    .lean();

  const lastImport = await MfApiSyncLog.findOne({ action: "import", status: "success" })
    .sort({ created_at: -1 })
    .lean();

  const lastExport = await MfApiSyncLog.findOne({ action: "export", status: "success" })
    .sort({ created_at: -1 })
    .lean();

  const latestSyncJob = await MfApiSyncLog.findOne({ action: "sync-all" })
    .sort({ created_at: -1 })
    .select("message status response created_at updated_at")
    .lean();

  return {
    success: true,
    data: {
      totalSchemes,
      activeSchemes,
      inactiveSchemes,
      newSchemes,
      syncedSchemes,
      failedSchemes,
      pendingSchemes,
      lastSyncAt: lastSync?.last_synced_at || null,
      lastImportAt: lastImport?.created_at || null,
      lastExportAt: lastExport?.created_at || null,
      lastSyncMessage: latestSyncJob?.message || "",
      latestSyncJob: latestSyncJob || null,
      recentSchemes,
      recentLogs,
      bridgedFunds,
      activeBridgedFunds,
    },
  };
};

export const getSchemes = async (query: any) => {
  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.max(Math.min(Number(query?.limit || 20), 100), 1);
  const skip = (page - 1) * limit;
  const filter: any = { is_deleted: { $ne: true } };
  if (query?.search) {
    const search = String(query.search).trim();
    filter.$or = [
      { scheme_name: { $regex: search, $options: "i" } },
      { amc_name: { $regex: search, $options: "i" } },
      { scheme_code: { $regex: search, $options: "i" } },
      { isin: { $regex: search, $options: "i" } },
    ];
  }
  if (query?.status) {
    filter.sync_status = String(query.status);
  }
  if (query?.is_active !== undefined && query?.is_active !== "") {
    if (query.is_active === "true") {
      filter.is_active = true;
    } else {
      filter.is_active = { $ne: true };
    }
  }
  if (query?.is_new !== undefined && query?.is_new !== "") {
    filter.is_new = query.is_new === "true";
  }

  const sortParam = String(query?.sort_by || "active_first").trim();
  const sortOrder: Record<string, any> =
    sortParam === "name"         ? { scheme_name: 1 } :
    sortParam === "nav"          ? { latest_nav: -1 } :
    sortParam === "synced"       ? { last_synced_at: -1 } :
    /* default: active_first */    { is_active: -1, last_synced_at: -1 };

  const [data, total] = await Promise.all([
    MfApiScheme.find(filter).sort(sortOrder).skip(skip).limit(limit).lean(),
    MfApiScheme.countDocuments(filter),
  ]);

  return {
    success: true,
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

export const inspectExternalSchemeList = async () => {
  const response = await requestExternalSchemes();
  const rows = asArray(response);
  return {
    status: response?.status ?? null,
    status_msg: response?.status_msg ?? response?.msg ?? null,
    total: rows.length,
    sample: rows.slice(0, 3),
    raw_keys: response && typeof response === "object" ? Object.keys(response) : [],
  };
};

export const inspectExternalLatestInfo = async (schemeName: string) => {
  const response = await requestExternalLatestInfo(schemeName);
  return {
    raw_keys: response && typeof response === "object" ? Object.keys(response) : [],
    sample: normalizeLatestInfo(response),
    raw: response,
  };
};

export const getSchemeById = async (id: string) => {
  const scheme = await MfApiScheme.findById(id).lean();
  if (!scheme) {
    throw new Error("Scheme not found");
  }
  const syncHistory = await MfApiSyncLog.find({ scheme_id: id })
    .sort({ created_at: -1 })
    .limit(20)
    .lean();

  const linkedFund = await MFFund.findOne({
    mf_api_scheme_id: scheme._id,
    is_deleted: false,
  }).select("_id fund_name nav_Current nav_date mf_api_synced_at is_active").lean();

  return {
    ...scheme,
    syncHistory,
    linked_manual_fund: linkedFund || null,
  };
};

export const getSyncLogs = async (query: any) => {
  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.max(Math.min(Number(query?.limit || 20), 100), 1);
  const skip = (page - 1) * limit;
  const filter: any = {};
  if (query?.search) {
    const search = String(query.search).trim();
    filter.$or = [
      { scheme_name: { $regex: search, $options: "i" } },
      { action: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
      { error: { $regex: search, $options: "i" } },
    ];
  }
  if (query?.status) {
    filter.status = String(query.status);
  }

  const [data, total] = await Promise.all([
    MfApiSyncLog.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    MfApiSyncLog.countDocuments(filter),
  ]);

  return {
    success: true,
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

const readUploadFile = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".json") {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });
};

// ─── Flatten structured fields from an imported row (round-trip from export) ──

const buildStructuredFieldsFromFlatRow = (row: RawObject) => {
  const n = normalizeNumber;
  const trailing_returns = {
    "1w":  n(row.tr_1w),  "1m": n(row.tr_1m),  "3m": n(row.tr_3m),
    "6m":  n(row.tr_6m),  "1y": n(row.tr_1y),  "2y": n(row.tr_2y),
    "3y":  n(row.tr_3y),  "5y": n(row.tr_5y),  "10y": n(row.tr_10y),
    since_launch: n(row.tr_since_launch), ytd: n(row.tr_ytd), d1: n(row.tr_d1),
  };
  const annual_returns = {
    ytd: n(row.ar_ytd),
    yearly_returns: (() => {
      try {
        const parsed = row.ar_yearly_returns ? JSON.parse(String(row.ar_yearly_returns)) : {};
        const base = typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
        Object.keys(row).forEach((k) => {
          if (k.startsWith("ar_20") || k.startsWith("ar_19")) {
            const year = k.replace("ar_", "");
            if (row[k] !== "" && row[k] !== null) {
              base[year] = n(row[k]);
            }
          }
        });
        return base;
      } catch { return {}; }
    })(),
  };
  const benchmark_returns = {
    benchmark_name: normalizeString(row.benchmark_name || ""),
    "1w": n(row.bm_1w), "1m": n(row.bm_1m), "3m": n(row.bm_3m),
    "6m": n(row.bm_6m), "1y": n(row.bm_1y), "2y": n(row.bm_2y),
    "3y": n(row.bm_3y), "5y": n(row.bm_5y), "10y": n(row.bm_10y),
    since_launch: n(row.bm_since_launch), ytd: n(row.bm_ytd),
  };
  const category_avg_returns = {
    category_name: normalizeString(row.category_name || ""),
    "1w": n(row.cat_1w), "1m": n(row.cat_1m), "3m": n(row.cat_3m),
    "6m": n(row.cat_6m), "1y": n(row.cat_1y), "2y": n(row.cat_2y),
    "3y": n(row.cat_3y), "5y": n(row.cat_5y), "10y": n(row.cat_10y),
    since_launch: n(row.cat_since_launch), ytd: n(row.cat_ytd),
  };
  const risk_metrics = {
    volatility_3y:    n(row.risk_volatility_3y),
    sharpe_3y:        n(row.risk_sharpe_3y),
    alpha_1y:         n(row.risk_alpha_1y),
    beta_1y:          n(row.risk_beta_1y),
    sortino:          n(row.risk_sortino),
    yield_to_maturity: n(row.risk_ytm),
    average_maturity:  n(row.risk_avg_maturity),
  };
  const market_cap = {
    large_cap_pct: n(row.mc_large_cap_pct),
    mid_cap_pct:   n(row.mc_mid_cap_pct),
    small_cap_pct: n(row.mc_small_cap_pct),
  };
  // Only spread if any return value is non-null (don't clobber API data with empty import row)
  const hasAnyReturn = Object.values(trailing_returns).some((v) => v !== null);
  return hasAnyReturn ? {
    trailing_returns, annual_returns, benchmark_returns,
    category_avg_returns, risk_metrics, market_cap,
  } : {};
};

export const importMfApiData = async ({
  filePath,
  validateOnly,
  context,
}: {
  filePath: string;
  validateOnly: boolean;
  context?: SyncContext;
}) => {
  const rawRows = asArray(readUploadFile(filePath));
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let rejected = 0;
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < rawRows.length; i += 1) {
    const row = rawRows[i];
    try {
      const normalized = normalizeScheme(row);
      if (!normalized.scheme_name) {
        rejected += 1;
        errors.push({ row: i + 1, message: "scheme_name is required" });
        continue;
      }

      const existing = await MfApiScheme.findOne({ external_key: normalized.external_key, is_deleted: { $ne: true } });
      if (validateOnly) {
        skipped += 1;
        continue;
      }

      const structuredFromRow = buildStructuredFieldsFromFlatRow(row);

      if (existing) {
        updated += 1;
        const {
          is_active: _ia,      // exclude — must not overwrite admin-set value
          is_new: _in,         // exclude — must not overwrite
          is_deleted: _id,     // exclude
          external_key: _ek,   // exclude — immutable identity
          first_seen_date: _fsd, // exclude — immutable
          ...safeNormalized
        } = normalized as any;
        await MfApiScheme.findByIdAndUpdate(existing._id, {
          $set: {
            ...safeNormalized,
            ...structuredFromRow,
            sync_status: "success",
            last_synced_at: new Date(),
            last_sync_error: "",
          },
        });
      } else {
        inserted += 1;
        await MfApiScheme.create({
          ...normalized,
          ...structuredFromRow,
          sync_status: "success",
          last_synced_at: new Date(),
          last_sync_error: "",
        });
      }

      // ── Bridge to manual module after import ──────────────────────────────────
      const importedScheme = await MfApiScheme.findOne({
        external_key: normalized.external_key,
        is_deleted: { $ne: true },
      }).lean();
      if (importedScheme && importedScheme.is_active) {
        syncApiSchemeToManual(String(importedScheme._id)).catch(() => {});
      }
    } catch (error: any) {
      rejected += 1;
      errors.push({ row: i + 1, message: error?.message || "Invalid row" });
    }
  }

  await createSyncLog({
    action: "import",
    status: rejected > 0 ? "failed" : "success",
    message: validateOnly
      ? `Validated ${rawRows.length} rows`
      : `Imported ${inserted} inserted, ${updated} updated`,
    response: { inserted, updated, skipped, rejected, totalRows: rawRows.length, validateOnly },
    context,
  });

  return {
    success: true,
    fileName: path.basename(filePath),
    validateOnly,
    inserted,
    updated,
    skipped,
    rejected,
    totalRows: rawRows.length,
    errors,
  };
};

export const exportMfApiData = async () => {
  const rows = await MfApiScheme.find({ is_deleted: { $ne: true } })
    .sort({ updated_at: -1 })
    .lean();

  const sheetData = rows.map((row) => {
    const tr = (row as any).trailing_returns || {};
    const br = (row as any).benchmark_returns || {};
    const cr = (row as any).category_avg_returns || {};
    const ar = (row as any).annual_returns || {};
    const rm = (row as any).risk_metrics || {};
    const mc = (row as any).market_cap || {};

    const yearlyColumns: any = {};
    if (ar.yearly_returns && typeof ar.yearly_returns === "object") {
      Object.keys(ar.yearly_returns).forEach(year => {
        if (/^\d{4}$/.test(year)) {
          yearlyColumns[`ar_${year}`] = ar.yearly_returns[year];
        }
      });
    }

    return {
      // ── Identity ──────────────────────────────────────────────
      scheme_name:          row.scheme_name,
      amc_name:             row.amc_name,
      scheme_code:          row.scheme_code,
      isin:                 row.isin,
      external_key:         row.external_key,
      plan_type:            row.plan_type,
      option_type:          row.option_type,
      category:             row.category,
      sub_category:         row.sub_category,
      // ── Scheme info ───────────────────────────────────────────
      scheme_benchmark:     row.scheme_benchmark,
      scheme_objective:     row.scheme_objective,
      scheme_manager:       row.scheme_manager,
      riskometer_value:     row.riskometer_value,
      scheme_inception_date: row.scheme_inception_date,
      scheme_status:        row.scheme_status,
      asset_class:          row.asset_class,
      rating:               row.rating,
      rating_value:         row.rating_value,
      exit_load:            row.exit_load,
      minimum_investment:   row.minimum_investment,
      sip_minimum_amount:   row.sip_minimum_amount,
      minimum_topup:        row.minimum_topup,
      expense_ratio_percentage: row.expense_ratio_percentage,
      expense_ratio_date:   row.expense_ratio_date,
      scheme_assets:        row.scheme_assets,
      scheme_asset_date:    row.scheme_asset_date,
      scheme_turnover:      row.scheme_turnover,
      is_dividend_scheme:   row.is_dividend_scheme,
      // ── NAV ───────────────────────────────────────────────────
      latest_nav:           row.latest_nav,
      latest_date:          row.latest_date,
      nav_change:           (row as any).nav_change,
      nav_change_percentage: (row as any).nav_change_percentage,
      // ── Trailing returns (fund) ────────────────────────────────
      tr_1w:           tr["1w"]  ?? null,
      tr_1m:           tr["1m"]  ?? null,
      tr_3m:           tr["3m"]  ?? null,
      tr_6m:           tr["6m"]  ?? null,
      tr_1y:           tr["1y"]  ?? null,
      tr_2y:           tr["2y"]  ?? null,
      tr_3y:           tr["3y"]  ?? null,
      tr_5y:           tr["5y"]  ?? null,
      tr_10y:          tr["10y"] ?? null,
      tr_since_launch: tr.since_launch ?? null,
      tr_ytd:          tr.ytd   ?? null,
      tr_d1:           tr.d1    ?? null,  // manual only
      // ── Annual returns ─────────────────────────────────────────
      ar_ytd:          ar.ytd   ?? null,
      ar_yearly_returns: ar.yearly_returns && typeof ar.yearly_returns === "object"
                          ? JSON.stringify(ar.yearly_returns)
                          : "",
      // ── Benchmark returns ──────────────────────────────────────
      benchmark_name:  br.benchmark_name || "",
      bm_1w:           br["1w"]  ?? null,
      bm_1m:           br["1m"]  ?? null,
      bm_3m:           br["3m"]  ?? null,
      bm_6m:           br["6m"]  ?? null,
      bm_1y:           br["1y"]  ?? null,
      bm_2y:           br["2y"]  ?? null,
      bm_3y:           br["3y"]  ?? null,
      bm_5y:           br["5y"]  ?? null,
      bm_10y:          br["10y"] ?? null,
      bm_since_launch: br.since_launch ?? null,
      bm_ytd:          br.ytd   ?? null,
      // ── Category avg returns ───────────────────────────────────
      category_name:   cr.category_name || "",
      cat_1w:          cr["1w"]  ?? null,
      cat_1m:          cr["1m"]  ?? null,
      cat_3m:          cr["3m"]  ?? null,
      cat_6m:          cr["6m"]  ?? null,
      cat_1y:          cr["1y"]  ?? null,
      cat_2y:          cr["2y"]  ?? null,
      cat_3y:          cr["3y"]  ?? null,
      cat_5y:          cr["5y"]  ?? null,
      cat_10y:         cr["10y"] ?? null,
      cat_since_launch: cr.since_launch ?? null,
      cat_ytd:         cr.ytd   ?? null,
      // ── Risk metrics ───────────────────────────────────────────
      risk_volatility_3y:  rm.volatility_3y  ?? null,
      risk_sharpe_3y:      rm.sharpe_3y      ?? null,
      risk_alpha_1y:       rm.alpha_1y       ?? null,
      risk_beta_1y:        rm.beta_1y        ?? null,
      risk_sortino:        rm.sortino        ?? null,
      risk_ytm:            rm.yield_to_maturity ?? null,
      risk_avg_maturity:   rm.average_maturity  ?? null,
      // ── Market cap ────────────────────────────────────────────
      mc_large_cap_pct:  mc.large_cap_pct  ?? row.market_cap_largecap_percent ?? null,
      mc_mid_cap_pct:    mc.mid_cap_pct    ?? row.market_cap_midcap_percent   ?? null,
      mc_small_cap_pct:  mc.small_cap_pct  ?? row.market_cap_smallcap_percent ?? null,
      // ── Inception returns ─────────────────────────────────────
      scheme_inception_return:    row.scheme_inception_return,
      benchmark_inception_return: row.benchmark_inception_return,
      upmarket_capture_ratio:     row.upmarket_capture_ratio,
      downmarket_capture_ratio:   row.downmarket_capture_ratio,
      // ── Sync metadata ─────────────────────────────────────────
      sync_status:    row.sync_status,
      last_synced_at: row.last_synced_at,
      is_active:      row.is_active ?? false,
      is_new:         row.is_new ?? false,
      first_seen_date: row.first_seen_date,
      ...yearlyColumns,
    };
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "mf_api_schemes");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  await createSyncLog({
    action: "export",
    status: "success",
    message: `Exported ${rows.length} schemes`,
    response: { totalRows: rows.length },
  });

  return {
    buffer,
    fileName: `mf-api-export-${new Date().toISOString().slice(0, 10)}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};

export const syncAllExternalSchemes = syncAllSchemes;
export const syncActiveExternalSchemes = (context: SyncContext = {}) =>
  syncAllSchemes(context, { activeOnly: true });
export const syncExternalScheme = syncOneScheme;

export const toggleSchemeActive = async (id: string, is_active: boolean) => {
  const scheme = await MfApiScheme.findByIdAndUpdate(
    id,
    {
      is_active,
      is_new: false, // marking as reviewed
      sync_status: is_active ? "queued" : "success",
    },
    { new: true, runValidators: true }
  );
  if (!scheme) throw new Error("Scheme not found");

  // ── When activating: immediately push scheme into manual module ───────────
  if (is_active && scheme) {
    // Fire and forget — don't await, don't let this block the API response
    syncApiSchemeToManual(id, { activating: true }).catch((err) => {
      console.error("[hybrid-bridge] toggleSchemeActive → syncApiSchemeToManual failed:", err?.message);
    });

  }

  return { success: true, data: scheme };
};

export const bulkToggleSchemeActive = async (ids: string[], is_active: boolean) => {
  const result = await MfApiScheme.updateMany(
    { _id: { $in: ids }, is_deleted: { $ne: true } },
    {
      is_active,
      is_new: false,
      sync_status: is_active ? "queued" : "success",
    }
  );

  // ── When bulk-activating: bridge each newly activated scheme ──────────────
  if (is_active) {
    const activatedSchemes = await MfApiScheme.find({
      _id: { $in: ids },
      is_deleted: { $ne: true },
    }).select("_id scheme_name external_scheme_id scheme_code").lean();

    // Fire and forget
    Promise.allSettled(
      activatedSchemes.map((s) =>
        syncApiSchemeToManual(String(s._id), { activating: true }).catch(() => {})
      )
    ).catch(() => {});
  }

  return { success: true, modifiedCount: result.modifiedCount };
};

export const markSchemesAsReviewed = async (ids: string[]) => {
  await MfApiScheme.updateMany(
    { _id: { $in: ids }, is_deleted: { $ne: true } },
    { is_new: false }
  );
  return { success: true };
};

