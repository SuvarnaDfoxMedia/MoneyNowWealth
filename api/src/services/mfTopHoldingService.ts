import crypto from "crypto";
import { Types } from "mongoose";
import MFTopHolding from "../models/mfTopHoldingModel";
import MFFund from "../models/mfFundModel";
import { buildSort, parsePagination, toDateOrNull, toNumberOrNull } from "./mfUtils";

const normalizeIdentityPart = (value: unknown) =>
  String(value || "").trim().toUpperCase();

export const buildTopHoldingSchemeIdentity = (schemeCode: unknown, sourceIsin?: unknown) => {
  const scheme = normalizeIdentityPart(schemeCode);
  const isin = normalizeIdentityPart(sourceIsin);
  if (!scheme) return "";
  return isin ? `${scheme}::${isin}` : scheme;
};

const stableForHash = (value: unknown): unknown => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(stableForHash);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableForHash(item)]),
    );
  }
  return value === undefined ? null : value;
};

export const computeTopHoldingSnapshotHash = (payload: Record<string, unknown>) => {
  const hashPayload = {
    scheme_code: normalizeIdentityPart(payload.scheme_code),
    source_isin: normalizeIdentityPart(payload.source_isin),
    portfolio_date: stableForHash(payload.portfolio_date),
    prev_portfolio_date: stableForHash(payload.prev_portfolio_date),
    stock_holdings: payload.stock_holdings ?? null,
    bond_holdings: payload.bond_holdings ?? null,
    assets_top_10_holdings_pct: payload.assets_top_10_holdings_pct ?? null,
    turnover_pct: payload.turnover_pct ?? null,
    domestic_equity_pct: payload.domestic_equity_pct ?? null,
    international_equity_pct: payload.international_equity_pct ?? null,
    debt_pct: payload.debt_pct ?? null,
    other_pct: payload.other_pct ?? null,
    gold_pct: payload.gold_pct ?? null,
    cash_pct: payload.cash_pct ?? null,
    large_cap_pct: payload.large_cap_pct ?? null,
    mid_cap_pct: payload.mid_cap_pct ?? null,
    small_cap_pct: payload.small_cap_pct ?? null,
    tax_type: payload.tax_type ?? "",
    riskometer_label: payload.riskometer_label ?? "",
    top_holdings_summary: payload.top_holdings_summary ?? [],
    holdings: payload.holdings ?? [],
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(stableForHash(hashPayload)))
    .digest("hex");
};

const normalizeHoldingsSummary = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeHoldingsRows = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => ({
      name: String(item?.name || "").trim(),
      net_assets_pct: toNumberOrNull(item?.net_assets_pct),
      market_value: toNumberOrNull(item?.market_value),
      share_amount: toNumberOrNull(item?.share_amount),
      share_change: toNumberOrNull(item?.share_change),
      security_type: String(item?.security_type || "").trim(),
      sector: String(item?.sector || "").trim(),
      maturity: String(item?.maturity || "").trim(),
      credit_quality_india: String(item?.credit_quality_india || "").trim(),
      country: String(item?.country || "").trim(),
    }))
    .filter((item) => item.name)
    .sort((a, b) => (b.net_assets_pct || 0) - (a.net_assets_pct || 0));
};

const resolveFundReference = async (payload: any) => {
  const fundId = String(payload?.fund_id || "").trim();
  if (!/^[a-f\d]{24}$/i.test(fundId)) {
    return {
      fund_id: null,
      scheme_code: String(payload?.scheme_code || "").trim(),
      fund_name: String(payload?.fund_name || "").trim(),
    };
  }

  const fund = await MFFund.findOne({ _id: fundId, is_deleted: false })
    .select("_id scheme_code fund_name")
    .lean();

  if (!fund) throw new Error("Selected fund not found");

  return {
    fund_id: new Types.ObjectId(String(fund._id)),
    scheme_code: String(payload?.scheme_code || fund.scheme_code || "").trim(),
    fund_name: String(payload?.fund_name || fund.fund_name || "").trim(),
  };
};

