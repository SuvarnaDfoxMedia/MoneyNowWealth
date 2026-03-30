import MFMainCategory from "../models/mfMainCategoryModel";
import MFCategory from "../models/mfCategoryModel";
import MFFund from "../models/mfFundModel";
import MFNfo from "../models/mfNfoModel";
import MFIndexSnapshot from "../models/mfIndexSnapshotModel";
import MFAmc from "../models/mfAmcModel";
import { toNumberOrNull } from "./mfUtils";

const buildActiveFilter = () => ({ is_active: 1, is_deleted: false });
const getNfoCloseCutoff = (endDate: Date | null) => {
  if (!endDate) return null;
  const cutoff = new Date(endDate);
  cutoff.setHours(18, 0, 0, 0);
  return cutoff;
};

const computeNfoOpenState = (startDate: Date | null, endDate: Date | null) => {
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const closeCutoff = getNfoCloseCutoff(endDate);

  if (start && now < start) return false;
  if (closeCutoff && now >= closeCutoff) return false;
  return true;
};

export const getMfHomeData = async (query: any) => {
  const featuredLimit = Math.max(toNumberOrNull(query?.featuredLimit) || 8, 1);
  const nfoLimit = Math.max(toNumberOrNull(query?.nfoLimit) || 8, 1);
  const categoryLimit = Math.max(toNumberOrNull(query?.categoryLimit) || 10, 1);
  const indexLimit = Math.max(toNumberOrNull(query?.indexLimit) || 10, 1);
  const [mainCategories, featuredFunds, openNfos, topCategoriesByReturn, indexHighlights] =
    await Promise.all([
      MFMainCategory.find(buildActiveFilter())
        .select("name description sort_order")
        .sort({ sort_order: 1, name: 1 })
        .lean(),

      MFFund.find({
        ...buildActiveFilter(),
        is_featured: true,
      })
        .select(
          "fund_name plan_type option_type returns expense_ratio aum_cr riskometer_label amc_id category_id is_popular",
        )
        .sort({ "returns.y1": -1, created_at: -1 })
        .limit(featuredLimit)
        .populate("amc_id", "name")
        .populate({
          path: "category_id",
          select: "name main_category_id",
          populate: { path: "main_category_id", select: "name" },
        })
        .lean(),

      MFNfo.find({
        ...buildActiveFilter(),
        is_open: true,
      })
        .select(
          "fund_name subscription_start_date subscription_end_date min_investment benchmark risk_level amc_id category_id",
        )
        .sort({ subscription_end_date: 1, created_at: -1 })
        .limit(nfoLimit)
        .populate("amc_id", "name")
        .populate({
          path: "category_id",
          select: "name main_category_id",
          populate: { path: "main_category_id", select: "name" },
        })
        .lean()
        .then((items) =>
          items.filter((item: any) =>
            computeNfoOpenState(
              item.subscription_start_date ? new Date(item.subscription_start_date) : null,
              item.subscription_end_date ? new Date(item.subscription_end_date) : null,
            ),
          ),
        ),

      MFCategory.find(buildActiveFilter())
        .select("name benchmark_returns main_category_id risk_level")
        .sort({ "benchmark_returns.y3": -1, "benchmark_returns.y1": -1, name: 1 })
        .limit(categoryLimit)
        .populate("main_category_id", "name")
        .lean(),

      MFIndexSnapshot.find(buildActiveFilter())
        .select("benchmark_index_name main_category_id category_id returns last_updated_date")
        .sort({ last_updated_date: -1 })
        .limit(indexLimit)
        .populate({
          path: "category_id",
          select: "name main_category_id",
          populate: { path: "main_category_id", select: "name" },
        })
        .populate({ path: "main_category_id", select: "name" })
        .lean(),
    ]);

  return {
    success: true,
    data: {
      mainCategories,
      featuredFunds,
      openNfos,
      topCategoriesByReturn,
      indexHighlights,
    },
  };
};

