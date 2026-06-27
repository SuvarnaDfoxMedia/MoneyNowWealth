import MFNfo, { IMFNfo } from "../models/mfNfoModel";
import MFAmc from "../models/mfAmcModel";
import MFCategory from "../models/mfCategoryModel";
import { buildSort, parsePagination, toBoolean, toDateOrNull, toNumberOrNull } from "./mfUtils";
import { computeNfoOpenState } from "../cron/mfNfoCron";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactCaseInsensitive = (value: string) => ({
  $regex: `^${escapeRegex(value.trim())}$`,
  $options: "i",
});

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

const normalizeNfoDate = (date: Date | null) => {
  if (!date) return null;
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const mapNfoWithComputedState = (item: any) => ({
  ...item,
  is_currently_open: computeNfoOpenState(
    item.subscription_start_date ? new Date(item.subscription_start_date) : null,
    item.subscription_end_date ? new Date(item.subscription_end_date) : null,
    item.is_open,
  ),
});

const shouldReturnOnlyOpenNfos = (query: any) =>
  query?.isOpen !== undefined && toBoolean(query.isOpen);

const shouldPrioritizeOpenActive = (query: any) =>
  query?.prioritizeOpenActive !== undefined && toBoolean(query.prioritizeOpenActive);

const getNfoPriorityScore = (item: any) => {
  const isActive = item.is_active === 1 ? 1 : 0;
  const isCurrentlyOpen = item.is_currently_open ? 1 : 0;
  const isManuallyOpen = item.is_open ? 1 : 0;
  return isActive * 100 + isCurrentlyOpen * 10 + isManuallyOpen;
};

const getNfoEndTime = (item: any) => {
  if (!item.subscription_end_date) return Number.POSITIVE_INFINITY;
  const parsed = new Date(item.subscription_end_date).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

const sortByPriorityOpenActive = (items: any[]) =>
  [...items].sort((a, b) => {
    const priorityDiff = getNfoPriorityScore(b) - getNfoPriorityScore(a);
    if (priorityDiff !== 0) return priorityDiff;

    const endDateDiff = getNfoEndTime(a) - getNfoEndTime(b);
    if (endDateDiff !== 0) return endDateDiff;

    return String(a.fund_name || "").localeCompare(String(b.fund_name || ""));
  });

export const getNfos = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false };

  if (query?.is_active !== undefined) filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  if (query?.isOpen !== undefined) {
    filter.is_open = toBoolean(query.isOpen);
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
      { nfo_id: { $regex: s, $options: "i" } },
      { fund_name: { $regex: s, $options: "i" } },
      { benchmark: { $regex: s, $options: "i" } },
    ];
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, { subscription_end_date: 1, created_at: -1 }, ["fund_name", "subscription_start_date", "subscription_end_date", "created_at", "updated_at"]);
  const openOnly = shouldReturnOnlyOpenNfos(query);
  const prioritizeOpenActive = shouldPrioritizeOpenActive(query);

  const baseQuery = MFNfo.find(filter)
    .populate("amc_id", "name")
    .populate({
      path: "category_id",
      select: "name main_category_id",
      populate: { path: "main_category_id", select: "name" },
    })
    .sort(prioritizeOpenActive ? { subscription_end_date: 1, created_at: -1 } : sort);

  const shouldPaginateAfterMapping = openOnly || prioritizeOpenActive;

  const [rawData, rawTotal] = shouldPaginateAfterMapping
    ? await Promise.all([
        baseQuery.lean(),
        MFNfo.countDocuments(filter),
      ])
    : await Promise.all([
        baseQuery.skip(skip).limit(limit).lean(),
        MFNfo.countDocuments(filter),
      ]);

  const mappedData = rawData.map((item: any) => mapNfoWithComputedState(item));
  const filteredOpenData = openOnly
    ? mappedData.filter((item: any) => item.is_currently_open)
    : mappedData;
  const prioritizedData = prioritizeOpenActive
    ? sortByPriorityOpenActive(filteredOpenData)
    : filteredOpenData;
  const data = shouldPaginateAfterMapping
    ? prioritizedData.slice(skip, skip + limit)
    : prioritizedData;
  const total = shouldPaginateAfterMapping ? prioritizedData.length : rawTotal;

  return { success: true, data, total, currentPage: page, totalPages: Math.ceil(total / limit), limit };
};

