/**
 * mfApiBridgeService.ts
 *
 * Bridges the MF API automation module (mf_api_schemes) with the manual
 * MF module (mfschemes). When a scheme is activated in MF API or synced,
 * it creates/updates the corresponding MFFund record so the frontend
 * always reads fresh data from the manual system.
 *
 * DATA FLOW:
 *   MfApiScheme (API source) â†’ MFFund (frontend-facing record)
 *
 * WHAT GETS SYNCED FROM API â†’ MANUAL:
 *   âœ… fund_name, scheme_code, isin, plan_type, option_type
 *   âœ… amc_name (resolved to amc_id via MFAmc)
 *   âœ… nav_Current, nav_date (from latest_nav, latest_date)
 *   âœ… aum_cr (from scheme_assets)
 *   âœ… expense_ratio (from expense_ratio_percentage)
 *   âœ… fund_manager (from scheme_manager)
 *   âœ… fund_objective (from scheme_objective)
 *   âœ… launch_date (from scheme_inception_date)
 *   âœ… exit_load
 *   âœ… min_investment, sip_minimum_amount
 *   âœ… riskometer_label (from riskometer_value)
 *   âœ… large_cap_pct, mid_cap_pct, small_cap_pct (from market_cap)
 *   âœ… returns.trailing (from trailing_returns)
 *   âœ… returns.since_inception (from scheme_inception_return)
 *   âœ… risk_metrics.sharpe_3y (from risk_metrics.sharpe_3y)
 *   âœ… risk_metrics.alpha_3y (from risk_metrics.alpha_1y â€” best available)
 *   âœ… risk_metrics.beta_3y (from risk_metrics.beta_1y)
 *   âœ… risk_metrics.turnover_ratio (from scheme_turnover)
 *
 * WHAT IS NOT OVERWRITTEN (manual-only, API has no data):
 *   âŒ returns.annual.yearly_returns  â€” manual import only
 *   âŒ frontend_visibility            â€” admin-controlled
 *   âŒ is_featured, is_popular       â€” admin-controlled
 *   ? category_id                   — resolved automatically or auto-created from API category
 *   âŒ benchmark_id                  â€” manual mapping
 *   âŒ investment_strategy           â€” manual content
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
import { recomputeCategoryAverageReturns } from "./mfCategoryService";
import { normalizeDateOnly } from "./navCalculationService";

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

const parseSchemeTitle = (schemeName: string) => {
  const clean = normalizeText(schemeName);
  const parts = clean.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  const last = parts[parts.length - 1] || "";
  const secondLast = parts[parts.length - 2] || "";
  const planMatch = /^(direct|regular)\s*plan$/i.exec(secondLast);
  const optionMatch = /^(growth|idcw|dividend)$/i.exec(last);

  if (parts.length >= 3 && planMatch && optionMatch) {
    return {
      baseName: parts.slice(0, -2).join(" - "),
      planType: planMatch[1].toLowerCase() === "direct" ? "Direct" : "Regular",
      optionType:
        optionMatch[1].toLowerCase() === "idcw" || optionMatch[1].toLowerCase() === "dividend"
          ? "IDCW"
          : "Growth",
    };
  }

  return {
    baseName: clean,
    planType: "",
    optionType: "",
  };
};

const parseCategoryPath = (rawCategory: string) => {
  const clean = normalizeText(rawCategory);
  if (!clean) {
    return { mainCategoryName: "Uncategorized", categoryName: "Uncategorized" };
  }

  if (clean.includes(":")) {
    const [mainCategoryName, ...rest] = clean.split(":").map((part) => part.trim()).filter(Boolean);
    const categoryName = rest.join(":").trim() || mainCategoryName || "Uncategorized";
    return {
      mainCategoryName: mainCategoryName || "Uncategorized",
      categoryName,
    };
  }

  if (clean.includes("-")) {
    const [mainCategoryName, ...rest] = clean.split("-").map((part) => part.trim()).filter(Boolean);
    const categoryName = rest.join("-").trim() || mainCategoryName || "Uncategorized";
    return {
      mainCategoryName: mainCategoryName || "Uncategorized",
      categoryName,
    };
  }

  return { mainCategoryName: clean, categoryName: clean };
};

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

  let mainCategory = await findMainCategoryByName(fallbackMainCategoryName);
  if (!mainCategory) {
    mainCategory = await MFMainCategory.create({
      name: fallbackMainCategoryName,
      is_active: 1,
      is_deleted: false,
    });
  }

  const createdCategory = await MFCategory.create({
    name: fallbackCategoryName,
    main_category_id: mainCategory._id,
    is_active: 1,
    is_deleted: false,
  });

  console.info(
    `[mfApiBridgeService] Auto-created MFCategory "${fallbackCategoryName}" under MFMainCategory "${fallbackMainCategoryName}" for API category "${apiCategory || "Uncategorized"}"`,
  );

  return createdCategory._id as mongoose.Types.ObjectId;
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
  const parsedTitle = parseSchemeTitle(scheme.scheme_name || "");

  const amcId = await resolveAmcId(scheme.amc_name || "");
  const categoryId = await resolveCategoryId(scheme.category || "");

  const payload: Record<string, any> = {
    // â”€â”€ Identity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fund_name:   parsedTitle.baseName || scheme.scheme_name,
    scheme_code: scheme.scheme_code || "",
    isin:        scheme.isin || "",
    isin_number: scheme.isin || "",
    plan_type:   mapPlanType(scheme.plan_type || parsedTitle.planType || ""),
    option_type: mapOptionType(scheme.option_type || parsedTitle.optionType || ""),
    // â”€â”€ Bridge refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    mf_api_scheme_id:   scheme._id,
    mf_api_external_key: scheme.external_key,
    mf_api_synced_at:   new Date(),
    // â”€â”€ AMC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ...(amcId ? { amc_id: amcId } : {}),
    // â”€â”€ Category (only set if resolved) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ...(categoryId ? { category_id: categoryId } : {}),
    // â”€â”€ NAV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    nav_Current: toN(scheme.latest_nav),
    nav_date:    toD(scheme.latest_date),
    // â”€â”€ Fund info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // â”€â”€ Market cap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    large_cap_pct: toN(mc.large_cap_pct ?? scheme.market_cap_largecap_percent),
    mid_cap_pct:   toN(mc.mid_cap_pct   ?? scheme.market_cap_midcap_percent),
    small_cap_pct: toN(mc.small_cap_pct ?? scheme.market_cap_smallcap_percent),
    // â”€â”€ Returns (trailing) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      // annual.yearly_returns is NOT overwritten â€” it is manual-only
    },
    // â”€â”€ Risk metrics (best available from API) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    risk_metrics: {
      sharpe_3y:      toN(rm.sharpe_3y),
      alpha_3y:       toN(rm.alpha_1y),   // API only gives 1y alpha
      beta_3y:        toN(rm.beta_1y),    // API only gives 1y beta
      turnover_ratio: toN(scheme.scheme_turnover),
    },
    benchmark_index_name:
      (scheme as any).scheme_benchmark || benchmarkReturns.benchmark_name || "",
    benchmark_returns_trailing: {
      d1: toN(benchmarkReturns["1w"]) ?? null,
      m1: toN(benchmarkReturns["1m"]) ?? null,
      m3: toN(benchmarkReturns["3m"]) ?? null,
      m6: toN(benchmarkReturns["6m"]) ?? null,
      y1: toN(benchmarkReturns["1y"]) ?? null,
      y3: toN(benchmarkReturns["3y"]) ?? null,
      y5: toN(benchmarkReturns["5y"]) ?? null,
      y10: toN(benchmarkReturns["10y"]) ?? null,
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

/**
 * Sync one MfApiScheme into the MFFund collection.
 * Called:
 *   1. When a scheme is activated (toggleSchemeActive â†’ is_active: true)
 *   2. After every successful syncOneScheme call
 *   3. After a successful importMfApiData row
 *
 * Behaviour:
 *   - If MFFund with mf_api_scheme_id already exists â†’ update API fields only
 *   - If MFFund matched by scheme_code â†’ link it and update API fields
 *   - If no MFFund exists â†’ create one (requires amcId; will skip if no amc)
 *   - If is_active is being set to FALSE â†’ do NOT delete MFFund, just stop syncing
 */
