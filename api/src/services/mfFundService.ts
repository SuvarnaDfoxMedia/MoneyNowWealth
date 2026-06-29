import mongoose from "mongoose";
import MFFund, { IMFFund } from "../models/mfFundModel";
import MFAmc from "../models/mfAmcModel";
import MFCategory from "../models/mfCategoryModel";
import MfApiNavHistory from "../models/mfApiNavHistoryModel";
import {
  buildSort,
  normalizeYearValueMap,
  parsePagination,
  toBoolean,
  toDateOrNull,
  toNumberOrNull,
} from "./mfUtils";
import { recomputeCategoryAverageReturns } from "./mfCategoryService";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

import { MfAliasResolver } from "./mf-import/MfAliasResolver";
import { MfTransactionService } from "./mf-import/mfTransactionService";
import { MfRepository } from "../db/mfRepository";

const resolveAmcId = async (payload: any) => {
  const amcSearch = payload.amc_id || payload.amc_name;
  if (!amcSearch) throw new Error("amc_id or amc_name is required");

  // Implementation Task 3: Alias Resolution (No entity creation may bypass)
  const amc = await MfAliasResolver.resolveAmc(amcSearch);
  if (!amc) {
    throw new Error(`Unknown AMC: ${amcSearch}. Orphan creation is prevented.`);
  }
  return amc._id;
};

const resolveCategoryId = async (payload: any) => {
  const catSearch = payload.category_id || payload.category_name;
  if (!catSearch) throw new Error("category_id or category_name is required");

  const category = await MfAliasResolver.resolveCategory(catSearch);
  if (!category) {
    throw new Error(`Unknown Category: ${catSearch}. Orphan creation is prevented.`);
  }
  return category._id;
};

const normalizeInvestmentFlags = (payload: any) => {
  const sipAllowed =
    payload.sip_allowed !== undefined ? toBoolean(payload.sip_allowed) : true;
  const lumpsumAllowed =
    payload.lumpsum_allowed !== undefined ? toBoolean(payload.lumpsum_allowed) : true;

  return {
    sip_allowed: sipAllowed,
    lumpsum_allowed: lumpsumAllowed,
    min_sip_investment: sipAllowed
      ? toNumberOrNull(payload.min_sip_investment)
      : null,
    min_lumpsum_investment: lumpsumAllowed
      ? toNumberOrNull(payload.min_lumpsum_investment ?? payload.min_investment)
      : null,
  };
};

import { normalizeReturnsObject } from "../utils/returnMapper";

const normalizeFundReturns = (value: any) => ({
  d1: toNumberOrNull(value?.d1 ?? value?.return_1d),
  since_inception: toNumberOrNull(
    value?.since_inception ?? value?.trailing?.since_launch ?? value?.inception_return,
  ),
  ...normalizeReturnsObject(value),
});

const normalizeVisibilityMap = (value: any) => {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, rawValue]) => [key, toBoolean(rawValue)]),
  );
};

const normalizeFrontendVisibility = (value: any) => ({
  groups: normalizeVisibilityMap(value?.groups),
  fields: normalizeVisibilityMap(value?.fields),
});