export const getNfoById = async (id: string) => {
  const doc = await MFNfo.findOne({ _id: id, is_deleted: false })
    .populate("amc_id", "name")
    .populate({ path: "category_id", select: "name main_category_id", populate: { path: "main_category_id", select: "name" } });
  if (!doc) throw new Error("NFO not found");
  return mapNfoWithComputedState(doc.toObject());
};

export const createNfo = async (payload: Partial<IMFNfo> & any) => {
  if (!payload.nfo_id) throw new Error("nfo_id is required");
  if (!payload.fund_name) throw new Error("fund_name is required");

  const amcId = await resolveAmcId(payload);
  const categoryId = await resolveCategoryId(payload);

  const startDate = normalizeNfoDate(
    toDateOrNull(payload.subscription_start_date),
  );
  const endDate = normalizeNfoDate(toDateOrNull(payload.subscription_end_date));
  const exists = await MFNfo.findOne({
    $or: [
      { nfo_id: exactCaseInsensitive(String(payload.nfo_id)), is_deleted: false },
      {
        fund_name: exactCaseInsensitive(String(payload.fund_name)),
        amc_id: amcId,
        category_id: categoryId,
        subscription_start_date: startDate || null,
        subscription_end_date: endDate || null,
        is_deleted: false,
      },
    ],
    is_deleted: false,
  }).select("_id");
  if (exists) throw new Error("NFO already exists");

  const doc = new MFNfo({
    ...payload,
    nfo_id: String(payload.nfo_id).trim(),
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
  const currentDoc = await MFNfo.findOne({ _id: id, is_deleted: false }).select(
    "nfo_id fund_name amc_id category_id subscription_start_date subscription_end_date",
  );
  if (!currentDoc) throw new Error("NFO not found");

  if (payload.amc_name || payload.amc_id) updateData.amc_id = await resolveAmcId(payload);
  if (payload.category_id) updateData.category_id = await resolveCategoryId(payload);
  if (payload.nfo_id !== undefined) updateData.nfo_id = String(payload.nfo_id || "").trim();

  if (payload.subscription_start_date !== undefined) {
    updateData.subscription_start_date = normalizeNfoDate(
      toDateOrNull(payload.subscription_start_date),
    );
  }
  if (payload.subscription_end_date !== undefined) {
    updateData.subscription_end_date = normalizeNfoDate(
      toDateOrNull(payload.subscription_end_date),
    );
  }
  if (payload.min_investment !== undefined) updateData.min_investment = toNumberOrNull(payload.min_investment);
  if (payload.is_open !== undefined) {
    updateData.is_open = toBoolean(payload.is_open, true);
  }

  const nextNfoId = updateData.nfo_id ?? currentDoc.nfo_id;
  const nextFundName = String(updateData.fund_name ?? currentDoc.fund_name ?? "").trim();
  const nextAmcId = updateData.amc_id ?? currentDoc.amc_id;
  const nextCategoryId = updateData.category_id ?? currentDoc.category_id;
  const nextStartDate =
    updateData.subscription_start_date !== undefined
      ? updateData.subscription_start_date
      : currentDoc.subscription_start_date;
  const nextEndDate =
    updateData.subscription_end_date !== undefined
      ? updateData.subscription_end_date
      : currentDoc.subscription_end_date;

  const exists = await MFNfo.findOne({
    _id: { $ne: id },
    is_deleted: false,
    $or: [
      { nfo_id: exactCaseInsensitive(String(nextNfoId)) },
      {
        fund_name: exactCaseInsensitive(nextFundName),
        amc_id: nextAmcId,
        category_id: nextCategoryId,
        subscription_start_date: nextStartDate || null,
        subscription_end_date: nextEndDate || null,
      },
    ],
  }).select("_id");
  if (exists) throw new Error("NFO already exists");

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