export const normalizeTopHoldingImportPayload = async (payload: any) => {
  const fundRef = await resolveFundReference(payload);
  const fundName = String(fundRef.fund_name || payload?.fund_name || "").trim();
  if (!fundName) throw new Error("fund_name is required");

  const holdings = normalizeHoldingsRows(payload?.holdings);
  const schemeCode = String(fundRef.scheme_code || payload?.scheme_code || "").trim();
  const sourceIsin = String(payload?.source_isin || "").trim();
  const schemeIdentity = buildTopHoldingSchemeIdentity(schemeCode, sourceIsin);
  if (!schemeIdentity) throw new Error("scheme_code is required for top holdings identity");

  const nextData = {
    ...fundRef,
    scheme_code: schemeCode,
    scheme_identity: schemeIdentity,
    source_standard_name: String(payload?.source_standard_name || "").trim(),
    source_isin: sourceIsin,
    portfolio_date: toDateOrNull(payload?.portfolio_date),
    prev_portfolio_date: toDateOrNull(payload?.prev_portfolio_date),
    stock_holdings: toNumberOrNull(payload?.stock_holdings),
    bond_holdings: toNumberOrNull(payload?.bond_holdings),
    assets_top_10_holdings_pct: toNumberOrNull(payload?.assets_top_10_holdings_pct),
    turnover_pct: toNumberOrNull(payload?.turnover_pct),
    domestic_equity_pct: toNumberOrNull(payload?.domestic_equity_pct),
    international_equity_pct: toNumberOrNull(payload?.international_equity_pct),
    debt_pct: toNumberOrNull(payload?.debt_pct),
    other_pct: toNumberOrNull(payload?.other_pct),
    gold_pct: toNumberOrNull(payload?.gold_pct),
    cash_pct: toNumberOrNull(payload?.cash_pct),
    large_cap_pct: toNumberOrNull(payload?.large_cap_pct),
    mid_cap_pct: toNumberOrNull(payload?.mid_cap_pct),
    small_cap_pct: toNumberOrNull(payload?.small_cap_pct),
    tax_type: String(payload?.tax_type || "").trim(),
    riskometer_label: String(payload?.riskometer_label || "").trim(),
    top_holdings_summary: normalizeHoldingsSummary(payload?.top_holdings_summary),
    holdings,
    holdings_count: holdings.length,
    is_latest: false,
    upload_batch_id: String(payload?.upload_batch_id || "").trim(),
    uploaded_at: toDateOrNull(payload?.uploaded_at) || new Date(),
    is_active: Number(payload?.is_active) === 0 ? 0 : 1,
    is_deleted: false,
    deleted_at: null,
  };

  return {
    ...nextData,
    snapshot_hash:
      String(payload?.snapshot_hash || "").trim() ||
      computeTopHoldingSnapshotHash(nextData),
  };
};

export const recomputeTopHoldingLatestForIdentity = async (schemeIdentity: string) => {
  const normalizedIdentity = String(schemeIdentity || "").trim();
  if (!normalizedIdentity) return null;

  const latest = await MFTopHolding.findOne({
    scheme_identity: normalizedIdentity,
    is_deleted: false,
  })
    .sort({ portfolio_date: -1, uploaded_at: -1, _id: -1 })
    .select("_id fund_id top_holdings_summary is_active")
    .lean();

  if (!latest) {
    await MFTopHolding.updateMany(
      { scheme_identity: normalizedIdentity, is_deleted: false },
      { $set: { is_latest: false } },
    );
    return null;
  }

  await MFTopHolding.updateMany(
    { scheme_identity: normalizedIdentity, is_deleted: false },
    { $set: { is_latest: false, is_active: latest.is_active === 0 ? 0 : 1 } },
  );

  await MFTopHolding.updateOne(
    { _id: latest._id },
    { $set: { is_latest: true } },
  );

  if (latest.fund_id) {
    await MFFund.updateOne(
      { _id: latest.fund_id },
      { top_holdings: latest.top_holdings_summary || [] },
    );
  }

  return latest;
};

