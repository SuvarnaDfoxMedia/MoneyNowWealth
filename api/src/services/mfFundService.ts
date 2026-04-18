import mongoose from "mongoose";
import MFFund, { IMFFund } from "../models/mfFundModel";
import MFAmc from "../models/mfAmcModel";
import MFCategory from "../models/mfCategoryModel";
import { buildSort, parsePagination, toDateOrNull, toNumberOrNull, toBoolean } from "./mfUtils";

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
    returns_y3: { "returns.y3_cagr": -1 },
    aum: { aum_cr: -1 },
    expense_ratio: { expense_ratio: 1 },
  };
  const sort = sortMap[query?.sort] || { "returns.y3_cagr": -1, aum_cr: -1 };

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
    .populate("amc_id", "name")
    .populate({
      path: "category_id",
      select: "name main_category_id",
      populate: { path: "main_category_id", select: "name" },
    });
  if (!doc) throw new Error("Fund not found");
  return doc;
};

export const createFund = async (payload: Partial<IMFFund> & any) => {
  if (!payload.scheme_code) {
    throw new Error("scheme_code is required");
  }
  if (!payload.fund_name) {
    throw new Error("fund_name is required");
  }

  const amcId = await resolveAmcId(payload);
  const categoryId = await resolveCategoryId(payload);

  const topHoldings = Array.isArray(payload.top_holdings)
    ? payload.top_holdings
    : typeof payload.top_holdings === "string"
      ? payload.top_holdings.split(",").map((x: string) => x.trim()).filter(Boolean)
      : [];
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
    ...payload,
    scheme_code: normalizedSchemeCode,
    fund_name: normalizedFundName,
    amc_id: amcId,
    category_id: categoryId,
    aum_cr: toNumberOrNull(payload.aum_cr),
    expense_ratio: toNumberOrNull(payload.expense_ratio),
    returns: {
      d1: toNumberOrNull(payload.returns?.d1) ?? 0,
      m1: toNumberOrNull(payload.returns?.m1) ?? 0,
      m3: toNumberOrNull(payload.returns?.m3) ?? 0,
      m6: toNumberOrNull(payload.returns?.m6) ?? 0,
      y1: toNumberOrNull(payload.returns?.y1 ?? payload.y1_return),
      y3_cagr: toNumberOrNull(payload.returns?.y3_cagr ?? payload.y3_cagr),
      y5_cagr: toNumberOrNull(payload.returns?.y5_cagr ?? payload.y5_cagr),
      y10_cagr: toNumberOrNull(payload.returns?.y10_cagr ?? payload.y10_cagr),
    },
    risk_metrics: {
      sharpe_3y: toNumberOrNull(payload.risk_metrics?.sharpe_3y),
      std_dev_3y: toNumberOrNull(payload.risk_metrics?.std_dev_3y),
      beta_3y: toNumberOrNull(payload.risk_metrics?.beta_3y),
      alpha_3y: toNumberOrNull(payload.risk_metrics?.alpha_3y),
      max_drawdown_5y: toNumberOrNull(payload.risk_metrics?.max_drawdown_5y),
      turnover_ratio: toNumberOrNull(payload.risk_metrics?.turnover_ratio),
    },
    launch_date: toDateOrNull(payload.launch_date),
    benchmark_index_name: String(payload.benchmark_index_name || "").trim(),
    benchmark_returns_trailing: {
      d1: toNumberOrNull(payload.benchmark_returns_trailing?.d1) ?? 0,
      m1: toNumberOrNull(payload.benchmark_returns_trailing?.m1) ?? 0,
      m3: toNumberOrNull(payload.benchmark_returns_trailing?.m3) ?? 0,
      m6: toNumberOrNull(payload.benchmark_returns_trailing?.m6) ?? 0,
      y1: toNumberOrNull(payload.benchmark_returns_trailing?.y1),
      y3: toNumberOrNull(payload.benchmark_returns_trailing?.y3),
      y5: toNumberOrNull(payload.benchmark_returns_trailing?.y5),
      y10: toNumberOrNull(payload.benchmark_returns_trailing?.y10),
    },
    benchmark_returns_annual: {
      y1: toNumberOrNull(payload.benchmark_returns_annual?.y1),
      y3: toNumberOrNull(payload.benchmark_returns_annual?.y3),
      y5: toNumberOrNull(payload.benchmark_returns_annual?.y5),
      y10: toNumberOrNull(payload.benchmark_returns_annual?.y10),
    },
    min_investment: toNumberOrNull(payload.min_investment),
    ...investmentFlags,
    is_featured: toBoolean(payload.is_featured),
    is_popular: toBoolean(payload.is_popular),
    top_holdings: topHoldings,
    asset_allocation: {
      equity_pct: toNumberOrNull(payload.asset_allocation?.equity_pct),
      debt_pct: toNumberOrNull(payload.asset_allocation?.debt_pct),
      other_pct: toNumberOrNull(payload.asset_allocation?.other_pct),
    },
    is_active: payload.is_active ?? 1,
    is_deleted: false,
  });

  await doc.save();
  return doc;
};

