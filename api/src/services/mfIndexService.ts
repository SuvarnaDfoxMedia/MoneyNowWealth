import MFIndexSnapshot, { IMFIndexSnapshot } from "../models/mfIndexSnapshotModel";
import MFCategory from "../models/mfCategoryModel";
import { Types } from "mongoose";
import { buildSort, parsePagination, toDateOrNull, toNumberOrNull } from "./mfUtils";

const normalizeObjectId = (value: unknown) => {
  const stringValue = String(value || "").trim();
  return /^[a-f\d]{24}$/i.test(stringValue) ? stringValue : undefined;
};

const resolveValidatedIndexSnapshotRelations = async (
  mainCategoryIdInput: unknown,
  categoryIdInput: unknown,
) => {
  const mainCategoryId = normalizeObjectId(mainCategoryIdInput);
  const categoryId = normalizeObjectId(categoryIdInput);

  if (!mainCategoryId || !categoryId) {
    throw new Error("main_category_id and category_id are required");
  }

  const category = await MFCategory.findOne({
    _id: categoryId,
    is_deleted: false,
  }).select("main_category_id");

  if (!category) {
    throw new Error("Category not found");
  }

  if (String(category.main_category_id) !== mainCategoryId) {
    throw new Error("category_id does not belong to main_category_id");
  }

  return {
    mainCategoryId,
    categoryId,
  };
};

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

  const dateValue = toDateOrNull(payload.last_updated_date);
  if (!dateValue) throw new Error("Invalid last_updated_date");

  const { mainCategoryId, categoryId } = await resolveValidatedIndexSnapshotRelations(
    payload.main_category_id,
    payload.category_id,
  );

  const { category_id, main_category_id, ...restPayload } = payload;
  
  const doc = new MFIndexSnapshot({
    ...restPayload,
    category_id: new Types.ObjectId(categoryId) as any,
    main_category_id: new Types.ObjectId(mainCategoryId) as any,
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

  if (payload.benchmark_index_name !== undefined) {
    doc.benchmark_index_name = String(payload.benchmark_index_name).trim();
  }

  if (payload.main_category_id !== undefined || payload.category_id !== undefined) {
    const { mainCategoryId, categoryId } = await resolveValidatedIndexSnapshotRelations(
      payload.main_category_id ?? doc.main_category_id,
      payload.category_id ?? doc.category_id,
    );
    doc.main_category_id = new Types.ObjectId(mainCategoryId) as any;
    doc.category_id = new Types.ObjectId(categoryId) as any;
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