export const getTopHoldings = async (query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { is_deleted: false, scheme_identity: { $ne: "" } };

  if (query?.is_active !== undefined) {
    filter.is_active = Number(query.is_active) === 1 ? 1 : 0;
  }
  if (query?.schemeCode) {
    filter.scheme_code = { $regex: String(query.schemeCode).trim(), $options: "i" };
  }
  if (query?.search) {
    const search = String(query.search).trim();
    filter.$or = [
      { fund_name: { $regex: search, $options: "i" } },
      { scheme_code: { $regex: search, $options: "i" } },
      { source_standard_name: { $regex: search, $options: "i" } },
      { source_isin: { $regex: search, $options: "i" } },
    ];
  }
  if (query?.portfolioDate) {
    const date = toDateOrNull(query.portfolioDate);
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.portfolio_date = { $gte: start, $lte: end };
    }
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, {
    portfolio_date: -1,
    uploaded_at: -1,
    _id: -1,
  });

  const [result] = await MFTopHolding.aggregate([
    { $match: filter },
    { $sort: { portfolio_date: -1, uploaded_at: -1, _id: -1 } },
    { $group: { _id: "$scheme_identity", doc: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$doc" } },
    { $sort: sort },
    {
      $project: {
        holdings: 0,
        is_deleted: 0,
        deleted_at: 0,
      },
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        meta: [{ $count: "total" }],
      },
    },
  ]).allowDiskUse(true);

  const data = result?.data || [];
  const total = result?.meta?.[0]?.total || 0;

  return {
    success: true,
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

export const getTopHoldingHistory = async (schemeId: string, query: any) => {
  const { page, limit, skip } = parsePagination(query);
  const schemeIdentity = decodeURIComponent(String(schemeId || "")).trim();
  if (!schemeIdentity) throw new Error("Scheme identity is required");

  const filter: any = { scheme_identity: schemeIdentity, is_deleted: false };
  const fromDate = toDateOrNull(query?.fromDate);
  const toDate = toDateOrNull(query?.toDate);
  if (fromDate || toDate) {
    filter.portfolio_date = {};
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      filter.portfolio_date.$gte = start;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.portfolio_date.$lte = end;
    }
  }

  const [data, total] = await Promise.all([
    MFTopHolding.find(filter)
      .select("-is_deleted -deleted_at")
      .sort({ portfolio_date: -1, uploaded_at: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MFTopHolding.countDocuments(filter),
  ]);

  return {
    success: true,
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

export const getTopHoldingById = async (id: string) => {
  const doc = await MFTopHolding.findOne({ _id: id, is_deleted: false })
    .select("-is_deleted -deleted_at")
    .populate("fund_id", "fund_name scheme_code amc_id category_id");
  if (!doc) throw new Error("Top holding record not found");
  return doc;
};

const createTopHoldingSnapshot = async (payload: any) => {
  const nextData = await normalizeTopHoldingImportPayload({
    ...payload,
    upload_batch_id: payload?.upload_batch_id || new Types.ObjectId().toString(),
    uploaded_at: new Date(),
  });

  if (!nextData.portfolio_date) {
    throw new Error("portfolio_date is required");
  }

  const duplicate = await MFTopHolding.findOne({
    is_deleted: false,
    scheme_identity: nextData.scheme_identity,
    portfolio_date: nextData.portfolio_date,
    snapshot_hash: nextData.snapshot_hash,
  })
    .select("_id")
    .lean();

  if (duplicate) {
    return {
      noChanges: true,
      existing_id: duplicate._id,
      scheme_identity: nextData.scheme_identity,
    };
  }

  const doc = await MFTopHolding.create(nextData);
  await recomputeTopHoldingLatestForIdentity(nextData.scheme_identity);
  return doc;
};

export const createTopHolding = async (payload: any) => {
  return createTopHoldingSnapshot({
    ...payload,
    upload_batch_id: "manual-create",
  });
};

export const updateTopHolding = async (id: string, payload: any) => {
  const existing = await MFTopHolding.findOne({ _id: id, is_deleted: false }).lean();
  if (!existing) throw new Error("Top holding record not found");

  return createTopHoldingSnapshot({
    ...existing,
    ...payload,
    _id: undefined,
    is_latest: false,
    snapshot_hash: "",
    upload_batch_id: "manual-revision",
  });
};

export const deleteTopHolding = async (id: string) => {
  const doc = await MFTopHolding.findOne({ _id: id, is_deleted: false });
  if (!doc || doc.is_deleted) throw new Error("Top holding record not found");
  const schemeIdentity = doc.scheme_identity || "";
  if (!schemeIdentity) throw new Error("Scheme identity is missing");

  await MFTopHolding.updateMany(
    { scheme_identity: schemeIdentity, is_deleted: false },
    { $set: { is_active: 0 } },
  );
  await recomputeTopHoldingLatestForIdentity(schemeIdentity);

  return {
    scheme_identity: schemeIdentity,
    is_active: 0,
  };
};

export const toggleTopHoldingSchemeStatus = async (schemeId: string) => {
  const schemeIdentity = decodeURIComponent(String(schemeId || "")).trim();
  if (!schemeIdentity) throw new Error("Scheme identity is required");

  const latest = await MFTopHolding.findOne({
    scheme_identity: schemeIdentity,
    is_deleted: false,
  })
    .sort({ portfolio_date: -1, uploaded_at: -1, _id: -1 })
    .select("_id is_active")
    .lean();

  if (!latest) throw new Error("Top holding scheme not found");
  const nextStatus = latest.is_active === 1 ? 0 : 1;

  await MFTopHolding.updateMany(
    { scheme_identity: schemeIdentity, is_deleted: false },
    { $set: { is_active: nextStatus } },
  );
  await recomputeTopHoldingLatestForIdentity(schemeIdentity);

  return {
    scheme_identity: schemeIdentity,
    is_active: nextStatus,
  };
};
