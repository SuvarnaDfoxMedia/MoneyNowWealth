import mongoose from "mongoose";
import MFFund, { IMFFund } from "../models/mfFundModel";
import MFAmc from "../models/mfAmcModel";
import MFCategory from "../models/mfCategoryModel";
import MFBenchmark from "../models/mfBenchmarkModel";
import MFBenchmarkReturn from "../models/mfBenchmarkReturnModel";
import {
  buildNumericObject,
  buildSort,
  FUND_RETURN_KEYS,
  MF_ANNUAL_YEARS,
  normalizeTopHoldings,
  normalizeYearValueMap,
  parsePagination,
  toBoolean,
  toDateOrNull,
  toNumberOrNull,
} from "./mfUtils";
import { recomputeCategoryAverageReturns } from "./mfCategoryService";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactCaseInsensitive = (value: string) => ({
  $regex: `^${escapeRegex(value.trim())}$`,
  $options: "i",
});

const resolveAmcId = async (payload: any) => {
  if (payload.amc_id) return payload.amc_id;
  if (!payload.amc_name) throw new Error("amc_id or amc_name is required");

  const name = String(payload.amc_name).trim();
  let amc = await MFAmc.findOne({ name, is_deleted: false });
  if (!amc) {
    amc = await MFAmc.create({ name, is_active: 1, is_deleted: false });
  }
  return amc._id;
};