export const syncApiSchemeToManual = async (
  schemeId: string,
  options: { activating?: boolean } = {}
): Promise<{ action: "created" | "updated" | "skipped"; reason?: string }> => {
  const scheme = await MfApiScheme.findById(schemeId).lean() as IMfApiScheme | null;
  if (!scheme) return { action: "skipped", reason: "MfApiScheme not found" };

  // NOTE: We intentionally do not route through mfFundService.createFund/updateFund.
  // Those paths strip NAV fields; this bridge writes directly to preserve API data.

  // Only create a new MFFund record if the scheme is active
  // (updating existing records is always allowed for data freshness)
  const schemeActive = scheme.is_active === true;

  try {
    const payload = await buildMFFundPayload(scheme);

    // â”€â”€ Find existing MFFund by bridge ref or scheme_code â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let existing = await MFFund.findOne({
      is_deleted: false,
      $or: [
        { mf_api_scheme_id: scheme._id },
        ...(scheme.scheme_code ? [{ scheme_code: scheme.scheme_code, is_deleted: false }] : []),
        ...(scheme.isin ? [{ isin: scheme.isin, is_deleted: false }] : []),
      ],
    });

    if (existing) {
      // â”€â”€ UPDATE: merge API fields; never touch manual-only fields â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const {
        // Exclude fields that must not be overwritten from API
        returns: payloadReturns,
        risk_metrics: payloadRisk,
        ...scalarFields
      } = payload;

      // Merge returns carefully: keep existing annual.yearly_returns, update trailing only
      const existingReturns = (existing as any).returns || {};
      const mergedReturns = {
        ...existingReturns,
        since_inception: payloadReturns.since_inception ?? existingReturns.since_inception,
        d1: payloadReturns.d1 ?? existingReturns.d1,
        trailing: {
          ...(existingReturns.trailing || {}),
          ...payloadReturns.trailing,
        },
        // annual.yearly_returns is PRESERVED from existing (manual-only)
        annual: {
          ...(existingReturns.annual || {}),
          ytd: (scheme as any).trailing_returns?.ytd ?? existingReturns.annual?.ytd,
          // yearly_returns NOT touched
        },
      };

      // Merge risk_metrics: only update fields the API provides, preserve rest
      const existingRisk = (existing as any).risk_metrics || {};
      const mergedRisk = {
        ...existingRisk,
        ...(payloadRisk.sharpe_3y   !== null ? { sharpe_3y:      payloadRisk.sharpe_3y }   : {}),
        ...(payloadRisk.alpha_3y    !== null ? { alpha_3y:        payloadRisk.alpha_3y }    : {}),
        ...(payloadRisk.beta_3y     !== null ? { beta_3y:         payloadRisk.beta_3y }     : {}),
        ...(payloadRisk.turnover_ratio !== null ? { turnover_ratio: payloadRisk.turnover_ratio } : {}),
      };

      const updateDoc: Record<string, any> = {
        ...scalarFields,
        returns: mergedReturns,
        risk_metrics: mergedRisk,
        mf_api_scheme_id: scheme._id,         // ensure link is set even if matched by scheme_code
        mf_api_external_key: scheme.external_key,
        mf_api_synced_at: new Date(),
      };

      // nav_Current and nav_date: updateFund() deletes these, so update directly via findByIdAndUpdate
      await MFFund.findByIdAndUpdate(existing._id, {
        $set: {
          ...updateDoc,
          nav_Current: payload.nav_Current,
          nav_date: payload.nav_date,
        },
      });

      await upsertNavHistoryFromApiScheme(scheme, String(existing._id));

      const categoryIdToRecompute = String(existing.category_id || payload.category_id || "");
      if (categoryIdToRecompute) {
        await recomputeCategoryAverageReturns(categoryIdToRecompute).catch(() => {});
      }

      return { action: "updated" };
    }

    // â”€â”€ CREATE: only if scheme is active (admin confirmed it) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!schemeActive && !options.activating) {
      return { action: "skipped", reason: "Scheme is not active; MFFund not created yet" };
    }

    if (!payload.amc_id) {
      return { action: "skipped", reason: "Could not resolve AMC; MFFund not created" };
    }

    if (!payload.scheme_code) {
      return { action: "skipped", reason: "scheme_code is required to create MFFund" };
    }

    // Build the initial MFFund document
    const newFund = new MFFund({
      ...payload,
      // Explicit safe defaults for manual-only fields
      returns: {
        ...payload.returns,
        annual: {
          ytd:            (scheme as any).trailing_returns?.ytd ?? null,
          yearly_returns: {},   // empty â€” must be manually imported
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
    if (payload.category_id) {
      await recomputeCategoryAverageReturns(String(payload.category_id)).catch(() => {});
    }
    return { action: "created" };

  } catch (err: any) {
    // Never crash the parent sync â€” log and return
    console.error(`[mfApiBridgeService] syncApiSchemeToManual failed for ${schemeId}:`, err?.message);
    return { action: "skipped", reason: err?.message || "Unknown error" };
  }
};

/**
 * Called when scheme is DEACTIVATED.
 * Does NOT delete the MFFund record â€” just logs that sync will stop.
 * Admin must manually manage the MFFund visibility separately.
 */
export const onSchemeDeactivated = async (schemeId: string): Promise<void> => {
  // Future: could set MFFund.is_active = 0 if desired.
  // For now: do nothing â€” client decided to keep MFFund records alive.
  return;
};

