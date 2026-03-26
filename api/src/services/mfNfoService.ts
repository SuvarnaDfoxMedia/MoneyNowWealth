import MFNfo, { IMFNfo } from "../models/mfNfoModel";
import MFAmc from "../models/mfAmcModel";
import MFCategory from "../models/mfCategoryModel";
import { buildSort, parsePagination, toBoolean, toDateOrNull, toNumberOrNull } from "./mfUtils";

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
  throw new Error("category_id (mongo) is required");
};

export const getNfos = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false };
  const now = new Date();

  if (query?.is_active !== undefined) filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  if (query?.isOpen !== undefined) {
    filter.is_open = toBoolean(query.isOpen);
    if (filter.is_open) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { subscription_end_date: null },
            { subscription_end_date: { $gte: now } },
          ],
        },
      ];
    }
  }

  if (query?.categoryId) {
    if (/^[a-f\d]{24}$/i.test(String(query.categoryId))) filter.category_id = query.categoryId;
  }

  if (query?.amcId) {
    if (/^[a-f\d]{24}$/i.test(String(query.amcId))) filter.amc_id = query.amcId;
  }

  if (query?.search) {
    const s = String(query.search).trim();
    filter.$or = [
      { fund_name: { $regex: s, $options: "i" } },
      { benchmark: { $regex: s, $options: "i" } },
    ];
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, { subscription_end_date: 1, created_at: -1 });
  const [data, total] = await Promise.all([
    MFNfo.find(filter)
      .populate("amc_id", "name")
      .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MFNfo.countDocuments(filter),
  ]);

  return { success: true, data, total, currentPage: page, totalPages: Math.ceil(total / limit), limit };
};

export const getNfoById = async (id: string) => {
  const doc = await MFNfo.findOne({ _id: id, is_deleted: false })
    .populate("amc_id", "name")
    .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } });
  if (!doc) throw new Error("NFO not found");
  return doc;
};

export const createNfo = async (payload: Partial<IMFNfo> & any) => {
  if (!payload.fund_name) throw new Error("fund_name is required");

  const amcId = await resolveAmcId(payload);
  const categoryId = await resolveCategoryId(payload);

  const startDate = toDateOrNull(payload.subscription_start_date);
  const endDate = toDateOrNull(payload.subscription_end_date);
  const exists = await MFNfo.findOne({
    fund_name: String(payload.fund_name).trim(),
    amc_id: amcId,
    category_id: categoryId,
    subscription_start_date: startDate || null,
    subscription_end_date: endDate || null,
    is_deleted: false,
  }).select("_id");
  if (exists) throw new Error("NFO already exists");

  const doc = new MFNfo({
    ...payload,
    amc_id: amcId,
    category_id: categoryId,
    subscription_start_date: startDate,
    subscription_end_date: endDate,
    min_investment: toNumberOrNull(payload.min_investment),
    is_open: toBoolean(payload.is_open, true),
    is_active: payload.is_active ?? 1,
    is_deleted: false,
  });

  if (doc.subscription_start_date && doc.subscription_end_date && doc.subscription_end_date < doc.subscription_start_date) {
    throw new Error("subscription_end_date must be greater than or equal to subscription_start_date");
  }

  await doc.save();
  return doc;
};

export const updateNfo = async (id: string, payload: Partial<IMFNfo> & any) => {
  const updateData: any = { ...payload };
  ["_id", "created_at", "updated_at", "deleted_at", "is_deleted"].forEach((k) => delete updateData[k]);

  if (payload.amc_name || payload.amc_id) updateData.amc_id = await resolveAmcId(payload);
  if (payload.category_id) updateData.category_id = await resolveCategoryId(payload);

  if (payload.subscription_start_date !== undefined) updateData.subscription_start_date = toDateOrNull(payload.subscription_start_date);
  if (payload.subscription_end_date !== undefined) updateData.subscription_end_date = toDateOrNull(payload.subscription_end_date);
  if (payload.min_investment !== undefined) updateData.min_investment = toNumberOrNull(payload.min_investment);
  if (payload.is_open !== undefined) updateData.is_open = toBoolean(payload.is_open, true);

  if (updateData.subscription_start_date && updateData.subscription_end_date && updateData.subscription_end_date < updateData.subscription_start_date) {
    throw new Error("subscription_end_date must be greater than or equal to subscription_start_date");
  }

  const doc = await MFNfo.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!doc) throw new Error("NFO not found");
  return doc;
};

export const toggleNfoStatus = async (id: string) => {
  const doc = await MFNfo.findById(id);
  if (!doc || doc.is_deleted) throw new Error("NFO not found");
  doc.is_active = doc.is_active === 1 ? 0 : 1;
  await doc.save();
  return doc;
};

export const deleteNfo = async (id: string) => {
  const doc = await MFNfo.findById(id);
  if (!doc) throw new Error("NFO not found");
  doc.is_deleted = true;
  doc.is_active = 0;
  doc.deleted_at = new Date();
  await doc.save();
  return doc;
};
