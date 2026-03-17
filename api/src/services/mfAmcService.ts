import MFAmc, { IMFAmc } from "../models/mfAmcModel";
import { buildSort, parsePagination } from "./mfUtils";

export const getAmcs = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false };

  if (query?.is_active !== undefined) filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  if (query?.search) {
    const s = String(query.search).trim();
    filter.name = { $regex: s, $options: "i" };
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, { name: 1 });
  const [data, total] = await Promise.all([
    MFAmc.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    MFAmc.countDocuments(filter),
  ]);

  return { success: true, data, total, currentPage: page, totalPages: Math.ceil(total / limit), limit };
};

export const getAmcById = async (id: string) => {
  const doc = await MFAmc.findOne({ _id: id, is_deleted: false });
  if (!doc) throw new Error("AMC not found");
  return doc;
};

export const createAmc = async (payload: Partial<IMFAmc>) => {
  if (!payload.name) throw new Error("name is required");
  const exists = await MFAmc.findOne({ name: payload.name, is_deleted: false });
  if (exists) throw new Error("AMC already exists");

  const doc = new MFAmc({
    ...payload,
    is_active: payload.is_active ?? 1,
    is_deleted: false,
  });
  await doc.save();
  return doc;
};

export const updateAmc = async (id: string, payload: Partial<IMFAmc>) => {
  const updateData: any = { ...payload };
  ["_id", "created_at", "updated_at", "deleted_at", "is_deleted"].forEach((k) => delete updateData[k]);
  const doc = await MFAmc.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!doc) throw new Error("AMC not found");
  return doc;
};

export const toggleAmcStatus = async (id: string) => {
  const doc = await MFAmc.findById(id);
  if (!doc || doc.is_deleted) throw new Error("AMC not found");
  doc.is_active = doc.is_active === 1 ? 0 : 1;
  await doc.save();
  return doc;
};

export const deleteAmc = async (id: string) => {
  const doc = await MFAmc.findById(id);
  if (!doc) throw new Error("AMC not found");
  doc.is_deleted = true;
  doc.is_active = 0;
  doc.deleted_at = new Date();
  await doc.save();
  return doc;
};