export const updateFund = async (id: string, payload: Partial<IMFFund> & any) => {
  const updateData: any = { ...payload };
  ["_id", "created_at", "updated_at", "deleted_at", "is_deleted"].forEach((k) => delete updateData[k]);
  const currentDoc = await MFFund.findOne({ _id: id, is_deleted: false }).select(
    "scheme_code fund_name plan_type option_type",
  );
  if (!currentDoc) throw new Error("Fund not found");

if (payload.amc_name || payload.amc_id) {
    updateData.amc_id = await resolveAmcId(payload);
  }

  if (payload.category_id) {
    updateData.category_id = await resolveCategoryId(payload);
  }

  if (payload.returns || payload.y1_return || payload.y3_cagr || payload.y5_cagr || payload.y10_cagr) {
    updateData.returns = {
      d1: toNumberOrNull(payload.returns?.d1) ?? 0,
      m1: toNumberOrNull(payload.returns?.m1) ?? 0,
      m3: toNumberOrNull(payload.returns?.m3) ?? 0,
      m6: toNumberOrNull(payload.returns?.m6) ?? 0,
      y1: toNumberOrNull(payload.returns?.y1 ?? payload.y1_return),
      y3_cagr: toNumberOrNull(payload.returns?.y3_cagr ?? payload.y3_cagr),
      y5_cagr: toNumberOrNull(payload.returns?.y5_cagr ?? payload.y5_cagr),
      y10_cagr: toNumberOrNull(payload.returns?.y10_cagr ?? payload.y10_cagr),
    };
  }

  if (payload.risk_metrics) {
    updateData.risk_metrics = {
      sharpe_3y: toNumberOrNull(payload.risk_metrics.sharpe_3y),
      std_dev_3y: toNumberOrNull(payload.risk_metrics.std_dev_3y),
      beta_3y: toNumberOrNull(payload.risk_metrics.beta_3y),
      alpha_3y: toNumberOrNull(payload.risk_metrics.alpha_3y),
      max_drawdown_5y: toNumberOrNull(payload.risk_metrics.max_drawdown_5y),
      turnover_ratio: toNumberOrNull(payload.risk_metrics.turnover_ratio),
    };
  }

  if (payload.asset_allocation) {
    updateData.asset_allocation = {
      equity_pct: toNumberOrNull(payload.asset_allocation.equity_pct),
      debt_pct: toNumberOrNull(payload.asset_allocation.debt_pct),
      other_pct: toNumberOrNull(payload.asset_allocation.other_pct),
    };
  }

  if (payload.scheme_code !== undefined) updateData.scheme_code = String(payload.scheme_code || "").trim();
  if (payload.fund_name !== undefined) updateData.fund_name = String(payload.fund_name || "").trim();
  if (payload.aum_cr !== undefined) updateData.aum_cr = toNumberOrNull(payload.aum_cr);
  if (payload.expense_ratio !== undefined) updateData.expense_ratio = toNumberOrNull(payload.expense_ratio);
  if (payload.launch_date !== undefined) updateData.launch_date = toDateOrNull(payload.launch_date);
  if (payload.benchmark_index_name !== undefined) {
    updateData.benchmark_index_name = String(payload.benchmark_index_name || "").trim();
  }
  if (payload.benchmark_returns_trailing) {
    updateData.benchmark_returns_trailing = {
      d1: toNumberOrNull(payload.benchmark_returns_trailing.d1) ?? 0,
      m1: toNumberOrNull(payload.benchmark_returns_trailing.m1) ?? 0,
      m3: toNumberOrNull(payload.benchmark_returns_trailing.m3) ?? 0,
      m6: toNumberOrNull(payload.benchmark_returns_trailing.m6) ?? 0,
      y1: toNumberOrNull(payload.benchmark_returns_trailing.y1),
      y3: toNumberOrNull(payload.benchmark_returns_trailing.y3),
      y5: toNumberOrNull(payload.benchmark_returns_trailing.y5),
      y10: toNumberOrNull(payload.benchmark_returns_trailing.y10),
    };
  }
  if (payload.benchmark_returns_annual) {
    updateData.benchmark_returns_annual = {
      y1: toNumberOrNull(payload.benchmark_returns_annual.y1),
      y3: toNumberOrNull(payload.benchmark_returns_annual.y3),
      y5: toNumberOrNull(payload.benchmark_returns_annual.y5),
      y10: toNumberOrNull(payload.benchmark_returns_annual.y10),
    };
  }
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
    updateData.top_holdings = Array.isArray(payload.top_holdings)
      ? payload.top_holdings
      : String(payload.top_holdings)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
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
