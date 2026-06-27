import mongoose from "mongoose";
import MFFund from "../models/mfFundModel";
import { buildSort, parsePagination } from "./mfUtils";

export const getSchemes = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = { is_deleted: false };

  if (query?.search) {
    const search = String(query.search).trim();
    filter.$or = [
      { fund_name: { $regex: search, $options: "i" } },
      { scheme_code: { $regex: search, $options: "i" } },
      { isin: { $regex: search, $options: "i" } },
    ];
  }

  if (query?.status) {
    filter.is_active = String(query.status).toLowerCase() === "active" ? 1 : 0;
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, { fund_name: 1 }, ["fund_name", "scheme_code", "is_active", "created_at", "updated_at"]);
  const [data, total] = await Promise.all([
    MFFund.find(filter)
      .populate("amc_id", "name")
      .populate({ path: "category_id", select: "name main_category_id" })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MFFund.countDocuments(filter),
  ]);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

export const getSchemeById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid scheme id");
  const scheme = await MFFund.findOne({ _id: id, is_deleted: false })
    .populate("amc_id", "name")
    .populate({ path: "category_id", select: "name main_category_id" })
    .lean();
  if (!scheme) throw new Error("Scheme not found");
  return scheme;
};
