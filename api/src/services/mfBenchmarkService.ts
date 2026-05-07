import MFBenchmark, { IMFBenchmark } from "../models/mfBenchmarkModel";
import MFBenchmarkReturn from "../models/mfBenchmarkReturnModel";
import MFFund from "../models/mfFundModel";
import MFMainCategory from "../models/mfMainCategoryModel";
import MFCategory from "../models/mfCategoryModel";
import mongoose from "mongoose";
import {
  buildSort,
  MF_ANNUAL_YEARS,
  parsePagination,
  toDateOrNull,
  toNumberOrNull,
} from "./mfUtils";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactCaseInsensitive = (value: string) => ({
  $regex: `^${escapeRegex(value.trim())}$`,
  $options: "i",
});

const normalizeDateValue = (value: Date | null) => {
  if (!value) return null;
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
};

const isObjectId = (value: unknown) => /^[a-f\d]{24}$/i.test(String(value || ""));

export const getBenchmarks = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false };

  if (query?.is_active !== undefined) filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  if (query?.search) {
    const s = String(query.search).trim();
    filter.name = { $regex: s, $options: "i" };
  }
  if (query?.category) {
    filter.category = { $regex: String(query.category).trim(), $options: "i" };
  }
  if (query?.type) {
    filter.type = { $regex: String(query.type).trim(), $options: "i" };
  }
  if (query?.main_category_id) {
    filter.main_category_id = query.main_category_id;
  }
  if (query?.category_id) {
    filter.category_id = query.category_id;
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, { name: 1 });
  const [data, total] = await Promise.all([
    MFBenchmark.find(filter)
      .populate("main_category_id", "name")
      .populate("category_id", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MFBenchmark.countDocuments(filter),
  ]);

  return { success: true, data, total, currentPage: page, totalPages: Math.ceil(total / limit), limit };
};

export const getBenchmarkById = async (id: string) => {
  const doc = await MFBenchmark.findOne({ _id: id, is_deleted: false })
    .populate("main_category_id", "name")
    .populate("category_id", "name");
  if (!doc) throw new Error("Benchmark not found");
  return doc;
};

export const createBenchmark = async (payload: Partial<IMFBenchmark> & any) => {
  if (!payload.name) throw new Error("name is required");
  const name = String(payload.name).trim();
  const type = String(payload.type || "index").trim();

  const exists = await MFBenchmark.findOne({
    is_deleted: false,
    name: exactCaseInsensitive(name),
    type: exactCaseInsensitive(type),
  }).select("_id");
  if (exists) throw new Error("Benchmark already exists");

  const doc = new MFBenchmark({
    name,
    type,
    category: String(payload.category || "").trim(),
    main_category_id: payload.main_category_id || null,
    category_id: payload.category_id || null,
    is_active: payload.is_active ?? 1,
    is_deleted: false,
  });
  await doc.save();
  return doc;
};

export const updateBenchmark = async (id: string, payload: Partial<IMFBenchmark> & any) => {
  const updateData: any = { ...payload };
  ["_id", "created_at", "updated_at", "deleted_at", "is_deleted"].forEach((k) => delete updateData[k]);

  if (payload.name !== undefined) updateData.name = String(payload.name || "").trim();
  if (payload.category !== undefined) updateData.category = String(payload.category || "").trim();
  if (payload.type !== undefined) updateData.type = String(payload.type || "").trim();
  if (payload.main_category_id !== undefined) updateData.main_category_id = payload.main_category_id || null;
  if (payload.category_id !== undefined) updateData.category_id = payload.category_id || null;

  if (updateData.name || updateData.type) {
    const current = await MFBenchmark.findOne({ _id: id, is_deleted: false }).select("name type");
    if (!current) throw new Error("Benchmark not found");
    const name = updateData.name ?? current.name;
    const type = updateData.type ?? current.type;
    const exists = await MFBenchmark.findOne({
      _id: { $ne: id },
      is_deleted: false,
      name: exactCaseInsensitive(name),
      type: exactCaseInsensitive(type),
    }).select("_id");
    if (exists) throw new Error("Benchmark already exists");
  }

  const doc = await MFBenchmark.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!doc) throw new Error("Benchmark not found");
  return doc;
};

