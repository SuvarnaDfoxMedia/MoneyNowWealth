import MFMainCategory, { IMFMainCategory } from "../models/mfMainCategoryModel";
import MFCategory, { IMFCategory } from "../models/mfCategoryModel";
import MFFund from "../models/mfFundModel";
import {
  buildNumericObject,
  buildSort,
  CATEGORY_TRAILING_KEYS,
  FUND_RETURN_KEYS,
  mapToPlainObject,
  normalizeYearValueMap,
  parsePagination,
  toNumberOrNull,
} from "./mfUtils";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactCaseInsensitive = (value: string) => ({
  $regex: `^${escapeRegex(value.trim())}$`,
  $options: "i",
});

const normalizeCategoryReturns = (value: any) => ({
  trailing: {
    "1w": toNumberOrNull(value?.trailing?.["1w"] ?? value?.w1),
    "1m": toNumberOrNull(value?.trailing?.["1m"] ?? value?.m1),
    "3m": toNumberOrNull(value?.trailing?.["3m"] ?? value?.m3),
    "6m": toNumberOrNull(value?.trailing?.["6m"] ?? value?.m6),
    "1y": toNumberOrNull(value?.trailing?.["1y"] ?? value?.y1),
    "3y": toNumberOrNull(value?.trailing?.["3y"] ?? value?.y3),
    "5y": toNumberOrNull(value?.trailing?.["5y"] ?? value?.y5),
    "10y": toNumberOrNull(value?.trailing?.["10y"] ?? value?.y10),
    since_launch: toNumberOrNull(
      value?.trailing?.since_launch ?? value?.since_launch ?? value?.since_inception,
    ),
  },
  annual: {
    ytd: toNumberOrNull(value?.annual?.ytd ?? value?.ytd),
    yearly_returns: normalizeYearValueMap(value?.annual?.yearly_returns ?? value?.annual),
  },
});

const fundReturnToCategoryKey: Record<string, string> = {
  w1: "w1",
  m1: "m1",
  m3: "m3",
  m6: "m6",
  y1: "y1",
  y3_cagr: "y3",
  y5_cagr: "y5",
  y10_cagr: "y10",
  ytd: "ytd",
};

export const recomputeCategoryAverageReturns = async (categoryId: string) => {
  const funds = await MFFund.find({
    category_id: categoryId,
    is_deleted: false,
    is_active: 1,
  })
    .select("returns")
    .lean();

  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  const annualSums: Record<string, number> = {};
  const annualCounts: Record<string, number> = {};

  for (const fund of funds as any[]) {
    const returns = fund?.returns || {};
    for (const fundKey of FUND_RETURN_KEYS) {
      const categoryKey = fundReturnToCategoryKey[fundKey];
      if (!categoryKey) continue;
      const value = toNumberOrNull(returns[fundKey]);
      if (value === null) continue;
      sums[categoryKey] = (sums[categoryKey] || 0) + value;
      counts[categoryKey] = (counts[categoryKey] || 0) + 1;
    }

    const annualReturns = normalizeYearValueMap(returns.annual);
    for (const [year, rawValue] of Object.entries(annualReturns)) {
      const value = toNumberOrNull(rawValue);
      if (value === null) continue;
      annualSums[year] = (annualSums[year] || 0) + value;
      annualCounts[year] = (annualCounts[year] || 0) + 1;
    }
  }

  const categoryAverageReturns = {
    ...Object.fromEntries(
      CATEGORY_TRAILING_KEYS.map((key) => [
        key,
        counts[key] ? sums[key] / counts[key] : null,
      ]),
    ),
    annual: Object.fromEntries(
      Object.keys(annualSums)
        .sort((left, right) => Number(right) - Number(left))
        .map((year) => [year, annualCounts[year] ? annualSums[year] / annualCounts[year] : null]),
    ),
  };

  await MFCategory.updateOne(
    { _id: categoryId, is_deleted: false },
    { category_average_returns: categoryAverageReturns },
  );
};

export const getMainCategories = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false };

  if (query?.is_active !== undefined) filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  if (query?.search) {
    const s = String(query.search).trim();
    filter.$or = [{ name: { $regex: s, $options: "i" } }];
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, { sort_order: 1, name: 1 });
  const [data, total] = await Promise.all([
    MFMainCategory.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    MFMainCategory.countDocuments(filter),
  ]);

  return { success: true, data, total, currentPage: page, totalPages: Math.ceil(total / limit), limit };
};

export const getMainCategoryById = async (id: string) => {
  const doc = await MFMainCategory.findOne({ _id: id, is_deleted: false });
  if (!doc) throw new Error("Main category not found");
  return doc;
};

export const createMainCategory = async (payload: Partial<IMFMainCategory>) => {
  if (!payload.name) throw new Error("name is required");
  const normalizedName = String(payload.name).trim();

  const exists = await MFMainCategory.findOne({
    name: exactCaseInsensitive(normalizedName),
    is_deleted: false,
  });
  if (exists) throw new Error("Main category already exists");

  const doc = new MFMainCategory({
    ...payload,
    name: normalizedName,
    is_active: payload.is_active ?? 1,
    is_deleted: false,
  });

  await doc.save();
  return doc;
};

