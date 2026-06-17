/**
 * mfApiBridgeService.ts
 *
 * Bridges the MF API automation module (mf_api_schemes) with the manual
 * MF module (mfschemes). When a scheme is activated in MF API or synced,
 * it creates/updates the corresponding MFFund record so the frontend
 * always reads fresh data from the manual system.
 *
 * DATA FLOW:
 *   MfApiScheme (API source) -> MFFund (frontend-facing record)
 *
 * WHAT GETS SYNCED FROM API -> MANUAL:
 *   ✅ fund_name, scheme_code, isin, plan_type, option_type
 *   ✅ amc_name (resolved to amc_id via MFAmc)
 *   ✅ nav_Current, nav_date (from latest_nav, latest_date)
 *   ✅ aum_cr (from scheme_assets)
 *   ✅ expense_ratio (from expense_ratio_percentage)
 *   ✅ fund_manager (from scheme_manager)
 *   ✅ fund_objective (from scheme_objective)
 *   ✅ launch_date (from scheme_inception_date)
 *   ✅ exit_load
 *   ✅ min_investment, sip_minimum_amount
 *   ✅ riskometer_label (from riskometer_value)
 *   ✅ large_cap_pct, mid_cap_pct, small_cap_pct (from market_cap)
 *   ✅ returns.trailing (from trailing_returns)
 *   ✅ returns.since_inception (from scheme_inception_return)
 *   ✅ risk_metrics.sharpe_3y (from risk_metrics.sharpe_3y)
 *   ✅ risk_metrics.alpha_1y (from risk_metrics.alpha_1y)
 *   ✅ risk_metrics.beta_1y (from risk_metrics.beta_1y)
 *   ✅ risk_metrics.turnover_ratio (from scheme_turnover)
 *
 * WHAT IS NOT OVERWRITTEN (manual-only, API has no data):
 *   ❌ returns.annual.yearly_returns  — manual import only
 *   ❌ frontend_visibility            — admin-controlled
 *   ❌ is_featured, is_popular       — admin-controlled
 *   ? category_id                   — resolved automatically or auto-created from API category
 *   ❌ benchmark_id                  — manual mapping
 *   ❌ investment_strategy           — manual content
 *
 * CATEGORY MAPPING NOTE:
 *   The API provides a string category like "Hybrid: Balanced". The manual
 *   system uses ObjectId references. We attempt a case-insensitive name match
 *   against MFCategory.name. If not found, we use a fallback category if one
 *   against MFCategory.name. If not found, we match the last segment after a
 *   colon, then try fuzzy matching, and finally auto-create a category under a
 *   matching or fallback MFMainCategory so the bridge does not stall.
 */

import mongoose from "mongoose";
import MfApiScheme, { IMfApiScheme } from "../models/mfApiSchemeModel";
import MFFund from "../models/mfFundModel";
import NavHistory from "../models/navHistoryModel";
import MFAmc from "../models/mfAmcModel";
import MFCategory from "../models/mfCategoryModel";
import MFMainCategory from "../models/mfMainCategoryModel";
import MFBenchmark from "../models/mfBenchmarkModel";
import { recomputeCategoryAverageReturns } from "./mfCategoryService";
import { normalizeDateOnly } from "./navCalculationService";
import { parseSchemeTitle } from "../utils/schemeParser";
import { parseCategoryPath } from "../utils/categoryParser";

const toN = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g, "").replace(/%/g, "").trim());
  return Number.isFinite(n) ? n : null;
};

const toD = (v: any): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (value: string) => String(value || "").trim();

const findCategoryByName = async (name: string) =>
  MFCategory.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    is_deleted: false,
  });

const findMainCategoryByName = async (name: string) =>
  MFMainCategory.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    is_deleted: false,
  });

/**
 * Resolve or auto-create an MFAmc record by name.
 * Returns the ObjectId.
 */
const resolveAmcId = async (amcName: string): Promise<mongoose.Types.ObjectId | null> => {
  if (!amcName) return null;
  const name = amcName.trim();
  let amc = await MFAmc.findOne({ name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }, is_deleted: false });
  if (!amc) {
    amc = await MFAmc.create({ name, is_active: 1, is_deleted: false });
  }
  return amc._id as mongoose.Types.ObjectId;
};