export const getMfFiltersData = async (query: any) => {
  const filter: any = buildActiveFilter();
  if (query?.mainCategoryId) {
    filter.main_category_id = String(query.mainCategoryId);
  }

  const categories = await MFCategory.find(filter)
    .select("name main_category_id")
    .sort({ name: 1 })
    .lean();

  const categoryIds = categories.map((c) => c._id);
  const fundFilter: any = { ...buildActiveFilter() };
  if (categoryIds.length > 0) fundFilter.category_id = { $in: categoryIds };

  const [mainCategories, amcs, planTypes, optionTypes, riskLabels, stats] = await Promise.all([
    MFMainCategory.find(buildActiveFilter()).select("name").sort({ sort_order: 1, name: 1 }).lean(),
    MFAmc.find(buildActiveFilter()).select("name").sort({ name: 1 }).lean(),
    MFFund.distinct("plan_type", fundFilter),
    MFFund.distinct("option_type", fundFilter),
    MFFund.distinct("riskometer_label", fundFilter),
    MFFund.aggregate([
      { $match: fundFilter },
      {
        $group: {
          _id: null,
          minY1: { $min: "$returns.y1" },
          maxY1: { $max: "$returns.y1" },
          minY3: { $min: "$returns.y3_cagr" },
          maxY3: { $max: "$returns.y3_cagr" },
          minExpense: { $min: "$expense_ratio" },
          maxExpense: { $max: "$expense_ratio" },
          minAum: { $min: "$aum_cr" },
          maxAum: { $max: "$aum_cr" },
        },
      },
    ]),
  ]);

  const range = stats?.[0] || {};

  return {
    success: true,
    data: {
      mainCategories,
      categories,
      amcs,
      planTypes: (planTypes || []).filter((x) => typeof x === "string" && x !== ""),
      optionTypes: (optionTypes || []).filter((x) => typeof x === "string" && x !== ""),
      riskLabels: (riskLabels || []).filter((x) => typeof x === "string" && x !== ""),
      ranges: {
        y1: { min: range.minY1 ?? null, max: range.maxY1 ?? null },
        y3: { min: range.minY3 ?? null, max: range.maxY3 ?? null },
        expenseRatio: { min: range.minExpense ?? null, max: range.maxExpense ?? null },
        aumCr: { min: range.minAum ?? null, max: range.maxAum ?? null },
      },
    },
  };
};

export const getMfDiscoverData = async (query: any) => {
  const popularLimit = Math.max(toNumberOrNull(query?.popularLimit) || 8, 1);
  const topLimit = Math.max(toNumberOrNull(query?.topLimit) || 8, 1);
  const newLimit = Math.max(toNumberOrNull(query?.newLimit) || 8, 1);
  const categoryLimit = Math.max(toNumberOrNull(query?.categoryLimit) || 12, 1);

  const [popularFunds, topPerformers, newFunds, categories] = await Promise.all([
    MFFund.find({ ...buildActiveFilter(), is_popular: true })
      .select("fund_name returns expense_ratio aum_cr riskometer_label amc_id category_id")
      .sort({ "returns.y3_cagr": -1, aum_cr: -1 })
      .limit(popularLimit)
      .populate("amc_id", "name")
      .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } })
      .lean(),

    MFFund.find(buildActiveFilter())
      .select("fund_name returns expense_ratio aum_cr riskometer_label amc_id category_id")
      .sort({ "returns.y3_cagr": -1 })
      .limit(topLimit)
      .populate("amc_id", "name")
      .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } })
      .lean(),

    MFFund.find(buildActiveFilter())
      .select("fund_name returns expense_ratio aum_cr riskometer_label amc_id category_id launch_date")
      .sort({ launch_date: -1, created_at: -1 })
      .limit(newLimit)
      .populate("amc_id", "name")
      .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } })
      .lean(),

    MFCategory.find(buildActiveFilter())
      .select("name description main_category_id benchmark_index_name risk_level")
      .sort({ name: 1 })
      .limit(categoryLimit)
      .populate("main_category_id", "name")
      .lean(),
  ]);

  return {
    success: true,
    data: {
      popularFunds,
      topPerformers,
      newFunds,
      categories,
    },
  };
};
