import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import * as XLSX from "xlsx";
import MFFund from "../models/mfFundModel";
import NavHistory from "../models/navHistoryModel";
import { buildSort, parsePagination, toDateOrNull, toNumberOrNull } from "./mfUtils";
import { calculateNAV, calculateReturns, normalizeDateOnly, roundTo3 } from "./navCalculationService";

const XLSXModule: typeof XLSX = (XLSX as unknown as { default?: typeof XLSX }).default || XLSX;

type NavUploadOptions = {
  filePath: string;
  fileName: string;
  validateOnly?: boolean;
};

type NavRow = {
  schemeId: mongoose.Types.ObjectId;
  schemeCode: string;
  rowNumber: number;
  date: Date;
  nav: number;
  totalAssets: number;
  totalLiabilities: number;
  totalUnits: number;
};

type UploadError = {
  row: number;
  message: string;
  identifier?: string;
};

const REQUIRED_HEADER_GROUPS = [
  ["scheme_id", "schemeid", "scheme_code", "schemecode", "isin"],
  ["date", "nav_date", "as_on_date"],
];

const FORMULA_HEADER_GROUPS = [
  ["total_assets", "totalassets", "assets"],
  ["total_liabilities", "totalliabilities", "liabilities"],
  ["total_units", "totalunits", "units"],
];

const NAV_HEADER_GROUP = ["nav", "net_asset_value"];

const headerKey = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const valueByAliases = (row: Record<string, unknown>, aliases: string[]) => {
  for (const alias of aliases) {
    const value = row[headerKey(alias)];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
};

const readClientHistoricalRows = (workbook: XLSX.WorkBook) => {
  const rows: Record<string, unknown>[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const sheetRows = XLSXModule.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    }) as unknown[][];

    const schemeNameCell = String(sheetRows[0]?.[0] || "");
    const schemeName = schemeNameCell.replace(/^scheme\s*name\s*-\s*/i, "").trim();
    const isinRow = sheetRows.find((row) => headerKey(row?.[0]).includes("isin"));
    const isin = String(isinRow?.[1] || "").trim();
    const headerRowIndex = sheetRows.findIndex((row) => {
      const keys = row.map((cell) => headerKey(cell));
      return keys.includes("date") && keys.includes("nav");
    });

    if (headerRowIndex < 0) continue;

    const headerKeys = sheetRows[headerRowIndex].map((cell) => headerKey(cell));
    const dateIndex = headerKeys.indexOf("date");
    const navIndex = headerKeys.indexOf("nav");
    if (dateIndex < 0 || navIndex < 0) continue;

    for (let index = headerRowIndex + 1; index < sheetRows.length; index += 1) {
      const row = sheetRows[index];
      const date = row?.[dateIndex];
      const nav = row?.[navIndex];
      if (!String(date || "").trim() && !String(nav || "").trim()) continue;
      rows.push({
        sheet_name: sheetName,
        scheme_name: schemeName || sheetName.trim(),
        isin,
        date,
        nav,
        __row_number: index + 1,
      });
    }
  }

  return rows;
};

const normalizeRows = (workbook: XLSX.WorkBook) => {
  const clientRows = readClientHistoricalRows(workbook);
  if (clientRows.length > 0) {
    return {
      sheetName: workbook.SheetNames.join(", "),
      headers: ["scheme_name", "isin", "date", "nav"],
      rows: clientRows,
      isClientHistoricalLayout: true,
    };
  }

  const sheetName =
    workbook.SheetNames.find((name) => headerKey(name).includes("nav")) ||
    workbook.SheetNames[0];
  if (!sheetName) {
    return {
      sheetName: "",
      headers: [],
      rows: [] as Record<string, unknown>[],
      isClientHistoricalLayout: false,
    };
  }

  const rows = XLSXModule.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
    blankrows: false,
  }) as Record<string, unknown>[];

  return {
    sheetName,
    headers: getHeaderKeys(workbook, sheetName),
    rows: rows.map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [headerKey(key), value])),
    ),
    isClientHistoricalLayout: false,
  };
};