/**
 * Resolve or auto-create a category for an API category string.
 * This never returns null for a non-empty category input.
 */
const resolveCategoryId = async (apiCategory: string): Promise<mongoose.Types.ObjectId | null> => {
  const clean = normalizeText(apiCategory);
  const parsed = parseCategoryPath(clean);
  const fallbackCategoryName = parsed.categoryName;
  const fallbackMainCategoryName = parsed.mainCategoryName;

  const exactMatch = clean ? await findCategoryByName(clean) : null;
  if (exactMatch) return exactMatch._id as mongoose.Types.ObjectId;

  const candidateParts = [parsed.categoryName, parsed.mainCategoryName]
    .map((part) => normalizeText(part))
    .filter(Boolean);
  for (const part of candidateParts) {
    const partMatch = await findCategoryByName(part);
    if (partMatch) return partMatch._id as mongoose.Types.ObjectId;
  }

  const allCategories = await MFCategory.find({ is_deleted: false, is_active: 1 }).lean();
  const cleanLower = clean.toLowerCase();
  const sortedByLength = [...allCategories].sort((a, b) => b.name.length - a.name.length);

  for (const category of sortedByLength) {
    const escaped = escapeRegex(category.name);
    if (new RegExp(`\\b${escaped}\\b`, "i").test(clean)) {
      return category._id as mongoose.Types.ObjectId;
    }
    const nameLower = category.name.toLowerCase();
    if (cleanLower.includes(nameLower) || nameLower.includes(cleanLower)) {
      return category._id as mongoose.Types.ObjectId;
    }
  }

  // Auto-create with the correct parsed names (not "Uncategorized")
  const { mainCategoryName: fallbackMainCat, categoryName: fallbackCat } = parsed;

  let mainCategory = await findMainCategoryByName(fallbackMainCat);
  if (!mainCategory) {
    mainCategory = await MFMainCategory.create({
      name: fallbackMainCat,
      is_active: 1,
      is_deleted: false,
    });
  }

  let newCategory = await findCategoryByName(fallbackCat);
  if (!newCategory) {
    newCategory = await MFCategory.create({
      name: fallbackCat,
      main_category_id: mainCategory._id,
      is_active: 1,
      is_deleted: false,
    });
  }

  console.info(
    `[mfApiBridgeService] Auto-created/resolved MFCategory "${fallbackCat}" under "${fallbackMainCat}" for API category "${apiCategory}"`,
  );

  return newCategory._id as mongoose.Types.ObjectId;
};

/**
 * Resolve a benchmark for an API benchmark string using fuzzy matching.
 * Returns the ObjectId or null if no acceptable match is found.
 */
const resolveBenchmarkId = async (apiBenchmark: string): Promise<mongoose.Types.ObjectId | null> => {
  const clean = normalizeText(apiBenchmark);
  if (!clean) return null;

  const exactMatch = await MFBenchmark.findOne({
    name: { $regex: `^${escapeRegex(clean)}$`, $options: "i" },
    is_deleted: false,
  }).lean();
  if (exactMatch) return exactMatch._id as mongoose.Types.ObjectId;

  // Attempt fuzzy match
  const allBenchmarks = await MFBenchmark.find({ is_deleted: false, is_active: 1 }).lean();
  const cleanLower = clean.toLowerCase();
  
  // Try to find if any known benchmark name is fully contained in the API benchmark name
  const sortedByLength = [...allBenchmarks].sort((a, b) => b.name.length - a.name.length);
  for (const benchmark of sortedByLength) {
    const escaped = escapeRegex(benchmark.name);
    if (new RegExp(`\\b${escaped}\\b`, "i").test(clean)) {
      return benchmark._id as mongoose.Types.ObjectId;
    }
  }

  return null;
};

const mapPlanType = (plan: string): "Regular" | "Direct" | "" => {
  if (!plan) return "";
  const lower = plan.toLowerCase();
  if (lower === "regular") return "Regular";
  if (lower === "direct") return "Direct";
  return "";
};