export const deleteBenchmark = async (id: string) => {
  const doc = await MFBenchmark.findById(id);
  if (!doc || doc.is_deleted) throw new Error("Benchmark not found");
  doc.is_deleted = true;
  doc.is_active = 0;
  doc.deleted_at = new Date();
  await doc.save();
  await MFBenchmarkReturn.updateMany(
    { benchmark_id: doc._id, is_deleted: false },
    { $set: { is_deleted: true, deleted_at: new Date() } },
  );
  return doc;
};

export const createBenchmarkReturn = async (payload: any) => {
  if (!payload.benchmark_id) throw new Error("benchmark_id is required");
  const date = normalizeDateValue(toDateOrNull(payload.date));
  if (!date) throw new Error("date is required");

  const benchmark = await MFBenchmark.findOne({ _id: payload.benchmark_id, is_deleted: false }).select("_id");
  if (!benchmark) throw new Error("Benchmark not found");

  const annual = Object.fromEntries(
    MF_ANNUAL_YEARS.map((year) => [year, toNumberOrNull(payload?.annual?.[year])]),
  );

  const doc = await MFBenchmarkReturn.findOneAndUpdate(
    { benchmark_id: payload.benchmark_id, date, is_deleted: false },
    {
      $set: {
        return_1y: toNumberOrNull(payload.return_1y),
        return_3y: toNumberOrNull(payload.return_3y),
        return_5y: toNumberOrNull(payload.return_5y),
        return_1d: toNumberOrNull(payload.return_1d),
        return_1w: toNumberOrNull(payload.return_1w),
        return_1m: toNumberOrNull(payload.return_1m),
        return_3m: toNumberOrNull(payload.return_3m),
        return_6m: toNumberOrNull(payload.return_6m),
        return_ytd: toNumberOrNull(payload.return_ytd),
        return_10y: toNumberOrNull(payload.return_10y),
        annual,
        return_since_inception: toNumberOrNull(payload.return_since_inception),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc;
};

export const getBenchmarkReturns = async (benchmarkId: string, query: any = {}) => {
  const returnRows = await MFBenchmarkReturn.find({
    benchmark_id: benchmarkId,
    is_deleted: false,
  })
    .sort({ date: -1 })
    .lean();

  const includeMeta =
    String(query?.includeMeta || "").trim() === "1" ||
    String(query?.includeMeta || "").trim().toLowerCase() === "true";

  if (!includeMeta) return returnRows;

  const fundFilter: any = {
    benchmark_id: benchmarkId,
    is_deleted: false,
  };

  if (query?.categoryId && /^[a-f\d]{24}$/i.test(String(query.categoryId))) {
    fundFilter.category_id = query.categoryId;
  }
  if (query?.fundId && /^[a-f\d]{24}$/i.test(String(query.fundId))) {
    fundFilter._id = query.fundId;
  }

  const funds = await MFFund.find(fundFilter)
    .select("_id fund_name category_id")
    .populate("category_id", "name")
    .sort({ fund_name: 1 })
    .lean();

  const categoriesMap = new Map<string, { _id: string; name: string }>();
  const fundOptions = funds.map((fund: any) => {
    const categoryId = String(fund?.category_id?._id || fund?.category_id || "");
    const categoryName = String(fund?.category_id?.name || "").trim();
    if (categoryId && categoryName) {
      categoriesMap.set(categoryId, { _id: categoryId, name: categoryName });
    }
    return {
      _id: String(fund._id),
      fund_name: fund.fund_name || "",
      category_id: categoryId || null,
      category_name: categoryName || "",
    };
  });

  const categories = [...categoriesMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const selectedFund =
    query?.fundId && /^[a-f\d]{24}$/i.test(String(query.fundId))
      ? fundOptions.find((item) => item._id === String(query.fundId)) || null
      : null;

  const selectedCategory =
    query?.categoryId && /^[a-f\d]{24}$/i.test(String(query.categoryId))
      ? categories.find((item) => item._id === String(query.categoryId)) || null
      : null;

  const rows = returnRows.map((row: any) => ({
    ...row,
    fund_name: selectedFund?.fund_name || (selectedCategory ? "All Funds" : "All Funds"),
    category_name:
      selectedFund?.category_name || selectedCategory?.name || "All Categories",
  }));

  return {
    rows,
    categories,
    funds: fundOptions,
  };
};

export const getBenchmarkReturnsList = async (query: any = {}) => {
  const selectedMainCategoryId = isObjectId(query?.mainCategoryId)
    ? String(query.mainCategoryId)
    : "";
  const selectedCategoryId = isObjectId(query?.categoryId)
    ? String(query.categoryId)
    : "";
  const selectedFundId = isObjectId(query?.fundId) ? String(query.fundId) : "";
  const selectedBenchmarkId = isObjectId(query?.benchmarkId)
    ? String(query.benchmarkId)
    : "";

  const [mainCategories, categories] = await Promise.all([
    MFMainCategory.find({ is_deleted: false })
      .select("_id name")
      .sort({ sort_order: 1, name: 1 })
      .lean(),
    MFCategory.find({ is_deleted: false })
      .select("_id name main_category_id")
      .sort({ name: 1 })
      .lean(),
  ]);

  const categoryMainMap = new Map<string, string>();
  const mainCategoryOptions = mainCategories.map((item: any) => ({
    _id: String(item._id),
    name: item.name || "",
  }));
  categories.forEach((item: any) => {
    categoryMainMap.set(String(item._id), String(item.main_category_id || ""));
  });

  let filteredCategories = categories as any[];
  if (selectedMainCategoryId) {
    filteredCategories = filteredCategories.filter(
      (item: any) => String(item.main_category_id || "") === selectedMainCategoryId,
    );
  }

  const categoryOptions = filteredCategories.map((item: any) => ({
    _id: String(item._id),
    name: item.name || "",
    main_category_id: String(item.main_category_id || ""),
  }));

  const fundFilter: any = { is_deleted: false };
  if (selectedCategoryId) {
    fundFilter.category_id = selectedCategoryId;
  }
  if (selectedFundId) {
    fundFilter._id = selectedFundId;
  }

  const allCandidateFunds = await MFFund.find(fundFilter)
    .select("_id fund_name category_id benchmark_id")
    .populate("category_id", "name main_category_id")
    .sort({ fund_name: 1 })
    .lean();

  const funds = selectedMainCategoryId
    ? allCandidateFunds.filter(
        (item: any) =>
          String(item?.category_id?.main_category_id || "") === selectedMainCategoryId,
      )
    : allCandidateFunds;

  const fundOptions = funds.map((item: any) => {
    const categoryId = String(item?.category_id?._id || item?.category_id || "");
    const mainCategoryId = String(
      item?.category_id?.main_category_id ||
        categoryMainMap.get(categoryId) ||
        "",
    );
    return {
      _id: String(item._id),
      fund_name: item.fund_name || "",
      category_id: categoryId || null,
      category_name: String(item?.category_id?.name || ""),
      main_category_id: mainCategoryId || null,
      benchmark_id: String(item?.benchmark_id || ""),
    };
  });

  const benchmarkFilter: any = { is_deleted: false };
  if (selectedBenchmarkId) {
    benchmarkFilter._id = new mongoose.Types.ObjectId(selectedBenchmarkId);
  } else if (selectedFundId) {
    const selectedFund = fundOptions.find((item) => item._id === selectedFundId);
    if (selectedFund?.benchmark_id) {
      benchmarkFilter._id = new mongoose.Types.ObjectId(selectedFund.benchmark_id);
    }
  } else if (selectedCategoryId) {
    benchmarkFilter.category_id = new mongoose.Types.ObjectId(selectedCategoryId);
  } else if (selectedMainCategoryId) {
    benchmarkFilter.main_category_id = new mongoose.Types.ObjectId(selectedMainCategoryId);
  }

  let benchmarks = await MFBenchmark.find(benchmarkFilter)
    .select("_id name category category_id main_category_id type")
    .populate("category_id", "name")
    .populate("main_category_id", "name")
    .sort({ name: 1 })
    .lean();

  if (!selectedBenchmarkId) {
    const fundBenchmarkIds = [
      ...new Set(
        fundOptions
          .map((item) => String(item.benchmark_id || "").trim())
          .filter(Boolean),
      ),
    ];
    if (fundBenchmarkIds.length > 0) {
      const mappedBenchmarks = await MFBenchmark.find({
        _id: { $in: fundBenchmarkIds.map((id) => new mongoose.Types.ObjectId(id)) },
        is_deleted: false,
      })
        .select("_id name category category_id main_category_id type")
        .populate("category_id", "name")
        .populate("main_category_id", "name")
        .sort({ name: 1 })
        .lean();
      const merged = new Map<string, any>();
      [...benchmarks, ...mappedBenchmarks].forEach((item: any) => {
        merged.set(String(item._id), item);
      });
      benchmarks = [...merged.values()];
    }
  }

  const benchmarkOptions = benchmarks.map((item: any) => ({
    _id: String(item._id),
    name: item.name || "",
    category: item?.category_id?.name || item.category || "",
    category_id: String(item?.category_id?._id || item?.category_id || ""),
    main_category_id: String(
      item?.main_category_id?._id || item?.main_category_id || "",
    ),
    type: item.type || "",
  }));

  const returnsFilter: any = { is_deleted: false };
  if (selectedBenchmarkId) {
    returnsFilter.benchmark_id = new mongoose.Types.ObjectId(selectedBenchmarkId);
  } else if (benchmarkOptions.length > 0) {
    returnsFilter.benchmark_id = {
      $in: benchmarkOptions.map((item) => new mongoose.Types.ObjectId(item._id)),
    };
  }

  const returnRows = await MFBenchmarkReturn.find(returnsFilter)
    .populate("benchmark_id", "name category category_id")
    .sort({ date: -1, updated_at: -1 })
    .limit(5000)
    .lean();

  const selectedCategory =
    selectedCategoryId
      ? categoryOptions.find((item) => item._id === selectedCategoryId)
      : null;

  const benchmarkFundsMap = new Map<string, typeof fundOptions>();
  fundOptions.forEach((fund) => {
    const benchmarkId = String(fund.benchmark_id || "");
    if (!benchmarkId) return;
    const list = benchmarkFundsMap.get(benchmarkId) || [];
    list.push(fund);
    benchmarkFundsMap.set(benchmarkId, list);
  });

  const rows = returnRows.flatMap((row: any) => {
    const benchmarkDoc = row?.benchmark_id || {};
    const benchmarkId = String(benchmarkDoc?._id || row?.benchmark_id || "");
    const mappedFunds = benchmarkFundsMap.get(benchmarkId) || [];

    if (mappedFunds.length === 0) {
      return [
        {
          ...row,
          benchmark_name: String(benchmarkDoc?.name || ""),
          category_name:
            selectedCategory?.name ||
            String(benchmarkDoc?.category_id?.name || benchmarkDoc?.category || "") ||
            "-",
          fund_name: "-",
        },
      ];
    }

    return mappedFunds.map((fund) => ({
      ...row,
      _id: `${String(row._id)}::${fund._id}`,
      benchmark_name: String(benchmarkDoc?.name || ""),
      category_name:
        fund.category_name ||
        selectedCategory?.name ||
        String(benchmarkDoc?.category_id?.name || benchmarkDoc?.category || "") ||
        "-",
      fund_name: fund.fund_name || "-",
    }));
  });

  return {
    rows,
    mainCategories: mainCategoryOptions,
    categories: categoryOptions,
    funds: fundOptions,
    benchmarks: benchmarkOptions,
  };
};

const parseHierarchy = (query: any = {}) => ({
  mainCategoryId: isObjectId(query?.main_category_id || query?.mainCategoryId)
    ? String(query.main_category_id || query.mainCategoryId)
    : "",
  categoryId: isObjectId(query?.category_id || query?.categoryId)
    ? String(query.category_id || query.categoryId)
    : "",
  fundId: isObjectId(query?.fund_id || query?.fundId)
    ? String(query.fund_id || query.fundId)
    : "",
  benchmarkId: isObjectId(query?.benchmark_id || query?.benchmarkId)
    ? String(query.benchmark_id || query.benchmarkId)
    : "",
});

const getMappedFundsForHierarchy = async (query: any = {}) => {
  const { mainCategoryId, categoryId, fundId } = parseHierarchy(query);

  const categoryFilter: any = { is_deleted: false };
  if (mainCategoryId) categoryFilter.main_category_id = new mongoose.Types.ObjectId(mainCategoryId);
  if (categoryId) categoryFilter._id = new mongoose.Types.ObjectId(categoryId);
  const categories = await MFCategory.find(categoryFilter)
    .select("_id name main_category_id")
    .sort({ name: 1 })
    .lean();

  const categoryIds = categories.map((item: any) => item._id);
  const fundFilter: any = { is_deleted: false, benchmark_id: { $ne: null } };
  if (fundId) {
    fundFilter._id = new mongoose.Types.ObjectId(fundId);
  } else if (categoryId) {
    fundFilter.category_id = new mongoose.Types.ObjectId(categoryId);
  } else if (mainCategoryId) {
    if (categoryIds.length === 0) return { categories, funds: [] as any[] };
    fundFilter.category_id = { $in: categoryIds };
  }

  const funds = await MFFund.find(fundFilter)
    .select("_id fund_name category_id benchmark_id")
    .populate("category_id", "name main_category_id")
    .sort({ fund_name: 1 })
    .lean();

  return { categories, funds };
};

export const getBenchmarkFilters = async (query: any = {}) => {
  const { mainCategoryId, categoryId, fundId } = parseHierarchy(query);
  const [allMainCategories, mapped] = await Promise.all([
    MFMainCategory.find({ is_deleted: false })
      .select("_id name")
      .sort({ sort_order: 1, name: 1 })
      .lean(),
    getMappedFundsForHierarchy(query),
  ]);

  const categories = mapped.categories as any[];
  const funds = mapped.funds as any[];

  const benchmarkIds = [
    ...new Set(
      funds.map((item: any) => String(item.benchmark_id || "")).filter(Boolean),
    ),
  ];

  if (fundId && funds.length === 0) {
    return {
      mainCategories: allMainCategories.map((item: any) => ({ _id: String(item._id), name: item.name || "" })),
      categories: [],
      funds: [],
      benchmarks: [],
    };
  }

  const benchmarkIdsWithReturns = benchmarkIds.length
    ? await MFBenchmarkReturn.distinct("benchmark_id", {
        benchmark_id: { $in: benchmarkIds.map((id) => new mongoose.Types.ObjectId(id)) },
        is_deleted: false,
      })
    : [];

  const benchmarks = benchmarkIdsWithReturns.length
    ? await MFBenchmark.find({
        _id: { $in: benchmarkIdsWithReturns },
        is_deleted: false,
      })
        .select("_id name category category_id main_category_id type")
        .populate("category_id", "name")
        .populate("main_category_id", "name")
        .sort({ name: 1 })
        .lean()
    : [];

  const mainCategories = allMainCategories.map((item: any) => ({
    _id: String(item._id),
    name: item.name || "",
  }));

  const categoryOptions = categories
    .filter((item: any) => {
      if (mainCategoryId && String(item.main_category_id || "") !== mainCategoryId) return false;
      if (categoryId && String(item._id) !== categoryId) return false;
      return true;
    })
    .map((item: any) => ({
      _id: String(item._id),
      name: item.name || "",
      main_category_id: String(item.main_category_id || ""),
    }));

  const fundOptions = funds
    .filter((item: any) => {
      if (categoryId && String(item?.category_id?._id || item?.category_id || "") !== categoryId) return false;
      return true;
    })
    .map((item: any) => ({
      _id: String(item._id),
      fund_name: item.fund_name || "",
      category_id: String(item?.category_id?._id || item?.category_id || ""),
      category_name: String(item?.category_id?.name || ""),
      main_category_id: String(item?.category_id?.main_category_id || ""),
      benchmark_id: String(item?.benchmark_id || ""),
    }));

  const benchmarkOptions = benchmarks.map((item: any) => ({
    _id: String(item._id),
    name: item.name || "",
    category: item?.category_id?.name || item.category || "",
    category_id: String(item?.category_id?._id || item?.category_id || ""),
    main_category_id: String(item?.main_category_id?._id || item?.main_category_id || ""),
    type: item.type || "",
  }));

  return {
    mainCategories,
    categories: categoryOptions,
    funds: fundOptions,
    benchmarks: benchmarkOptions,
  };
};

export const getBenchmarkReturnsByFilters = async (query: any = {}) => {
  const { benchmarkId, fundId, categoryId, mainCategoryId } = parseHierarchy(query);
  const mapped = await getMappedFundsForHierarchy(query);
  const funds = mapped.funds as any[];

  let eligibleBenchmarkIds = [
    ...new Set(funds.map((item: any) => String(item.benchmark_id || "")).filter(Boolean)),
  ];

  if (benchmarkId) {
    eligibleBenchmarkIds = eligibleBenchmarkIds.filter((id) => id === benchmarkId);
  }

  if (mainCategoryId || categoryId || fundId || benchmarkId) {
    if (eligibleBenchmarkIds.length === 0) return [];
  }

  const returnsFilter: any = { is_deleted: false };
  if (eligibleBenchmarkIds.length > 0) {
    returnsFilter.benchmark_id = {
      $in: eligibleBenchmarkIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  const returnRows = await MFBenchmarkReturn.find(returnsFilter)
    .populate("benchmark_id", "name category category_id")
    .sort({ date: -1, updated_at: -1 })
    .limit(5000)
    .lean();

  const benchmarkFundsMap = new Map<string, any[]>();
  funds.forEach((fund: any) => {
    const bId = String(fund.benchmark_id || "");
    if (!bId) return;
    const list = benchmarkFundsMap.get(bId) || [];
    list.push({
      fund_name: fund.fund_name || "-",
      category_name: String(fund?.category_id?.name || "-"),
      fund_id: String(fund._id),
    });
    benchmarkFundsMap.set(bId, list);
  });

  return returnRows.flatMap((row: any) => {
    const benchmarkDoc = row?.benchmark_id || {};
    const bId = String(benchmarkDoc?._id || row?.benchmark_id || "");
    const mappedFunds = benchmarkFundsMap.get(bId) || [];

    if (mappedFunds.length === 0) {
      if (mainCategoryId || categoryId || fundId || benchmarkId) return [];
      return [{
        ...row,
        benchmark_name: String(benchmarkDoc?.name || ""),
        fund_name: "-",
        category_name: String(benchmarkDoc?.category_id?.name || benchmarkDoc?.category || "-"),
      }];
    }

    return mappedFunds.map((fundItem) => ({
      ...row,
      _id: `${String(row._id)}::${fundItem.fund_id}`,
      benchmark_name: String(benchmarkDoc?.name || ""),
      fund_name: fundItem.fund_name,
      category_name: fundItem.category_name,
    }));
  });
};