const getHeaderKeys = (workbook: XLSX.WorkBook, sheetName: string) => {
  const sheet = workbook.Sheets[sheetName];
  const rangeRef = sheet?.["!ref"];
  if (!sheet || !rangeRef) return [];
  const range = XLSXModule.utils.decode_range(rangeRef);
  const headers: string[] = [];
  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const cellAddress = XLSXModule.utils.encode_cell({ r: range.s.r, c: col });
    const normalized = headerKey(sheet[cellAddress]?.v);
    if (normalized) headers.push(normalized);
  }
  return headers;
};

const parseNumber = (row: Record<string, unknown>, aliases: string[]) =>
  toNumberOrNull(valueByAliases(row, aliases));

const exactRegex = (value: string) => ({
  $regex: `^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
  $options: "i",
});

const normalizeSchemeMatchName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b(regular|direct|plan|growth|option|idcw)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();

const resolveScheme = async (row: Record<string, unknown>) => {
  const schemeId = String(valueByAliases(row, ["scheme_id", "schemeid"]) || "").trim();
  if (mongoose.Types.ObjectId.isValid(schemeId)) {
    const byId = await MFFund.findOne({ _id: schemeId, is_deleted: false })
      .select("_id scheme_code")
      .lean();
    if (byId) return byId;
  }

  const schemeCode = String(valueByAliases(row, ["scheme_code", "schemecode", "code"]) || "").trim();
  if (schemeCode) {
    const byCode = await MFFund.findOne({
      scheme_code: exactRegex(schemeCode),
      is_deleted: false,
    })
      .select("_id scheme_code")
      .lean();
    if (byCode) return byCode;
  }

  const isin = String(valueByAliases(row, ["isin"]) || "").trim();
  if (isin) {
    const byIsin = await MFFund.findOne({
      $or: [{ isin: exactRegex(isin) }, { scheme_code: exactRegex(isin) }],
      is_deleted: false,
    })
      .select("_id scheme_code")
      .lean();
    if (byIsin) return byIsin;
  }

  const schemeName = String(valueByAliases(row, ["scheme_name", "fund_name"]) || "").trim();
  if (schemeName) {
    const byName = await MFFund.findOne({
      fund_name: exactRegex(schemeName),
      is_deleted: false,
    })
      .select("_id scheme_code")
      .lean();
    if (byName) return byName;

    const byPartialName = await MFFund.findOne({
      fund_name: { $regex: schemeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
      is_deleted: false,
    })
      .select("_id scheme_code")
      .lean();
    if (byPartialName) return byPartialName;

    const normalizedTarget = normalizeSchemeMatchName(schemeName);
    if (normalizedTarget) {
      const firstToken = schemeName.split(/\s+/).find((token) => token.length > 2) || "";
      const candidates = await MFFund.find({
        ...(firstToken
          ? { fund_name: { $regex: firstToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
          : {}),
        is_deleted: false,
      })
        .select("_id scheme_code fund_name")
        .limit(250)
        .lean();
      const fuzzyMatch = candidates.find((candidate) => {
        const normalizedCandidate = normalizeSchemeMatchName(String(candidate.fund_name || ""));
        return (
          normalizedCandidate === normalizedTarget ||
          normalizedCandidate.includes(normalizedTarget) ||
          normalizedTarget.includes(normalizedCandidate)
        );
      });
      if (fuzzyMatch) return fuzzyMatch;
    }
  }

  return null;
};

const validateHeaders = (headers: string[]): UploadError[] => {
  const baseErrors = REQUIRED_HEADER_GROUPS.flatMap((group) =>
    group.some((alias) => headers.includes(headerKey(alias)))
      ? []
      : [{ row: 1, message: `Missing required column. Add one of: ${group.join(", ")}` }],
  );
  const hasDirectNav = NAV_HEADER_GROUP.some((alias) => headers.includes(headerKey(alias)));
  const hasFormulaColumns = FORMULA_HEADER_GROUPS.every((group) =>
    group.some((alias) => headers.includes(headerKey(alias))),
  );
  if (!hasDirectNav && !hasFormulaColumns) {
    return [
      ...baseErrors,
      {
        row: 1,
        message:
          "Missing NAV inputs. Add nav, or add total_assets, total_liabilities, and total_units",
      },
    ];
  }
  return baseErrors;
};

const parseNavRows = async (rows: Record<string, unknown>[]) => {
  const errors: UploadError[] = [];
  const validRows: NavRow[] = [];
  const seenKeyIndexes = new Map<string, number>();
  const schemeCache = new Map<string, Awaited<ReturnType<typeof resolveScheme>>>();
  let skipped = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = Number(row.__row_number) || index + 2;
    const identifier = String(
      valueByAliases(row, ["scheme_code", "schemecode", "scheme_id", "isin", "scheme_name"]) || "",
    ).trim();
    const hasAnyValue = Object.values(row).some((value) => String(value || "").trim());
    if (!hasAnyValue) continue;

    const schemeCacheKey = String(
      valueByAliases(row, ["scheme_id", "schemeid", "scheme_code", "schemecode", "code", "isin", "scheme_name", "fund_name"]) ||
        "",
    )
      .trim()
      .toLowerCase();
    let scheme = schemeCache.get(schemeCacheKey);
    if (!schemeCache.has(schemeCacheKey)) {
      scheme = await resolveScheme(row);
      schemeCache.set(schemeCacheKey, scheme);
    }
    const date = toDateOrNull(valueByAliases(row, ["date", "nav_date", "as_on_date"]));
    const totalAssets = parseNumber(row, ["total_assets", "totalassets", "assets"]);
    const totalLiabilities = parseNumber(row, [
      "total_liabilities",
      "totalliabilities",
      "liabilities",
    ]);
    const totalUnits = parseNumber(row, ["total_units", "totalunits", "units"]);
    const uploadedNav = parseNumber(row, ["nav", "net_asset_value"]);

    if (!scheme?._id) {
      errors.push({ row: rowNumber, message: "Scheme could not be resolved", identifier });
      continue;
    }
    if (!date) {
      errors.push({ row: rowNumber, message: "Valid date is required", identifier });
      continue;
    }
    const hasFormulaValues =
      totalAssets !== null && totalLiabilities !== null && totalUnits !== null;
    if (uploadedNav === null && !hasFormulaValues) {
      errors.push({
        row: rowNumber,
        message:
          "NAV is required, or totalAssets, totalLiabilities, and totalUnits must all be valid numbers",
        identifier,
      });
      continue;
    }

    try {
      const normalizedDate = normalizeDateOnly(date);
      const dedupeKey = `${String(scheme._id)}::${normalizedDate.toISOString().slice(0, 10)}`;
      const nextRow = {
        schemeId: new mongoose.Types.ObjectId(String(scheme._id)),
        schemeCode: String(scheme.scheme_code || ""),
        rowNumber,
        date: normalizedDate,
        nav: hasFormulaValues
          ? calculateNAV(totalAssets, totalLiabilities, totalUnits)
          : roundTo3(uploadedNav),
        totalAssets: hasFormulaValues ? totalAssets : roundTo3(uploadedNav),
        totalLiabilities: hasFormulaValues ? totalLiabilities : 0,
        totalUnits: hasFormulaValues ? totalUnits : 1,
      };
      const existingIndex = seenKeyIndexes.get(dedupeKey);
      if (existingIndex !== undefined) {
        validRows[existingIndex] = nextRow;
        skipped += 1;
        continue;
      }
      seenKeyIndexes.set(dedupeKey, validRows.length);
      validRows.push(nextRow);
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Invalid NAV row",
        identifier,
      });
    }
  }

  return { validRows, errors, skipped };
};

const updateSchemeReturns = async (schemeId: string) => {
  const returns = await calculateReturns(schemeId);
  await MFFund.updateOne(
    { _id: schemeId },
    {
      $set: {
        "returns.d1": returns.d1.value,
        "returns.m1": returns.m1.value,
        "returns.y1": returns.y1.value,
      },
    },
  );
};

const syncFundLatestNav = async (schemeId: string, nav: number, navDate: Date) => {
  const normalizedNavDate = normalizeDateOnly(navDate);
  await MFFund.updateOne(
    {
      _id: schemeId,
      $or: [{ nav_date: null }, { nav_date: { $lte: normalizedNavDate } }],
    },
    {
      $set: {
        nav_Current: nav,
        nav_date: normalizedNavDate,
      },
    },
  );
};

export const uploadNavWorkbook = async ({
  filePath,
  fileName,
  validateOnly = false,
}: NavUploadOptions) => {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error("Uploaded NAV file not found");
  }

  const workbook = XLSXModule.readFile(resolvedPath, {
    cellDates: true,
    cellNF: true,
    cellText: true,
  });
  const { headers, rows } = normalizeRows(workbook);
  const headerErrors = validateHeaders(headers);
  const { validRows, errors, skipped } = await parseNavRows(rows);
  const allErrors = [...headerErrors, ...errors];

  if (headerErrors.length > 0 || allErrors.length > 0) {
    return {
      success: false,
      fileName,
      validateOnly,
      inserted: 0,
      updated: 0,
      skipped,
      rejected: allErrors.length,
      errors: allErrors.slice(0, 500),
    };
  }

  let inserted = 0;
  let updated = 0;
  const affectedSchemeIds = new Set<string>();

  for (const row of validRows) {
    const existing = await NavHistory.findOne({
      schemeId: row.schemeId,
      date: row.date,
    })
      .select("_id")
      .lean();

    if (!validateOnly) {
      await NavHistory.updateOne(
        { schemeId: row.schemeId, date: row.date },
        {
          $set: {
            nav: row.nav,
            totalAssets: row.totalAssets,
            totalLiabilities: row.totalLiabilities,
            totalUnits: row.totalUnits,
          },
        },
        { upsert: true },
      );
    }

    if (existing) updated += 1;
    else inserted += 1;
    affectedSchemeIds.add(String(row.schemeId));

    if (!validateOnly) {
      await syncFundLatestNav(String(row.schemeId), row.nav, row.date);
    }
  }

  if (validateOnly) {
    return {
      success: true,
      fileName,
      validateOnly,
      inserted,
      updated,
      skipped,
      rejected: 0,
      errors: [],
    };
  }

  await Promise.all(Array.from(affectedSchemeIds).map(updateSchemeReturns));

  return {
    success: true,
    fileName,
    validateOnly,
    inserted,
    updated,
    skipped,
    rejected: 0,
    errors: [],
  };
};

export const getNavHistory = async (schemeId: string, query: Record<string, unknown>) => {
  if (!mongoose.Types.ObjectId.isValid(schemeId)) throw new Error("Invalid scheme id");
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = { schemeId };
  const fromDate = toDateOrNull(query?.fromDate);
  const toDate = toDateOrNull(query?.toDate);

  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) (filter.date as Record<string, Date>).$gte = normalizeDateOnly(fromDate);
    if (toDate) {
      const endDate = normalizeDateOnly(toDate);
      endDate.setHours(23, 59, 59, 999);
      (filter.date as Record<string, Date>).$lte = endDate;
    }
  }

  const sort = buildSort(query?.sortBy, query?.sortOrder, { date: -1 });
  const [data, total] = await Promise.all([
    NavHistory.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    NavHistory.countDocuments(filter),
  ]);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

export const getNavSchemes = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = parsePagination(query);
  const search = String(query?.search || "").trim();
  const matchScheme = search
    ? {
        $or: [
          { "scheme.fund_name": { $regex: search, $options: "i" } },
          { "scheme.scheme_code": { $regex: search, $options: "i" } },
          { "scheme.isin": { $regex: search, $options: "i" } },
          { "amc.name": { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const pipeline: mongoose.PipelineStage[] = [
    {
      $sort: { date: -1, updated_at: -1 },
    },
    {
      $group: {
        _id: "$schemeId",
        latestDate: { $first: "$date" },
        latestNav: { $first: "$nav" },
        navCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "mfschemes",
        localField: "_id",
        foreignField: "_id",
        as: "scheme",
      },
    },
    { $unwind: "$scheme" },
    {
      $lookup: {
        from: "mfamcs",
        localField: "scheme.amc_id",
        foreignField: "_id",
        as: "amc",
      },
    },
    { $unwind: { path: "$amc", preserveNullAndEmptyArrays: true } },
    {
      $match: {
        "scheme.is_deleted": false,
        ...matchScheme,
      },
    },
    {
      $project: {
        _id: "$scheme._id",
        scheme_code: "$scheme.scheme_code",
        isin: "$scheme.isin",
        fund_name: "$scheme.fund_name",
        amc_id: {
          _id: "$scheme.amc_id",
          name: "$amc.name",
        },
        category_id: "$scheme.category_id",
        plan_type: "$scheme.plan_type",
        option_type: "$scheme.option_type",
        is_active: "$scheme.is_active",
        latestNav: 1,
        latestDate: 1,
        navCount: 1,
      },
    },
    { $sort: { fund_name: 1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await NavHistory.aggregate(pipeline);
  const data = result?.data || [];
  const total = Number(result?.total?.[0]?.count || 0);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

export const getLatestNav = async (schemeId: string) => {
  if (!mongoose.Types.ObjectId.isValid(schemeId)) throw new Error("Invalid scheme id");
  const latest = await NavHistory.findOne({ schemeId }).sort({ date: -1 }).lean();
  if (!latest) return { latest: null, previous: null, change: null };

  const previous = await NavHistory.findOne({
    schemeId,
    date: { $lt: normalizeDateOnly(latest.date) },
  })
    .sort({ date: -1 })
    .lean();
  const change =
    previous?.nav && previous.nav !== 0 ? roundTo3((latest.nav - previous.nav) / previous.nav) : null;

  return { latest, previous, change };
};

export const getSchemeReturns = async (schemeId: string) => {
  if (!mongoose.Types.ObjectId.isValid(schemeId)) throw new Error("Invalid scheme id");
  return calculateReturns(schemeId);
};

export const exportNavWorkbook = async () => {
  const rows = await NavHistory.find({})
    .populate("schemeId", "fund_name scheme_code isin")
    .sort({ date: -1 })
    .lean();

  const sheetRows = rows.map((row: any) => ({
    scheme_code: row.schemeId?.scheme_code || "",
    isin: row.schemeId?.isin || "",
    fund_name: row.schemeId?.fund_name || "",
    date: row.date ? row.date.toISOString().slice(0, 10) : "",
    nav: row.nav,
    total_assets: row.totalAssets,
    total_liabilities: row.totalLiabilities,
    total_units: row.totalUnits,
  }));

  const workbook = XLSXModule.utils.book_new();
  const worksheet = XLSXModule.utils.json_to_sheet(sheetRows, {
    header: [
      "scheme_code",
      "isin",
      "fund_name",
      "date",
      "nav",
      "total_assets",
      "total_liabilities",
      "total_units",
    ],
  });
  XLSXModule.utils.book_append_sheet(workbook, worksheet, "NAV_History");

  return XLSXModule.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;
};
