import MFIndexSnapshot, { IMFIndexSnapshot } from "../models/mfIndexSnapshotModel";
import MFCategory from "../models/mfCategoryModel";
import { Types } from "mongoose";
import { buildSort, parsePagination, toDateOrNull, toNumberOrNull } from "./mfUtils";

export const getIndexSnapshots = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false };

  if (query?.is_active !== undefined) filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  if (query?.benchmark) filter.benchmark_index_name = { $regex: String(query.benchmark).trim(), $options: "i" };
  if (query?.mainCategoryId) filter.main_category_id = String(query.mainCategoryId);

  if (query?.categoryId) {
    if (/^[a-f\d]{24}$/i.test(String(query.categoryId))) filter.category_id = query.categoryId;
  }

  if (query?.fromDate || query?.toDate) {
    filter.last_updated_date = {};
    const fromDate = toDateOrNull(query.fromDate);
    const toDate = toDateOrNull(query.toDate);
    if (fromDate) filter.last_updated_date.$gte = fromDate;
    if (toDate) filter.last_updated_date.$lte = toDate;
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, { last_updated_date: -1 });
  const [data, total] = await Promise.all([
    MFIndexSnapshot.find(filter)
      .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } })
      .populate({ path: "main_category_id", select: "name" })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MFIndexSnapshot.countDocuments(filter),
  ]);

  return { success: true, data, total, currentPage: page, totalPages: Math.ceil(total / limit), limit };
};

export const getIndexSnapshotById = async (id: string) => {
  const doc = await MFIndexSnapshot.findOne({ _id: id, is_deleted: false }).populate({
    path: "category_id",
    select: "name main_category_id",
    populate: { path: "main_category_id", select: "name" },
  });
  if (!doc) throw new Error("Index snapshot not found");
  return doc;
};

export const createIndexSnapshot = async (payload: Partial<IMFIndexSnapshot> & { category_id?: string; main_category_id?: string }) => {
  if (!payload.benchmark_index_name || !payload.last_updated_date) {
    throw new Error("benchmark_index_name and last_updated_date are required");
  }

  let categoryId = payload.category_id;
  if (categoryId && !/^[a-f\d]{24}$/i.test(String(categoryId))) categoryId = undefined;

  const dateValue = toDateOrNull(payload.last_updated_date);
  if (!dateValue) throw new Error("Invalid last_updated_date");

  let mainCategoryId: any = payload.main_category_id;
  if (mainCategoryId && !/^[a-f\d]{24}$/i.test(String(mainCategoryId))) mainCategoryId = undefined;
  if (!mainCategoryId && categoryId) {
    const category = await MFCategory.findById(categoryId).select("main_category_id");
    mainCategoryId = category?.main_category_id ? (String(category.main_category_id) as any) : undefined;
  }

  const { category_id, main_category_id, ...restPayload } = payload;
  
  const doc = new MFIndexSnapshot({
    ...restPayload,
    category_id: categoryId ? (new Types.ObjectId(String(categoryId)) as any) : null,
    main_category_id: mainCategoryId ? (new Types.ObjectId(String(mainCategoryId)) as any) : null,
    returns: {
      y1: toNumberOrNull(payload.returns?.y1),
      y3: toNumberOrNull(payload.returns?.y3),
      y5: toNumberOrNull(payload.returns?.y5),
      y10: toNumberOrNull(payload.returns?.y10),
    },
    last_updated_date: dateValue,
    is_active: payload.is_active ?? 1,
    is_deleted: false,
  });

  await doc.save();
  return doc;
};

export const updateIndexSnapshot = async (
  id: string,
  payload: Partial<IMFIndexSnapshot> & { category_id?: string; main_category_id?: string },
) => {
  const doc = await MFIndexSnapshot.findById(id);
  if (!doc || doc.is_deleted) throw new Error("Index snapshot not found");

  let categoryId: any = payload.category_id;
  if (categoryId && !/^[a-f\d]{24}$/i.test(String(categoryId))) categoryId = undefined;

  if (payload.benchmark_index_name !== undefined) {
    doc.benchmark_index_name = String(payload.benchmark_index_name).trim();
  }
  if (payload.main_category_id !== undefined) {
    doc.main_category_id = payload.main_category_id ? (new Types.ObjectId(String(payload.main_category_id)) as any) : null;
  }
  if (payload.category_id !== undefined) {
    doc.category_id = categoryId ? (new Types.ObjectId(String(categoryId)) as any) : null;
  }
  if (payload.returns) {
    doc.returns = {
      y1: toNumberOrNull(payload.returns.y1),
      y3: toNumberOrNull(payload.returns.y3),
      y5: toNumberOrNull(payload.returns.y5),
      y10: toNumberOrNull(payload.returns.y10),
    };
  }
  if (payload.last_updated_date !== undefined) {
    const dateValue = toDateOrNull(payload.last_updated_date);
    if (!dateValue) throw new Error("Invalid last_updated_date");
    doc.last_updated_date = dateValue;
  }
  if (payload.is_active !== undefined) {
    doc.is_active = Number(payload.is_active) === 1 ? 1 : 0;
  }

  await doc.save();
  return doc;
};

export const toggleIndexSnapshotStatus = async (id: string) => {
  const doc = await MFIndexSnapshot.findById(id);
  if (!doc || doc.is_deleted) throw new Error("Index snapshot not found");
  doc.is_active = doc.is_active === 1 ? 0 : 1;
  await doc.save();
  return doc;
};

export const deleteIndexSnapshot = async (id: string) => {
  const doc = await MFIndexSnapshot.findById(id);
  if (!doc) throw new Error("Index snapshot not found");
  doc.is_deleted = true;
  doc.is_active = 0;
  doc.deleted_at = new Date();
  await doc.save();
  return doc;
};