export const updateMainCategory = async (id: string, payload: Partial<IMFMainCategory>) => {
  const updateData: any = { ...payload };
  delete updateData._id;
  delete updateData.created_at;
  delete updateData.updated_at;
  delete updateData.deleted_at;
  delete updateData.is_deleted;

  if (payload.name !== undefined) {
    updateData.name = String(payload.name || "").trim();
    const exists = await MFMainCategory.findOne({
      _id: { $ne: id },
      name: exactCaseInsensitive(updateData.name),
      is_deleted: false,
    }).select("_id");
    if (exists) throw new Error("Main category already exists");
  }

  const doc = await MFMainCategory.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!doc) throw new Error("Main category not found");
  return doc;
};

export const toggleMainCategoryStatus = async (id: string) => {
  const doc = await MFMainCategory.findById(id);
  if (!doc || doc.is_deleted) throw new Error("Main category not found");
  doc.is_active = doc.is_active === 1 ? 0 : 1;
  await doc.save();
  return doc;
};

export const deleteMainCategory = async (id: string) => {
  const doc = await MFMainCategory.findById(id);
  if (!doc) throw new Error("Main category not found");
  doc.is_deleted = true;
  doc.is_active = 0;
  doc.deleted_at = new Date();
  await doc.save();
  return doc;
};

export const getCategories = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false };

  if (query?.is_active !== undefined) filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  if (query?.mainCategoryId || query?.main_category_id) {
    filter.main_category_id = String(query?.mainCategoryId || query?.main_category_id);
  }

  if (query?.search) {
    const s = String(query.search).trim();
    filter.$or = [{ name: { $regex: s, $options: "i" } }];
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, { name: 1 });
  const [data, total] = await Promise.all([
    MFCategory.find(filter)
      .populate("main_category_id", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MFCategory.countDocuments(filter),
  ]);

  return { success: true, data, total, currentPage: page, totalPages: Math.ceil(total / limit), limit };
};

export const getCategoryByIdentifier = async (identifier: string) => {
  const doc = await MFCategory.findOne({ _id: identifier, is_deleted: false }).populate("main_category_id", "name");
  if (!doc) throw new Error("Category not found");
  return doc;
};

export const createCategory = async (payload: Partial<IMFCategory> & { main_category_id?: string; mainCategoryId?: string; short_description?: string }) => {
  if (!payload.name) throw new Error("name is required");

  const mainCategoryId = payload.main_category_id || payload.mainCategoryId;
  if (!mainCategoryId) throw new Error("main_category_id is required");
  const normalizedName = String(payload.name).trim();

  const exists = await MFCategory.findOne({
    name: exactCaseInsensitive(normalizedName),
    main_category_id: mainCategoryId,
    is_deleted: false,
  }).select("_id");
  if (exists) throw new Error("Category already exists");

  const doc = new MFCategory({
    ...payload,
    name: normalizedName,
    main_category_id: mainCategoryId,
    // Legacy short_description support
    description: payload.description || payload.short_description || "",
    category_average_returns: normalizeCategoryReturns(payload.category_average_returns),
    suggested_use_case_note: payload.suggested_use_case_note || "",
    is_active: payload.is_active ?? 1,
    is_deleted: false,
  });

  await doc.save();
  return doc;
};

export const updateCategory = async (id: string, payload: Partial<IMFCategory> & { main_category_id?: string; mainCategoryId?: string; short_description?: string }) => {
  const updateData: any = { ...payload };
  ["_id", "created_at", "updated_at", "deleted_at", "is_deleted"].forEach((k) => delete updateData[k]);

  const currentDoc = await MFCategory.findOne({ _id: id, is_deleted: false }).select(
    "name main_category_id",
  );
  if (!currentDoc) throw new Error("Category not found");

  if (payload.main_category_id || payload.mainCategoryId) {
    updateData.main_category_id = payload.main_category_id || payload.mainCategoryId;
  }

  if (payload.name !== undefined) {
    updateData.name = String(payload.name || "").trim();
  }

  const nextName = updateData.name ?? currentDoc.name;
  const nextMainCategoryId =
    updateData.main_category_id ?? String(currentDoc.main_category_id);
  if (nextName && nextMainCategoryId) {
    const exists = await MFCategory.findOne({
      _id: { $ne: id },
      name: exactCaseInsensitive(String(nextName)),
      main_category_id: nextMainCategoryId,
      is_deleted: false,
    }).select("_id");
    if (exists) throw new Error("Category already exists");
  }

  if (payload.category_average_returns) {
    updateData.category_average_returns = normalizeCategoryReturns(payload.category_average_returns);
  }

  if (payload.description || payload.short_description) {
    updateData.description = payload.description || payload.short_description || "";
  }

  if (payload.suggested_use_case_note !== undefined) {
    updateData.suggested_use_case_note = payload.suggested_use_case_note || "";
  }

  const doc = await MFCategory.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!doc) throw new Error("Category not found");
  return doc;
};

export const toggleCategoryStatus = async (id: string) => {
  const doc = await MFCategory.findById(id);
  if (!doc || doc.is_deleted) throw new Error("Category not found");
  doc.is_active = doc.is_active === 1 ? 0 : 1;
  await doc.save();
  return doc;
};

export const deleteCategory = async (id: string) => {
  const doc = await MFCategory.findById(id);
  if (!doc) throw new Error("Category not found");
  doc.is_deleted = true;
  doc.is_active = 0;
  doc.deleted_at = new Date();
  await doc.save();
  return doc;
};
