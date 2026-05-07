import MFBenchmark, { IMFBenchmark } from "../models/mfBenchmarkModel";
import MFBenchmarkReturn from "../models/mfBenchmarkReturnModel";
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
  const date = toDateOrNull(payload.date);
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

export const getBenchmarkReturns = async (benchmarkId: string) => {
  const data = await MFBenchmarkReturn.find({
    benchmark_id: benchmarkId,
    is_deleted: false,
  })
    .sort({ date: -1 })
    .lean();
  return data;
};