const resolveCategoryId = async (payload: any) => {
  if (payload.category_id && /^[a-f\d]{24}$/i.test(String(payload.category_id))) return payload.category_id;
  throw new Error("category_id (mongo id) is required");
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

const normalizeFundReturns = (value: any) => ({
  ...buildNumericObject(FUND_RETURN_KEYS, value),
  annual: normalizeYearValueMap(value?.annual),
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

const upsertLegacyBenchmarkReturn = async (benchmarkId: any, payload: any) => {
  if (!benchmarkId) return;
  const trailing = payload?.benchmark_returns_trailing || {};
  const annual = Object.fromEntries(
    MF_ANNUAL_YEARS.map((year) => [year, toNumberOrNull(payload?.benchmark_returns_annual?.[year])]),
  );
  const hasTrailingValues = Object.values(trailing).some(
    (value) => value !== null && value !== undefined && value !== "",
  );
  const hasAnnualValues = Object.values(annual).some(
    (value) => value !== null && value !== undefined,
  );
  if (!hasTrailingValues && !hasAnnualValues) return;

  const date = toDateOrNull(payload?.benchmark_date) || new Date();
  await MFBenchmarkReturn.findOneAndUpdate(
    { benchmark_id: benchmarkId, date, is_deleted: false },
    {
      $set: {
        return_1d: toNumberOrNull(trailing?.d1),
        return_1w: toNumberOrNull(trailing?.w1),
        return_1m: toNumberOrNull(trailing?.m1),
        return_3m: toNumberOrNull(trailing?.m3),
        return_6m: toNumberOrNull(trailing?.m6),
        return_ytd: toNumberOrNull(trailing?.ytd),
        return_1y: toNumberOrNull(trailing?.y1),
        return_3y: toNumberOrNull(trailing?.y3),
        return_5y: toNumberOrNull(trailing?.y5),
        return_10y: toNumberOrNull(trailing?.y10),
        annual,
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );
};

const attachBenchmarkPayload = async (funds: any[]) => {
  if (!Array.isArray(funds) || funds.length === 0) return funds;

  const benchmarkIds = [...new Set(
    funds
      .map((fund) => String(fund?.benchmark_id?._id || fund?.benchmark_id || ""))
      .filter(Boolean),
  )];

  if (benchmarkIds.length === 0) {
    return funds.map((fund) => ({
      ...fund,
      benchmark: null,
      benchmark_index_name: "",
      benchmark_returns_trailing: {},
      comparison: {
        fund: {
          return_1y: fund?.returns?.y1 ?? null,
          return_3y: fund?.returns?.y3_cagr ?? null,
          return_5y: fund?.returns?.y5_cagr ?? null,
        },
        benchmark: null,
      },
    }));
  }

  const latestReturns = await MFBenchmarkReturn.aggregate([
    {
      $match: {
        is_deleted: false,
        benchmark_id: {
          $in: benchmarkIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    },
    { $sort: { date: -1 } },
    {
      $group: {
        _id: "$benchmark_id",
        doc: { $first: "$$ROOT" },
      },
    },
  ]);

  const latestMap = new Map(
    latestReturns.map((item: any) => [String(item._id), item.doc]),
  );

  return funds.map((fund) => {
    const benchmarkDoc = fund?.benchmark_id;
    const benchmarkId = String(benchmarkDoc?._id || benchmarkDoc || "");
    const latest = latestMap.get(benchmarkId);
    const benchmarkPayload = benchmarkId
      ? {
          _id: benchmarkId,
          name: benchmarkDoc?.name || "",
          category: benchmarkDoc?.category || "",
          type: benchmarkDoc?.type || "index",
          date: latest?.date || null,
          return_1y: latest?.return_1y ?? null,
          return_3y: latest?.return_3y ?? null,
          return_5y: latest?.return_5y ?? null,
          return_1d: latest?.return_1d ?? null,
          return_1w: latest?.return_1w ?? null,
          return_1m: latest?.return_1m ?? null,
          return_3m: latest?.return_3m ?? null,
          return_6m: latest?.return_6m ?? null,
          return_ytd: latest?.return_ytd ?? null,
          return_10y: latest?.return_10y ?? null,
          annual: latest?.annual ?? {},
          return_since_inception: latest?.return_since_inception ?? null,
        }
      : null;

    return {
      ...fund,
      benchmark: benchmarkPayload,
      benchmark_index_name: benchmarkPayload?.name || "",
      benchmark_returns_trailing: {
        d1: benchmarkPayload?.return_1d ?? null,
        w1: benchmarkPayload?.return_1w ?? null,
        m1: benchmarkPayload?.return_1m ?? null,
        m3: benchmarkPayload?.return_3m ?? null,
        m6: benchmarkPayload?.return_6m ?? null,
        ytd: benchmarkPayload?.return_ytd ?? null,
        y1: benchmarkPayload?.return_1y ?? null,
        y3: benchmarkPayload?.return_3y ?? null,
        y5: benchmarkPayload?.return_5y ?? null,
        y10: benchmarkPayload?.return_10y ?? null,
      },
      benchmark_returns_annual: benchmarkPayload?.annual || {},
      comparison: {
        fund: {
          return_1y: fund?.returns?.y1 ?? null,
          return_3y: fund?.returns?.y3_cagr ?? null,
          return_5y: fund?.returns?.y5_cagr ?? null,
        },
        benchmark: benchmarkPayload
          ? {
              name: benchmarkPayload.name,
              return_1y: benchmarkPayload.return_1y,
              return_3y: benchmarkPayload.return_3y,
              return_5y: benchmarkPayload.return_5y,
            }
          : null,
      },
    };
  });
};

const resolveBenchmarkId = async (payload: any) => {
  if (!payload.benchmark_id && !payload.benchmark_index_name) return null;
  if (payload.benchmark_id) {
    if (!/^[a-f\d]{24}$/i.test(String(payload.benchmark_id))) {
      throw new Error("benchmark_id must be a valid id");
    }
    const benchmark = await MFBenchmark.findOne({
      _id: payload.benchmark_id,
      is_deleted: false,
    }).select("_id");
    if (!benchmark) throw new Error("Benchmark not found");
    return benchmark._id;
  }

  const legacyName = String(payload.benchmark_index_name || "").trim();
  if (!legacyName) return null;
  const type = String(payload.benchmark_type || "index").trim();
  const category = String(payload.benchmark_category || "").trim();
  const existing = await MFBenchmark.findOne({
    is_deleted: false,
    name: exactCaseInsensitive(legacyName),
    type: exactCaseInsensitive(type),
  }).select("_id");
  if (existing) return existing._id;
  const created = await MFBenchmark.create({
    name: legacyName,
    type,
    category,
    is_active: 1,
    is_deleted: false,
  });
  return created._id;
};

export const getFunds = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false };
  const andFilters: any[] = [];

  if (query?.is_active !== undefined) filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  if (query?.is_featured !== undefined) filter.is_featured = toBoolean(query.is_featured);
  if (query?.isPopular !== undefined) filter.is_popular = toBoolean(query.isPopular);
  if (query?.planType) filter.plan_type = query.planType;
  if (query?.optionType) filter.option_type = query.optionType;
  if (query?.riskLevel) filter.riskometer_label = String(query.riskLevel).trim();

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
  const returnsPeriod = String(query?.returnsPeriod || "y3_cagr");
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

  if (minY1 !== null) filter["returns.y1"] = { ...(filter["returns.y1"] || {}), $gte: minY1 };
  if (minY3 !== null) filter["returns.y3_cagr"] = { ...(filter["returns.y3_cagr"] || {}), $gte: minY3 };
  if (minY5 !== null) filter["returns.y5_cagr"] = { ...(filter["returns.y5_cagr"] || {}), $gte: minY5 };
  if (minY10 !== null) filter["returns.y10_cagr"] = { ...(filter["returns.y10_cagr"] || {}), $gte: minY10 };
  if (returnsMin !== null || returnsMax !== null) {
    const key = `returns.${returnsPeriod}`;
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
    returns: { "returns.y3_cagr": -1 },
    returns_y1: { "returns.y1": -1 },
    returns_y3: { "returns.y3_cagr": -1 },
    returns_y5: { "returns.y5_cagr": -1 },
    returns_y10: { "returns.y10_cagr": -1 },
    expense_ratio: { expense_ratio: 1 },
    aum: { aum_cr: -1 },
    risk: { riskometer_label: 1 },
    launch_date: { launch_date: -1 },
  };
  const sort = sortMap[query?.sort] || buildSort(query?.sortBy, query?.sortOrder, { created_at: -1 });
  const [data, total] = await Promise.all([
    MFFund.find(filter)
      .populate("amc_id", "name")
      .populate("benchmark_id", "name category type")
      .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MFFund.countDocuments(filter),
  ]);

  const enrichedData = await attachBenchmarkPayload(data as any[]);

  return {
    success: true,
    data: enrichedData,
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
    returns_y3: { "returns.y3_cagr": -1 },
    aum: { aum_cr: -1 },
    expense_ratio: { expense_ratio: 1 },
  };
  const sort = sortMap[query?.sort] || { "returns.y3_cagr": -1, aum_cr: -1 };

  const [data, total] = await Promise.all([
    MFFund.find(filter)
      .populate("amc_id", "name")
      .populate("benchmark_id", "name category type")
      .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MFFund.countDocuments(filter),
  ]);

  const enrichedData = await attachBenchmarkPayload(data as any[]);

  return {
    success: true,
    data: enrichedData,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

export const getFundById = async (id: string) => {
  const doc = await MFFund.findOne({ _id: id, is_deleted: false })
    .populate("amc_id", "name")
    .populate("benchmark_id", "name category type")
    .populate({
      path: "category_id",
      select: "name main_category_id",
      populate: { path: "main_category_id", select: "name" },
    })
    .lean();
  if (!doc) throw new Error("Fund not found");
  const [enriched] = await attachBenchmarkPayload([doc as any]);
  return enriched;
};

export const createFund = async (payload: Partial<IMFFund> & any) => {
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
  const benchmarkId = await resolveBenchmarkId(payload);

  const topHoldings = normalizeTopHoldings(payload.top_holdings);
  const investmentFlags = normalizeInvestmentFlags(payload);
  const normalizedSchemeCode = String(payload.scheme_code).trim();
  const normalizedFundName = String(payload.fund_name).trim();
  const planType = String(payload.plan_type || "Regular").trim();
  const optionType = String(payload.option_type || "Growth").trim();

  const exists = await MFFund.findOne({
    is_deleted: false,
    $or: [
      { scheme_code: exactCaseInsensitive(normalizedSchemeCode) },
      {
        fund_name: exactCaseInsensitive(normalizedFundName),
        plan_type: planType,
        option_type: optionType,
      },
    ],
  }).select("_id");
  if (exists) throw new Error("Fund already exists");

  const doc = new MFFund({
    ...createData,
    scheme_code: normalizedSchemeCode,
    fund_name: normalizedFundName,
    amc_id: amcId,
    category_id: categoryId,
    isin: String(payload.isin ?? payload.isin_number ?? "").trim(),
    isin_number: String(payload.isin_number ?? payload.isin ?? "").trim(),
    // NAV is system-managed via NAV import; ignore manual NAV inputs.
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
    benchmark_id: benchmarkId,
    min_investment: toNumberOrNull(payload.min_investment),
    ...investmentFlags,
    is_featured: toBoolean(payload.is_featured),
    is_popular: toBoolean(payload.is_popular),
    top_holdings: topHoldings,
    asset_allocation: {
      domestic_equity_pct: toNumberOrNull(payload.asset_allocation?.domestic_equity_pct),
      international_equity_pct: toNumberOrNull(payload.asset_allocation?.international_equity_pct),
      equity_pct: toNumberOrNull(payload.asset_allocation?.equity_pct),
      debt_pct: toNumberOrNull(payload.asset_allocation?.debt_pct),
      other_pct: toNumberOrNull(payload.asset_allocation?.other_pct),
      gold_pct: toNumberOrNull(payload.asset_allocation?.gold_pct ?? payload.asset_allocation?.["% Gold"]),
      cash_pct: toNumberOrNull(payload.asset_allocation?.cash_pct ?? payload.asset_allocation?.["% Cash"]),
    },
    equity_allocation: {
      large_cap_pct: toNumberOrNull(payload.equity_allocation?.large_cap_pct),
      mid_cap_pct: toNumberOrNull(payload.equity_allocation?.mid_cap_pct),
      small_cap_pct: toNumberOrNull(payload.equity_allocation?.small_cap_pct),
    },
    frontend_visibility: normalizeFrontendVisibility(payload.frontend_visibility),
    is_active: payload.is_active ?? 1,
    is_deleted: false,
  });

  await doc.save();
  await upsertLegacyBenchmarkReturn(doc.benchmark_id, payload);
  await recomputeCategoryAverageReturns(String(categoryId));
  return doc;
};

export const updateFund = async (id: string, payload: Partial<IMFFund> & any) => {
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
  if (payload.benchmark_id !== undefined) {
    updateData.benchmark_id = await resolveBenchmarkId(payload);
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

  if (payload.asset_allocation) {
    updateData.asset_allocation = {
      domestic_equity_pct: toNumberOrNull(payload.asset_allocation.domestic_equity_pct),
      international_equity_pct: toNumberOrNull(payload.asset_allocation.international_equity_pct),
      equity_pct: toNumberOrNull(payload.asset_allocation.equity_pct),
      debt_pct: toNumberOrNull(payload.asset_allocation.debt_pct),
      other_pct: toNumberOrNull(payload.asset_allocation.other_pct),
      gold_pct: toNumberOrNull(payload.asset_allocation.gold_pct ?? payload.asset_allocation["% Gold"]),
      cash_pct: toNumberOrNull(payload.asset_allocation.cash_pct ?? payload.asset_allocation["% Cash"]),
    };
  }

  if (payload.equity_allocation) {
    updateData.equity_allocation = {
      large_cap_pct: toNumberOrNull(payload.equity_allocation.large_cap_pct),
      mid_cap_pct: toNumberOrNull(payload.equity_allocation.mid_cap_pct),
      small_cap_pct: toNumberOrNull(payload.equity_allocation.small_cap_pct),
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

  if (payload.top_holdings !== undefined) {
    updateData.top_holdings = normalizeTopHoldings(payload.top_holdings);
  }

  if (payload.frontend_visibility !== undefined) {
    updateData.frontend_visibility = normalizeFrontendVisibility(
      payload.frontend_visibility,
    );
  }

  const nextSchemeCode = String(updateData.scheme_code ?? currentDoc.scheme_code ?? "").trim();
  const nextFundName = String(updateData.fund_name ?? currentDoc.fund_name ?? "").trim();
  const nextPlanType = String(updateData.plan_type ?? currentDoc.plan_type ?? "Regular").trim();
  const nextOptionType = String(updateData.option_type ?? currentDoc.option_type ?? "Growth").trim();

  const exists = await MFFund.findOne({
    _id: { $ne: id },
    is_deleted: false,
    $or: [
      { scheme_code: exactCaseInsensitive(nextSchemeCode) },
      {
        fund_name: exactCaseInsensitive(nextFundName),
        plan_type: nextPlanType,
        option_type: nextOptionType,
      },
    ],
  }).select("_id");
  if (exists) throw new Error("Fund already exists");

  const doc = await MFFund.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!doc) throw new Error("Fund not found");
  await upsertLegacyBenchmarkReturn(doc.benchmark_id, payload);
  const affectedCategoryIds = [
    String(currentDoc.get("category_id") || ""),
    String(updateData.category_id || ""),
  ].filter(Boolean);
  for (const categoryId of [...new Set(affectedCategoryIds)]) {
    await recomputeCategoryAverageReturns(categoryId);
  }
  return doc;
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
