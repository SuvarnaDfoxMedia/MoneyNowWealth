import MFMainCategory, { IMFMainCategory } from "../models/mfMainCategoryModel";
import MFCategory, { IMFCategory } from "../models/mfCategoryModel";
import MFFund from "../models/mfFundModel";
import mongoose from "mongoose";
import {
  buildNumericObject,
  buildSort,
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

import { normalizeReturnsObject } from "../utils/returnMapper";

const normalizeCategoryReturns = (value: any) => normalizeReturnsObject(value);

export const recomputeCategoryAverageReturns = async (categoryId: string) => {
  const funds = await MFFund.find({
    category_id: categoryId,
    is_deleted: false,
    is_active: { $in: [1, true] },
  })
    .select("returns")
    .lean();

  const trailingFieldMap: Array<{
    key: "1w" | "1m" | "3m" | "6m" | "1y" | "2y" | "3y" | "5y" | "10y" | "since_launch" | "ytd";
    fallback: string;
  }> = [
    { key: "1w", fallback: "w1" },
    { key: "1m", fallback: "m1" },
    { key: "3m", fallback: "m3" },
    { key: "6m", fallback: "m6" },
    { key: "1y", fallback: "y1" },
    { key: "2y", fallback: "y2_cagr" },
    { key: "3y", fallback: "y3_cagr" },
    { key: "5y", fallback: "y5_cagr" },
    { key: "10y", fallback: "y10_cagr" },
    { key: "since_launch", fallback: "since_inception" },
    { key: "ytd", fallback: "ytd" },
  ];

  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  let ytdSum = 0;
  let ytdCount = 0;
  const annualSums: Record<string, number> = {};
  const annualCounts: Record<string, number> = {};
  const currentYear = new Date().getFullYear();

  for (const fund of funds as any[]) {
    const returns = fund?.returns || {};
    for (const field of trailingFieldMap) {
      const value = toNumberOrNull(
        returns?.trailing?.[field.key] ?? returns?.[field.fallback],
      );
      if (value === null) continue;
      sums[field.key] = (sums[field.key] || 0) + value;
      counts[field.key] = (counts[field.key] || 0) + 1;
    }

    const ytdValue = toNumberOrNull(returns?.annual?.ytd ?? returns?.ytd);
    if (ytdValue !== null) {
      ytdSum += ytdValue;
      ytdCount += 1;
    }

    const annualReturns = normalizeYearValueMap(
      returns?.annual?.yearly_returns ?? returns?.annual,
    );
    for (const [year, rawValue] of Object.entries(annualReturns)) {
      if (!/^\d{4}$/.test(year) || Number(year) >= currentYear) continue;
      const value = toNumberOrNull(rawValue);
      if (value === null) continue;
      annualSums[year] = (annualSums[year] || 0) + value;
      annualCounts[year] = (annualCounts[year] || 0) + 1;
    }
  }

  const annualYears = Object.keys(annualSums)
    .filter((year) => Number(year) >= currentYear - 9)
    .sort((left, right) => Number(right) - Number(left))
    .slice(0, 9);

  const categoryAverageReturns = {
    trailing: {
      "1w": counts["1w"] ? sums["1w"] / counts["1w"] : null,
      "1m": counts["1m"] ? sums["1m"] / counts["1m"] : null,
      "3m": counts["3m"] ? sums["3m"] / counts["3m"] : null,
      "6m": counts["6m"] ? sums["6m"] / counts["6m"] : null,
      "1y": counts["1y"] ? sums["1y"] / counts["1y"] : null,
      "2y": counts["2y"] ? sums["2y"] / counts["2y"] : null,
      "3y": counts["3y"] ? sums["3y"] / counts["3y"] : null,
      "5y": counts["5y"] ? sums["5y"] / counts["5y"] : null,
      "10y": counts["10y"] ? sums["10y"] / counts["10y"] : null,
      since_launch: counts["since_launch"]
        ? sums["since_launch"] / counts["since_launch"]
        : null,
      ytd: counts["ytd"] ? sums["ytd"] / counts["ytd"] : null,
    },
    annual: {
      ytd: ytdCount > 0 ? ytdSum / ytdCount : null,
      yearly_returns: Object.fromEntries(
        annualYears.map((year) => [
          year,
          annualCounts[year] ? annualSums[year] / annualCounts[year] : null,
        ]),
      ),
    },
  };

  await MFCategory.updateOne(
    { _id: categoryId, is_deleted: false },
    { category_average_returns: categoryAverageReturns },
  );
};

/**
 * Recomputes average returns for ALL active categories.
 * Called after a full sync batch completes.
 */
export const recomputeAllCategoryAverageReturns = async (): Promise<{ recomputed: number }> => {
  const categories = await MFCategory.find({ is_deleted: false, is_active: 1 })
    .select("_id")
    .lean();

  for (const category of categories) {
    await recomputeCategoryAverageReturns(String(category._id)).catch((err) => {
      console.error(
        `[mfCategoryService] recomputeAll failed for ${category._id}:`,
        err?.message,
      );
    });
  }

  return { recomputed: categories.length };
};

export const getMainCategories = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false };

  if (query?.is_active !== undefined) filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  if (query?.search) {
    const s = String(query.search).trim();
    filter.$or = [{ name: { $regex: s, $options: "i" } }];
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, { sort_order: 1, name: 1 }, ["name", "sort_order", "is_active", "created_at", "updated_at"]);
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

  const sort = buildSort(query?.sortBy, query?.sortOrder, { name: 1 }, ["name", "main_category_id", "is_active", "created_at", "updated_at"]);
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
  // Keep admin edit view consistent: refresh averages from active funds on read.
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    await recomputeCategoryAverageReturns(identifier);
  }
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
    category_average_returns: normalizeCategoryReturns({}),
    category_returns: normalizeCategoryReturns(payload.category_returns),
    suggested_use_case_note: payload.suggested_use_case_note || "",
    is_active: payload.is_active ?? 1,
    is_deleted: false,
  });

  await doc.save();
  await recomputeCategoryAverageReturns(String(doc._id));
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

  if (payload.category_returns) {
    updateData.category_returns = normalizeCategoryReturns(payload.category_returns);
  }

  if (payload.description || payload.short_description) {
    updateData.description = payload.description || payload.short_description || "";
  }

  if (payload.suggested_use_case_note !== undefined) {
    updateData.suggested_use_case_note = payload.suggested_use_case_note || "";
  }

  const doc = await MFCategory.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!doc) throw new Error("Category not found");
  await recomputeCategoryAverageReturns(String(doc._id));
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