const mapOptionType = (opt: string): "Growth" | "IDCW" | "" => {
  if (!opt) return "";
  const lower = opt.toLowerCase();
  if (lower === "growth") return "Growth";
  if (lower === "dividend" || lower === "idcw") return "IDCW";
  return "";
};

const upsertNavHistoryFromApiScheme = async (scheme: IMfApiScheme, fundId: string) => {
  if (!scheme.latest_nav || !scheme.latest_date) return;

  const normalizedDate = normalizeDateOnly(new Date(scheme.latest_date));
  const nav = Number(scheme.latest_nav);
  if (!Number.isFinite(nav)) return;

  await NavHistory.findOneAndUpdate(
    { schemeId: fundId, date: normalizedDate },
    {
      $set: {
        nav,
        totalAssets: nav,
        totalLiabilities: 0,
        totalUnits: 1,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

/**
 * Build the MFFund field payload from an MfApiScheme document.
 * Only includes fields that the API can provide.
 * Never includes fields that are manually managed.
 */
const buildMFFundPayload = async (scheme: IMfApiScheme): Promise<Record<string, any>> => {
  const tr = (scheme as any).trailing_returns || {};
  const rm = (scheme as any).risk_metrics || {};
  const mc = (scheme as any).market_cap || {};
  const benchmarkReturns = (scheme as any).benchmark_returns || {};
  const categoryReturns = (scheme as any).category_avg_returns || {};
  const parsedTitle = parseSchemeTitle(scheme.scheme_name || "");

  const amcId = await resolveAmcId(scheme.amc_name || "");
  const categoryId = await resolveCategoryId(scheme.category || "");
  const benchmarkIndexName = (scheme as any).scheme_benchmark || benchmarkReturns.benchmark_name || "";
  const benchmarkId = await resolveBenchmarkId(benchmarkIndexName);

  const payload: Record<string, any> = {
    // ---- Identity ----
    fund_name:   parsedTitle.baseName || scheme.scheme_name,
    scheme_code: scheme.scheme_code || "",
    isin:        scheme.isin || "",
    isin_number: scheme.isin || "",
    plan_type:   mapPlanType(scheme.plan_type || parsedTitle.planType || ""),
    option_type: mapOptionType(scheme.option_type || parsedTitle.optionType || ""),
    ...(amcId ? { amc_id: amcId } : {}),
    ...(categoryId ? { category_id: categoryId } : {}),
    ...(benchmarkId ? { benchmark_id: benchmarkId } : {}),
    // ---- NAV ----
    nav_Current: toN(scheme.latest_nav),
    nav_date:    toD(scheme.latest_date),
    nav_change:  toN((scheme as any).nav_change),
    nav_change_percentage: toN((scheme as any).nav_change_percentage),
    // ---- Fund info ----
    aum_cr:          toN(scheme.scheme_assets),
    aum:             toN(scheme.scheme_assets),
    expense_ratio:   toN(scheme.expense_ratio_percentage),
    fund_manager:    scheme.scheme_manager || "",
    fund_objective:  scheme.scheme_objective || "",
    launch_date:     toD(scheme.scheme_inception_date),
    exit_load:       scheme.exit_load || "",
    min_investment:  toN(scheme.minimum_investment),
    min_sip_investment: toN(scheme.sip_minimum_amount),
    riskometer_label: scheme.riskometer_value || "",
    // ---- Market cap ----
    large_cap_pct: toN(mc.large_cap_pct ?? scheme.market_cap_largecap_percent),
    mid_cap_pct:   toN(mc.mid_cap_pct   ?? scheme.market_cap_midcap_percent),
    small_cap_pct: toN(mc.small_cap_pct ?? scheme.market_cap_smallcap_percent),
    // ---- Returns (trailing) ----
    returns: {
      since_inception: toN(scheme.scheme_inception_return),
      d1:   toN(tr.d1),
      trailing: {
        "1w":          toN(tr["1w"]),
        "1m":          toN(tr["1m"]),
        "3m":          toN(tr["3m"]),
        "6m":          toN(tr["6m"]),
        "1y":          toN(tr["1y"]),
        "3y":          toN(tr["3y"]),
        "5y":          toN(tr["5y"]),
        "10y":         toN(tr["10y"]),
        since_launch:  toN(tr.since_launch),
      },
    },
    // ---- Category Returns (from API) ----
    api_category_returns: {
      "1w":          toN(categoryReturns["1w"]) ?? null,
      "1m":          toN(categoryReturns["1m"]) ?? null,
      "3m":          toN(categoryReturns["3m"]) ?? null,
      "6m":          toN(categoryReturns["6m"]) ?? null,
      "1y":          toN(categoryReturns["1y"]) ?? null,
      "2y":          toN(categoryReturns["2y"]) ?? null,
      "3y":          toN(categoryReturns["3y"]) ?? null,
      "5y":          toN(categoryReturns["5y"]) ?? null,
      "10y":         toN(categoryReturns["10y"]) ?? null,
      ytd:           toN(categoryReturns.ytd) ?? null,
      since_launch:  toN(categoryReturns.since_launch) ?? null,
    },
    // ---- Risk metrics (best available from API) ----
    risk_metrics: {
      sharpe_3y:      toN(rm.sharpe_3y),
      alpha_1y:       toN(rm.alpha_1y),
      beta_1y:        toN(rm.beta_1y),
      turnover_ratio: toN(scheme.scheme_turnover),
    },
    benchmark_index_name: benchmarkIndexName,
    benchmark_returns_trailing: {
      d1:           null,                                          // 1-day: not available from API
      m1:           toN(benchmarkReturns["1m"]) ?? null,
      m3:           toN(benchmarkReturns["3m"]) ?? null,
      m6:           toN(benchmarkReturns["6m"]) ?? null,
      y1:           toN(benchmarkReturns["1y"]) ?? null,
      y3:           toN(benchmarkReturns["3y"]) ?? null,
      y5:           toN(benchmarkReturns["5y"]) ?? null,
      y10:          toN(benchmarkReturns["10y"]) ?? null,
      since_launch: toN(benchmarkReturns.since_launch) ?? null,
    },
    benchmark_returns_annual: {
      y1: null,
      y3: null,
      y5: null,
      y10: null,
    },
    benchmark_inception_return: toN((scheme as any).benchmark_inception_return) ?? null,
  };

  return payload;
};

export const syncApiSchemeToManual = async (
  schemeId: string,
  options: { activating?: boolean } = {}
): Promise<{ action: "created" | "updated" | "skipped"; reason?: string }> => {
  const scheme = await MfApiScheme.findById(schemeId).lean() as IMfApiScheme | null;
  if (!scheme) return { action: "skipped", reason: "MfApiScheme not found" };

  const schemeActive = scheme.is_active === true;

  try {
    const payload = await buildMFFundPayload(scheme);

    let existing = await MFFund.findOne({
      is_deleted: false,
      $or: [
        { mf_api_scheme_id: scheme._id },
        ...(scheme.scheme_code ? [{ scheme_code: scheme.scheme_code, is_deleted: false }] : []),
        ...(scheme.isin ? [{ isin: scheme.isin, is_deleted: false }] : []),
      ],
    });

    if (existing) {
      // stripNulls removed — null values are now meaningful (they clear stale fields)

      const {
        returns: payloadReturns,
        risk_metrics: payloadRisk,
        benchmark_returns_trailing: payloadBenchmarkReturns,
        api_category_returns: payloadApiCategoryReturns,
        ...scalarFields
      } = payload;

      const existingReturns = (existing as any).returns || {};
      const mergedReturns = {
        ...existingReturns,
        since_inception: payloadReturns.since_inception ?? existingReturns.since_inception,
        d1: payloadReturns.d1 ?? existingReturns.d1,
        trailing: {
          ...(existingReturns.trailing || {}),
          ...payloadReturns.trailing,  // nulls are intentional — they clear stale data
        },
        annual: {
          ...(existingReturns.annual || {}),
          ytd: (scheme as any).trailing_returns?.ytd ?? existingReturns.annual?.ytd,
        },
      };

      const existingRisk = (existing as any).risk_metrics || {};
      const mergedRisk = {
        ...existingRisk,
        // Only overwrite risk fields that API provides (non-null)
        ...(payloadRisk.sharpe_3y      !== null && payloadRisk.sharpe_3y      !== undefined ? { sharpe_3y:      payloadRisk.sharpe_3y }      : {}),
        ...(payloadRisk.alpha_1y       !== null && payloadRisk.alpha_1y       !== undefined ? { alpha_1y:       payloadRisk.alpha_1y }       : {}),
        ...(payloadRisk.beta_1y        !== null && payloadRisk.beta_1y        !== undefined ? { beta_1y:        payloadRisk.beta_1y }        : {}),
        ...(payloadRisk.turnover_ratio !== null && payloadRisk.turnover_ratio !== undefined ? { turnover_ratio: payloadRisk.turnover_ratio } : {}),
      };

      const existingBenchmarkReturns = (existing as any).benchmark_returns_trailing || {};
      const mergedBenchmarkReturns = {
        ...existingBenchmarkReturns,
        ...payloadBenchmarkReturns,
      };

      const existingApiCategoryReturns = (existing as any).api_category_returns || {};
        const mergedApiCategoryReturns = {
          ...existingApiCategoryReturns,
          // Keep existing values when API returns null for a period
          ...Object.fromEntries(
            Object.entries(payloadApiCategoryReturns || {}).filter(([_, v]) => v !== null && v !== undefined),
          ),
        };

      const updateDoc: Record<string, any> = {
        ...scalarFields,
        benchmark_returns_trailing: mergedBenchmarkReturns,
        api_category_returns: mergedApiCategoryReturns,
        returns: mergedReturns,
        risk_metrics: mergedRisk,
        mf_api_scheme_id: scheme._id,
        mf_api_external_key: scheme.external_key,
        mf_api_synced_at: new Date(),
      };

      await MFFund.findByIdAndUpdate(existing._id, {
        $set: {
          ...updateDoc,
          nav_Current: payload.nav_Current,
          nav_date: payload.nav_date,
          nav_change: payload.nav_change,
          nav_change_percentage: payload.nav_change_percentage,
        },
      });

      await upsertNavHistoryFromApiScheme(scheme, String(existing._id));

      // categoryIdToRecompute removed for asynchronous batch processing (Phase 4.1)

      return { action: "updated" };
    }

    if (!schemeActive && !options.activating) {
      return { action: "skipped", reason: "Scheme is not active; MFFund not created yet" };
    }

    if (!payload.amc_id) {
      return { action: "skipped", reason: "Could not resolve AMC; MFFund not created" };
    }

    if (!payload.scheme_code) {
      return { action: "skipped", reason: "scheme_code is required to create MFFund" };
    }

    const newFund = new MFFund({
      ...payload,
      returns: {
        ...payload.returns,
        annual: {
          ytd:            (scheme as any).trailing_returns?.ytd ?? null,
          yearly_returns: {},
        },
      },
      risk_metrics: {
        ...payload.risk_metrics,
        sharpe_5y:       null,
        std_dev_3y:      null,
        std_dev_5y:      null,
        beta_5y:         null,
        alpha_5y:        null,
        max_drawdown_5y: null,
        max_drawdown_10y: null,
      },
      sip_allowed:     true,
      lumpsum_allowed: true,
      is_featured:     false,
      is_popular:      false,
      frontend_visibility: { groups: {}, fields: {} },
      is_active: 1,
      is_deleted: false,
    });

    await newFund.save();
    await upsertNavHistoryFromApiScheme(scheme, String(newFund._id));
    // Category recomputation deferred to bulk job (Phase 4.1)
    return { action: "created" };

  } catch (err: any) {
    console.error(`[mfApiBridgeService] syncApiSchemeToManual failed for ${schemeId}:`, err?.message);
    return { action: "skipped", reason: err?.message || "Unknown error" };
  }
};

export const onSchemeDeactivated = async (schemeId: string): Promise<void> => {
  return;
};