export const getFunds = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false };
  const andFilters: any[] = [];

  if (query?.is_active !== undefined) filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  if (query?.is_featured !== undefined) filter.is_featured = toBoolean(query.is_featured);
  if (query?.isPopular !== undefined) filter.is_popular = toBoolean(query.isPopular);
  if (query?.planType) filter.plan_type = query.planType;
  if (query?.optionType) filter.option_type = query.optionType;

  if (query?.categoryId) {
    const rawCategoryId = String(query.categoryId);
    if (/^[a-f\d]{24}$/i.test(rawCategoryId)) {
      const objectId = new mongoose.Types.ObjectId(rawCategoryId);
      let categoryFilter: any = { category_id: objectId };

      const rawCategory = await MFCategory.collection.findOne(
        { _id: objectId },
        { projection: { category_id: 1 } },
      );
      if (rawCategory?.category_id) {
        const legacyId = String(rawCategory.category_id);
        categoryFilter = {
          $or: [
            { category_id: objectId },
            // Avoid ObjectId casting errors on legacy string ids.
            { $expr: { $eq: [{ $toString: "$category_id" }, legacyId] } },
            { category_excel_id: legacyId },
          ],
        };
      }
      andFilters.push(categoryFilter);
    } else {
      // Legacy string id fallback
      andFilters.push({
        $or: [
          { $expr: { $eq: [{ $toString: "$category_id" }, rawCategoryId] } },
          { category_excel_id: rawCategoryId },
        ],
      });
    }
  }
  const fundId = query?.fundId;
  if (fundId && /^[a-f\d]{24}$/i.test(String(fundId))) {
    filter._id = fundId;
  }

  if (query?.mainCategoryId) {
    const cats = await MFCategory.find({ main_category_id: query.mainCategoryId, is_deleted: false }).select("_id").lean();
    if (cats.length > 0) filter.category_id = { $in: cats.map((x) => x._id) };
  }

  if (query?.amcId) {
    if (/^[a-f\d]{24}$/i.test(String(query.amcId))) filter.amc_id = query.amcId;
  }

  const minY1 = toNumberOrNull(query?.minY1);
  const minY3 = toNumberOrNull(query?.minY3);
  const minY5 = toNumberOrNull(query?.minY5);
  const minY10 = toNumberOrNull(query?.minY10);
  let expenseMin = toNumberOrNull(query?.expenseMin ?? query?.expenseRatioMin);
  let expenseMax = toNumberOrNull(query?.expenseMax ?? query?.expenseRatioMax);
  let aumMin = toNumberOrNull(query?.aumMin ?? query?.aumRangeMin);
  let aumMax = toNumberOrNull(query?.aumMax ?? query?.aumRangeMax);
  if (query?.aumRange && typeof query.aumRange === "string") {
    const [minStr, maxStr] = query.aumRange.split(",").map((x: string) => x.trim());
    if (aumMin === null) aumMin = toNumberOrNull(minStr);
    if (aumMax === null) aumMax = toNumberOrNull(maxStr);
  }
  let returnsMin = toNumberOrNull(query?.returnsMin);
  let returnsMax = toNumberOrNull(query?.returnsMax);
  const returnsPeriod = String(query?.returnsPeriod || "3y");
  if (query?.returnsRange && typeof query.returnsRange === "string") {
    const [minStr, maxStr] = query.returnsRange.split(",").map((x: string) => x.trim());
    if (returnsMin === null) returnsMin = toNumberOrNull(minStr);
    if (returnsMax === null) returnsMax = toNumberOrNull(maxStr);
  }
  if (query?.expenseRatio && typeof query.expenseRatio === "string") {
    const [minStr, maxStr] = query.expenseRatio.split(",").map((x: string) => x.trim());
    if (expenseMin === null) expenseMin = toNumberOrNull(minStr);
    if (expenseMax === null) expenseMax = toNumberOrNull(maxStr);
  }

  if (minY1 !== null) filter["returns.trailing.1y"] = { ...(filter["returns.trailing.1y"] || {}), $gte: minY1 };
  if (minY3 !== null) filter["returns.trailing.3y"] = { ...(filter["returns.trailing.3y"] || {}), $gte: minY3 };
  if (minY5 !== null) filter["returns.trailing.5y"] = { ...(filter["returns.trailing.5y"] || {}), $gte: minY5 };
  if (minY10 !== null) filter["returns.trailing.10y"] = { ...(filter["returns.trailing.10y"] || {}), $gte: minY10 };
  if (returnsMin !== null || returnsMax !== null) {
    const key = `returns.trailing.${returnsPeriod}`;
    filter[key] = filter[key] || {};
    if (returnsMin !== null) filter[key].$gte = returnsMin;
    if (returnsMax !== null) filter[key].$lte = returnsMax;
  }
  if (expenseMin !== null || expenseMax !== null) {
    filter.expense_ratio = {};
    if (expenseMin !== null) filter.expense_ratio.$gte = expenseMin;
    if (expenseMax !== null) filter.expense_ratio.$lte = expenseMax;
  }
  if (aumMin !== null || aumMax !== null) {
    filter.aum_cr = {};
    if (aumMin !== null) filter.aum_cr.$gte = aumMin;
    if (aumMax !== null) filter.aum_cr.$lte = aumMax;
  }

  if (query?.search) {
    const s = String(query.search).trim();
    filter.$or = [
      { scheme_code: { $regex: s, $options: "i" } },
      { fund_name: { $regex: s, $options: "i" } },
      { fund_manager: { $regex: s, $options: "i" } },
    ];
  }
  if (andFilters.length > 0) {
    filter.$and = [...(filter.$and || []), ...andFilters];
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    returns: { "returns.trailing.3y": -1 },
    returns_y1: { "returns.trailing.1y": -1 },
    returns_y3: { "returns.trailing.3y": -1 },
    returns_y5: { "returns.trailing.5y": -1 },
    returns_y10: { "returns.trailing.10y": -1 },
    expense_ratio: { expense_ratio: 1 },
    aum: { aum_cr: -1 },
    launch_date: { launch_date: -1 },
  };
  const sort = sortMap[query?.sort] || buildSort(query?.sortBy, query?.sortOrder, { created_at: -1 }, ["fund_name", "nav_Current", "aum_cr", "expense_ratio", "created_at", "updated_at", "returns.trailing.1y"]);
  const [data, total] = await Promise.all([
    MFFund.find(filter)
      .populate("amc_id", "name")
      .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MFFund.countDocuments(filter),
  ]);

    return {
    success: true,
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
    filters: {
      categoryId: query?.categoryId,
      mainCategoryId: query?.mainCategoryId,
      amcId: query?.amcId,
      planType: query?.planType,
      optionType: query?.optionType,
    },
  };
};

