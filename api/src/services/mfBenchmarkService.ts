import MFBenchmark, { IMFBenchmark } from "../models/mfBenchmarkModel";
import MFBenchmarkReturn from "../models/mfBenchmarkReturnModel";
import MFFund from "../models/mfFundModel";
import MFMainCategory from "../models/mfMainCategoryModel";
import MFCategory from "../models/mfCategoryModel";
import mongoose from "mongoose";
import {
  buildSort,
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

const normalizeYearlyReturns = (input: any) => {
  const source = input?.annual?.yearly_returns ?? input?.annual ?? input ?? {};
  const entries = source instanceof Map ? Array.from(source.entries()) : Object.entries(source);
  const out: Record<string, number | null> = {};
  for (const [key, raw] of entries) {
    if (!/^\d{4}$/.test(String(key))) continue;
    out[String(key)] = toNumberOrNull(raw);
  }
  return out;
};

import { normalizeReturnsObject } from "../utils/returnMapper";

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

  const sort = buildSort(query?.sortBy, query?.sortOrder, { name: 1 }, ["name", "type", "is_active", "created_at", "updated_at"]);
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
  const name = String(payload.name || payload.benchmark_index_name || "").trim();
  if (!name) throw new Error("name is required");
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

  const { trailing, annual } = normalizeReturnsObject(payload);

  const doc = await MFBenchmarkReturn.findOneAndUpdate(
    { benchmark_id: payload.benchmark_id, date, is_deleted: false },
    {
      $set: {
        trailing,
        annual,
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
    return_1w: row?.trailing?.["1w"] ?? null,
    return_1m: row?.trailing?.["1m"] ?? null,
    return_3m: row?.trailing?.["3m"] ?? null,
    return_6m: row?.trailing?.["6m"] ?? null,
    return_1y: row?.trailing?.["1y"] ?? null,
    return_3y: row?.trailing?.["3y"] ?? null,
    return_5y: row?.trailing?.["5y"] ?? null,
    return_10y: row?.trailing?.["10y"] ?? null,
    return_since_inception: row?.trailing?.since_launch ?? null,
    return_ytd: row?.annual?.ytd ?? null,
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
  const selectedBenchmarkId = isObjectId(query?.benchmarkId)
    ? String(query.benchmarkId)
    : "";
  const benchmarkFilter: any = { is_deleted: false };
  if (selectedBenchmarkId) {
    benchmarkFilter._id = new mongoose.Types.ObjectId(selectedBenchmarkId);
  }

  const benchmarks = await MFBenchmark.find(benchmarkFilter)
    .select("_id name category category_id main_category_id type")
    .populate("category_id", "name")
    .populate("main_category_id", "name")
    .sort({ name: 1 })
    .lean();

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

  const rows = returnRows.map((row: any) => {
    const benchmarkDoc = row?.benchmark_id || {};
    return {
      ...row,
      benchmark_name: String(benchmarkDoc?.name || ""),
    };
  });

  return {
    rows,
    mainCategories: [],
    categories: [],
    funds: [],
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

export const getBenchmarkFilters = async (query: any = {}) => {
  const { benchmarkId } = parseHierarchy(query);
  const benchmarkFilter: any = { is_deleted: false };
  if (benchmarkId) {
    benchmarkFilter._id = new mongoose.Types.ObjectId(benchmarkId);
  }

  const benchmarks = await MFBenchmark.find(benchmarkFilter)
    .select("_id name category category_id main_category_id type")
    .populate("category_id", "name")
    .populate("main_category_id", "name")
    .sort({ name: 1 })
    .lean();
  const benchmarkOptions = benchmarks.map((item: any) => ({
    _id: String(item._id),
    name: item.name || "",
    category: item?.category_id?.name || item.category || "",
    category_id: String(item?.category_id?._id || item?.category_id || ""),
    main_category_id: String(item?.main_category_id?._id || item?.main_category_id || ""),
    type: item.type || "",
  }));

  return { mainCategories: [], categories: [], funds: [], benchmarks: benchmarkOptions };
};

export const getBenchmarkReturnsByFilters = async (query: any = {}) => {
  const { benchmarkId } = parseHierarchy(query);
  const { page, limit, skip } = parsePagination(query);
  const returnsFilter: any = { is_deleted: false };
  if (benchmarkId) {
    returnsFilter.benchmark_id = new mongoose.Types.ObjectId(benchmarkId);
  }

  const [returnRows, total] = await Promise.all([
    MFBenchmarkReturn.find(returnsFilter)
      .populate("benchmark_id", "name category category_id")
      .sort({ date: -1, updated_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MFBenchmarkReturn.countDocuments(returnsFilter),
  ]);

  const rows = returnRows.map((row: any) => {
    const benchmarkDoc = row?.benchmark_id || {};
    return {
      ...row,
      benchmark_name: String(benchmarkDoc?.name || ""),
    };
  });

  return {
    data: rows,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};