export const getPopularFunds = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false, is_active: 1, is_popular: true };

  if (query?.categoryId && /^[a-f\d]{24}$/i.test(String(query.categoryId))) {
    filter.category_id = query.categoryId;
  }
  if (query?.amcId && /^[a-f\d]{24}$/i.test(String(query.amcId))) {
    filter.amc_id = query.amcId;
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    returns_y3: { "returns.trailing.3y": -1 },
    aum: { aum_cr: -1 },
    expense_ratio: { expense_ratio: 1 },
  };
  const sort = sortMap[query?.sort] || { "returns.trailing.3y": -1, aum_cr: -1 };

  const [data, total] = await Promise.all([
    MFFund.find(filter)
      .populate("amc_id", "name")
      .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MFFund.countDocuments(filter),
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

export const getFundById = async (id: string) => {
  const doc = await MFFund.findOne({ _id: id, is_deleted: false })
    .select("-data_source -last_manual_import_at -mf_api_external_key")
    .populate("amc_id", "name")
    .populate({
      path: "category_id",
      select: "name main_category_id",
      populate: { path: "main_category_id", select: "name" },
    })
    .populate({
      path: "mf_api_scheme_id",
      select: "scheme_performance_list scheme_peer_comparision_list risk_statistics_list rating rating_value",
    })
    .lean();
  if (!doc) throw new Error("Fund not found");
  return doc;
};

export const getFundNavHistory = async (id: string, days: number = 365) => {
  const fund = await MFFund.findById(id).select("mf_api_scheme_id").lean();
  if (!fund) throw new Error("Fund not found");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Use NavHistory from the bridging table instead of MfApiNavHistory
  // Wait, MfApiNavHistory has nav_change, nav_change_pct which are required by the chart!
  // NavHistory might not have them? Actually, NavMovementChart doesn't use nav_change for historical points, only for the latest.
  // Wait, `mf_api_scheme_id` is the key for MfApiNavHistory. Let's just query MfApiNavHistory directly to save processing!
  
  if (!fund.mf_api_scheme_id) {
    return [];
  }
  
  const history = await MfApiNavHistory.find({
    scheme_id: fund.mf_api_scheme_id,
    date: { $gte: cutoffDate }
  }).sort({ date: -1 }).lean();
  
  return history;
};

export const createFund = async (payload: Partial<IMFFund> & any) => {
  // Implementation Task 2 & 7: Admin UI Transaction Integrity & Shared Engine Reuse
  return await MfTransactionService.executeWithTransaction(async (session) => {
    const createData: any = { ...payload };
    delete createData.nav_Current;
    delete createData.nav_current;
    delete createData.nav_date;

    if (!payload.scheme_code) {
      throw new Error("scheme_code is required");
    }
    if (!payload.fund_name) {
      throw new Error("fund_name is required");
    }

    const amcId = await resolveAmcId(payload);
    const categoryId = await resolveCategoryId(payload);

    const investmentFlags = normalizeInvestmentFlags(payload);
    const normalizedSchemeCode = String(payload.scheme_code).trim();
    const normalizedFundName = String(payload.fund_name).trim();
    const planType = String(payload.plan_type || "Regular").trim();
    const optionType = String(payload.option_type || "Growth").trim();

    // Mapping payload to standard DB structure
    const mappedData = {
      ...createData,
      scheme_code: normalizedSchemeCode,
      fund_name: normalizedFundName,
      amc_id: amcId,
      category_id: categoryId,
      isin: String(payload.isin ?? payload.isin_number ?? "").trim(),
      isin_number: String(payload.isin_number ?? payload.isin ?? "").trim(),
      aum: toNumberOrNull(payload.aum ?? payload.aum_cr),
      aum_cr: toNumberOrNull(payload.aum_cr ?? payload.aum),
      expense_ratio: toNumberOrNull(payload.expense_ratio),
      returns: normalizeFundReturns({
        ...payload.returns,
        since_inception:
          payload.returns?.since_inception ??
          payload.returns?.["Since Inception Return"] ??
          payload.inception_return,
        y1: payload.returns?.y1 ?? payload.y1_return,
        y3_cagr: payload.returns?.y3_cagr ?? payload.y3_cagr,
        y5_cagr: payload.returns?.y5_cagr ?? payload.y5_cagr,
        y10_cagr: payload.returns?.y10_cagr ?? payload.y10_cagr,
      }),
      risk_metrics: {
        sharpe_3y: toNumberOrNull(payload.risk_metrics?.sharpe_3y),
        sharpe_5y: toNumberOrNull(payload.risk_metrics?.sharpe_5y),
        std_dev_3y: toNumberOrNull(payload.risk_metrics?.std_dev_3y),
        std_dev_5y: toNumberOrNull(payload.risk_metrics?.std_dev_5y),
        beta_3y: toNumberOrNull(payload.risk_metrics?.beta_3y),
        beta_5y: toNumberOrNull(payload.risk_metrics?.beta_5y),
        alpha_3y: toNumberOrNull(payload.risk_metrics?.alpha_3y),
        alpha_5y: toNumberOrNull(payload.risk_metrics?.alpha_5y),
        max_drawdown_5y: toNumberOrNull(payload.risk_metrics?.max_drawdown_5y),
        max_drawdown_10y: toNumberOrNull(payload.risk_metrics?.max_drawdown_10y),
        turnover_ratio: toNumberOrNull(payload.risk_metrics?.turnover_ratio),
      },
      launch_date: toDateOrNull(payload.launch_date),
      min_investment: toNumberOrNull(payload.min_investment),
      ...investmentFlags,
      is_featured: toBoolean(payload.is_featured),
      is_popular: toBoolean(payload.is_popular),
      domestic_equity_pct: toNumberOrNull(payload.domestic_equity_pct),
      international_equity_pct: toNumberOrNull(payload.international_equity_pct),
      debt_pct: toNumberOrNull(payload.debt_pct),
      other_pct: toNumberOrNull(payload.other_pct),
      gold_pct: toNumberOrNull(payload.gold_pct),
      cash_pct: toNumberOrNull(payload.cash_pct),
      large_cap_pct: toNumberOrNull(payload.large_cap_pct),
      mid_cap_pct: toNumberOrNull(payload.mid_cap_pct),
      small_cap_pct: toNumberOrNull(payload.small_cap_pct),
      tax_type: String(payload.tax_type || "").trim(),
      riskometer_label: String(payload.riskometer_label || "").trim(),
      frontend_visibility: normalizeFrontendVisibility(payload.frontend_visibility),
      is_active: payload.is_active ?? 1,
      is_deleted: false,
    };

    // Implementation Task 8: Data Consistency (Use upsertFund to process through Alias Resolver)
    const doc = await MfRepository.upsertFund({ scheme_code: normalizedSchemeCode }, mappedData);
    
    // We don't await recompute to prevent transaction block, or we can await since it's fast
    await recomputeCategoryAverageReturns(String(categoryId));
    return doc;
  });
};

export const updateFund = async (id: string, payload: Partial<IMFFund> & any) => {
  // Implementation Task 2 & 7: Admin UI Transaction Integrity
  return await MfTransactionService.executeWithTransaction(async (session) => {
    const updateData: any = { ...payload };
    ["_id", "created_at", "updated_at", "deleted_at", "is_deleted"].forEach((k) => delete updateData[k]);
    delete updateData.nav_Current;
    delete updateData.nav_current;
    delete updateData.nav_date;
    const currentDoc = await MFFund.findOne({ _id: id, is_deleted: false }).select(
      "scheme_code fund_name plan_type option_type category_id",
    );
    if (!currentDoc) throw new Error("Fund not found");

if (payload.amc_name || payload.amc_id) {
    updateData.amc_id = await resolveAmcId(payload);
  }

  if (payload.category_id) {
    updateData.category_id = await resolveCategoryId(payload);
  }
  // Correct three-way benchmark_id guard:
  //   - valid string → keep the provided ObjectId
  //   - explicit null  → intentional clear
  //   - undefined (not in payload) → leave existing value untouched
  if (payload.benchmark_id !== undefined && payload.benchmark_id !== null) {
    updateData.benchmark_id = payload.benchmark_id; // valid ObjectId — preserve it
  } else if (payload.benchmark_id === null) {
    updateData.benchmark_id = null; // caller explicitly wants to clear the link
  }
  // If undefined: field is not in payload, so updateData already has the raw
  // spread value from line 399 — remove it to avoid accidentally overwriting.
  else {
    delete updateData.benchmark_id;
  }

  if (payload.returns || payload.y1_return || payload.y3_cagr || payload.y5_cagr || payload.y10_cagr) {
    updateData.returns = normalizeFundReturns({
      ...payload.returns,
      since_inception:
        payload.returns?.since_inception ??
        payload.returns?.["Since Inception Return"] ??
        payload.inception_return,
      y1: payload.returns?.y1 ?? payload.y1_return,
      y3_cagr: payload.returns?.y3_cagr ?? payload.y3_cagr,
      y5_cagr: payload.returns?.y5_cagr ?? payload.y5_cagr,
      y10_cagr: payload.returns?.y10_cagr ?? payload.y10_cagr,
    });
  }

  if (payload.risk_metrics) {
    updateData.risk_metrics = {
      sharpe_3y: toNumberOrNull(payload.risk_metrics.sharpe_3y),
      sharpe_5y: toNumberOrNull(payload.risk_metrics.sharpe_5y),
      std_dev_3y: toNumberOrNull(payload.risk_metrics.std_dev_3y),
      std_dev_5y: toNumberOrNull(payload.risk_metrics.std_dev_5y),
      beta_3y: toNumberOrNull(payload.risk_metrics.beta_3y),
      beta_5y: toNumberOrNull(payload.risk_metrics.beta_5y),
      alpha_3y: toNumberOrNull(payload.risk_metrics.alpha_3y),
      alpha_5y: toNumberOrNull(payload.risk_metrics.alpha_5y),
      max_drawdown_5y: toNumberOrNull(payload.risk_metrics.max_drawdown_5y),
      max_drawdown_10y: toNumberOrNull(payload.risk_metrics.max_drawdown_10y),
      turnover_ratio: toNumberOrNull(payload.risk_metrics.turnover_ratio),
    };
  }


  if (payload.scheme_code !== undefined) updateData.scheme_code = String(payload.scheme_code || "").trim();
  if (payload.isin !== undefined || payload.isin_number !== undefined) {
    updateData.isin = String(payload.isin ?? payload.isin_number ?? "").trim();
    updateData.isin_number = String(payload.isin_number ?? payload.isin ?? "").trim();
  }
  if (payload.fund_name !== undefined) updateData.fund_name = String(payload.fund_name || "").trim();
  // NAV is system-managed via NAV import; ignore manual NAV inputs.
  if (payload.aum !== undefined || payload.aum_cr !== undefined) {
    updateData.aum = toNumberOrNull(payload.aum ?? payload.aum_cr);
    updateData.aum_cr = toNumberOrNull(payload.aum_cr ?? payload.aum);
  }
  if (payload.expense_ratio !== undefined) updateData.expense_ratio = toNumberOrNull(payload.expense_ratio);
  if (payload.launch_date !== undefined) updateData.launch_date = toDateOrNull(payload.launch_date);
  if (payload.min_investment !== undefined) updateData.min_investment = toNumberOrNull(payload.min_investment);
  if (
    payload.sip_allowed !== undefined ||
    payload.lumpsum_allowed !== undefined ||
    payload.min_sip_investment !== undefined ||
    payload.min_lumpsum_investment !== undefined
  ) {
    Object.assign(updateData, normalizeInvestmentFlags(payload));
  }
  if (payload.is_featured !== undefined) updateData.is_featured = toBoolean(payload.is_featured);
  if (payload.is_popular !== undefined) updateData.is_popular = toBoolean(payload.is_popular);
  if (payload.domestic_equity_pct !== undefined) updateData.domestic_equity_pct = toNumberOrNull(payload.domestic_equity_pct);
  if (payload.international_equity_pct !== undefined) updateData.international_equity_pct = toNumberOrNull(payload.international_equity_pct);
  if (payload.debt_pct !== undefined) updateData.debt_pct = toNumberOrNull(payload.debt_pct);
  if (payload.other_pct !== undefined) updateData.other_pct = toNumberOrNull(payload.other_pct);
  if (payload.gold_pct !== undefined) updateData.gold_pct = toNumberOrNull(payload.gold_pct);
    if (payload.amc_name || payload.amc_id) {
      updateData.amc_id = await resolveAmcId(payload);
    }

    if (payload.category_id) {
      updateData.category_id = await resolveCategoryId(payload);
    }

    if (payload.benchmark_id !== undefined && payload.benchmark_id !== null) {
      updateData.benchmark_id = payload.benchmark_id; 
    } else if (payload.benchmark_id === null) {
      updateData.benchmark_id = null; 
    } else {
      delete updateData.benchmark_id;
    }

    if (payload.returns || payload.y1_return || payload.y3_cagr || payload.y5_cagr || payload.y10_cagr) {
      updateData.returns = normalizeFundReturns({
        ...payload.returns,
        since_inception:
          payload.returns?.since_inception ??
          payload.returns?.["Since Inception Return"] ??
          payload.inception_return,
        y1: payload.returns?.y1 ?? payload.y1_return,
        y3_cagr: payload.returns?.y3_cagr ?? payload.y3_cagr,
        y5_cagr: payload.returns?.y5_cagr ?? payload.y5_cagr,
        y10_cagr: payload.returns?.y10_cagr ?? payload.y10_cagr,
      });
    }

    if (payload.risk_metrics) {
      updateData.risk_metrics = {
        sharpe_3y: toNumberOrNull(payload.risk_metrics.sharpe_3y),
        sharpe_5y: toNumberOrNull(payload.risk_metrics.sharpe_5y),
        std_dev_3y: toNumberOrNull(payload.risk_metrics.std_dev_3y),
        std_dev_5y: toNumberOrNull(payload.risk_metrics.std_dev_5y),
        beta_3y: toNumberOrNull(payload.risk_metrics.beta_3y),
        beta_5y: toNumberOrNull(payload.risk_metrics.beta_5y),
        alpha_3y: toNumberOrNull(payload.risk_metrics.alpha_3y),
        alpha_5y: toNumberOrNull(payload.risk_metrics.alpha_5y),
        max_drawdown_5y: toNumberOrNull(payload.risk_metrics.max_drawdown_5y),
        max_drawdown_10y: toNumberOrNull(payload.risk_metrics.max_drawdown_10y),
        turnover_ratio: toNumberOrNull(payload.risk_metrics.turnover_ratio),
      };
    }

    if (payload.scheme_code !== undefined) updateData.scheme_code = String(payload.scheme_code || "").trim();
    if (payload.isin !== undefined || payload.isin_number !== undefined) {
      updateData.isin = String(payload.isin ?? payload.isin_number ?? "").trim();
      updateData.isin_number = String(payload.isin_number ?? payload.isin ?? "").trim();
    }
    if (payload.fund_name !== undefined) updateData.fund_name = String(payload.fund_name || "").trim();
    if (payload.aum !== undefined || payload.aum_cr !== undefined) {
      updateData.aum = toNumberOrNull(payload.aum ?? payload.aum_cr);
      updateData.aum_cr = toNumberOrNull(payload.aum_cr ?? payload.aum);
    }
    if (payload.expense_ratio !== undefined) updateData.expense_ratio = toNumberOrNull(payload.expense_ratio);
    if (payload.launch_date !== undefined) updateData.launch_date = toDateOrNull(payload.launch_date);
    if (payload.min_investment !== undefined) updateData.min_investment = toNumberOrNull(payload.min_investment);
    if (
      payload.sip_allowed !== undefined ||
      payload.lumpsum_allowed !== undefined ||
      payload.min_sip_investment !== undefined ||
      payload.min_lumpsum_investment !== undefined
    ) {
      Object.assign(updateData, normalizeInvestmentFlags(payload));
    }
    if (payload.is_featured !== undefined) updateData.is_featured = toBoolean(payload.is_featured);
    if (payload.is_popular !== undefined) updateData.is_popular = toBoolean(payload.is_popular);
    if (payload.domestic_equity_pct !== undefined) updateData.domestic_equity_pct = toNumberOrNull(payload.domestic_equity_pct);
    if (payload.international_equity_pct !== undefined) updateData.international_equity_pct = toNumberOrNull(payload.international_equity_pct);
    if (payload.debt_pct !== undefined) updateData.debt_pct = toNumberOrNull(payload.debt_pct);
    if (payload.other_pct !== undefined) updateData.other_pct = toNumberOrNull(payload.other_pct);
    if (payload.gold_pct !== undefined) updateData.gold_pct = toNumberOrNull(payload.gold_pct);
    if (payload.cash_pct !== undefined) updateData.cash_pct = toNumberOrNull(payload.cash_pct);
    if (payload.large_cap_pct !== undefined) updateData.large_cap_pct = toNumberOrNull(payload.large_cap_pct);
    if (payload.mid_cap_pct !== undefined) updateData.mid_cap_pct = toNumberOrNull(payload.mid_cap_pct);
    if (payload.small_cap_pct !== undefined) updateData.small_cap_pct = toNumberOrNull(payload.small_cap_pct);
    if (payload.tax_type !== undefined) updateData.tax_type = String(payload.tax_type || "").trim();
    if (payload.riskometer_label !== undefined) updateData.riskometer_label = String(payload.riskometer_label || "").trim();

    if (payload.frontend_visibility !== undefined) {
      updateData.frontend_visibility = normalizeFrontendVisibility(
        payload.frontend_visibility,
      );
    }

    // Task 8: Data Consistency. We no longer use findByIdAndUpdate, we push it through upsertFund
    // which relies on MfAliasResolver and prevents duplicate orphan overlaps
    const doc = await MfRepository.upsertFund({ _id: id }, updateData);
    if (!doc) throw new Error("Fund not found");

    const affectedCategoryIds = [
      String(currentDoc.get("category_id") || ""),
      String(updateData.category_id || ""),
    ].filter((val, index, self) => val && self.indexOf(val) === index);

    for (const catId of affectedCategoryIds) {
      await recomputeCategoryAverageReturns(catId);
    }

    return doc;
  });
};

export const toggleFundStatus = async (id: string) => {
  const doc = await MFFund.findById(id);
  if (!doc || doc.is_deleted) throw new Error("Fund not found");
  doc.is_active = doc.is_active === 1 ? 0 : 1;
  await doc.save();
  return doc;
};

export const deleteFund = async (id: string) => {
  const doc = await MFFund.findById(id);
  if (!doc) throw new Error("Fund not found");
  doc.is_deleted = true;
  doc.is_active = 0;
  doc.deleted_at = new Date();
  await doc.save();
  return doc;
};
