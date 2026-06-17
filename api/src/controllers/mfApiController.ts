import type { Request, Response } from "express";
import {
  exportMfApiData,
  getDashboardSummary,
  getSchemeById,
  getSchemes,
  getSyncLogs,
  importMfApiData,
  syncAllExternalSchemes,
  syncActiveExternalSchemes,
  syncExternalScheme,
  toggleSchemeActive,
  bulkToggleSchemeActive,
  markSchemesAsReviewed,
} from "../services/mfApiService";
import { sendError, sendSuccess } from "../utils/apiResponse";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware";
import MfApiScheme from "../models/mfApiSchemeModel";
import MfApiTopHolding from "../models/mfApiTopHoldingModel";
import MfApiNavHistory from "../models/mfApiNavHistoryModel";

const readContext = (req: Request) => ({
  role: (req as AuthenticatedRequest).user?.role,
  userId: (req as AuthenticatedRequest).user?.id,
});

export const getDashboard = async (_req: Request, res: Response) => {
  try {
    const response = await getDashboardSummary();
    return sendSuccess(res, "MF API dashboard fetched successfully", response.data, 200, {
      success: response.success,
    });
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to fetch dashboard", 500);
  }
};

export const getMfApiSchemesList = async (req: Request, res: Response) => {
  try {
    const response = await getSchemes(req.query);
    return sendSuccess(res, "MF API schemes fetched successfully", response.data, 200, {
      total: response.total,
      currentPage: response.currentPage,
      totalPages: response.totalPages,
      limit: response.limit,
    });
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to fetch MF API schemes", 500);
  }
};

export const getMfApiScheme = async (req: Request, res: Response) => {
  try {
    const data = await getSchemeById(req.params.id);
    return sendSuccess(res, "MF API scheme fetched successfully", data);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to fetch MF API scheme", 404);
  }
};

export const getMfApiLogs = async (req: Request, res: Response) => {
  try {
    const response = await getSyncLogs(req.query);
    return sendSuccess(res, "MF API sync logs fetched successfully", response.data, 200, {
      total: response.total,
      currentPage: response.currentPage,
      totalPages: response.totalPages,
      limit: response.limit,
    });
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to fetch sync logs", 500);
  }
};

export const syncAllMfApiSchemes = async (req: Request, res: Response) => {
  try {
    const response = await syncAllExternalSchemes(readContext(req));
    return sendSuccess(res, response.message || "MF API sync started", response);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to start MF API sync", 500);
  }
};

export const syncActiveMfApiSchemes = async (req: Request, res: Response) => {
  try {
    const response = await syncActiveExternalSchemes(readContext(req));
    return sendSuccess(res, response.message || "Active MF API sync started", response);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to start active MF API sync", 500);
  }
};

export const syncOneMfApiScheme = async (req: Request, res: Response) => {
  try {
    const response = await syncExternalScheme(
      {
        schemeId: req.body?.schemeId,
        schemeName: req.body?.schemeName,
        externalSchemeId: req.body?.externalSchemeId,
      },
      readContext(req),
    );
    return sendSuccess(res, response.message || "Scheme sync started", response.data);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to sync scheme", 400);
  }
};

export const importMfApi = async (req: Request, res: Response) => {
  try {
    if (!req.file?.path) {
      return sendError(res, "File is required", 400);
    }
    const validateOnly = String(req.body?.validateOnly || "").trim() === "true";
    const report = await importMfApiData({
      filePath: req.file.path,
      validateOnly,
      context: readContext(req),
    });
    return sendSuccess(
      res,
      validateOnly ? "File validated successfully" : "MF API import completed",
      report,
      200,
    );
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to import MF API data", 400);
  }
};

export const exportMfApi = async (_req: Request, res: Response) => {
  try {
    const exported = await exportMfApiData();
    res.setHeader("Content-Type", exported.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${exported.fileName}"`);
    return res.status(200).send(exported.buffer);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to export MF API data", 400);
  }
};

export const toggleMfApiSchemeActive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const is_active = Boolean(req.body?.is_active);
    const response = await toggleSchemeActive(id, is_active);
    return sendSuccess(
      res,
      `Scheme ${is_active ? "activated" : "deactivated"} successfully`,
      response.data
    );
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to toggle scheme", 400);
  }
};

export const bulkToggleMfApiSchemeActive = async (req: Request, res: Response) => {
  try {
    const ids: string[] = req.body?.ids || [];
    const is_active = Boolean(req.body?.is_active);
    if (!ids.length) return sendError(res, "No scheme IDs provided", 400);
    const response = await bulkToggleSchemeActive(ids, is_active);
    return sendSuccess(
      res,
      `${response.modifiedCount} schemes ${is_active ? "activated" : "deactivated"}`,
      response
    );
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to bulk toggle schemes", 400);
  }
};

export const markMfApiSchemesReviewed = async (req: Request, res: Response) => {
  try {
    const ids: string[] = req.body?.ids || [];
    if (!ids.length) return sendError(res, "No scheme IDs provided", 400);
    const response = await markSchemesAsReviewed(ids);
    return sendSuccess(res, "Schemes marked as reviewed", response);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to mark as reviewed", 500);
  }
};

// ─── Top Holdings ───────────────────────────────────────────────────────────

export const importMfApiTopHoldings = async (req: Request, res: Response) => {
  try {
    const { scheme_id: bodySchemeId, holdings, portfolio_date, ...rest } = req.body;
    const schemeId = bodySchemeId || req.params.id;
    if (!schemeId) return sendError(res, "scheme_id is required", 400);

    const scheme = await MfApiScheme.findById(schemeId);
    if (!scheme) return sendError(res, "Scheme not found", 404);

    // Mark all previous snapshots for this scheme as not latest
    await MfApiTopHolding.updateMany(
      { mf_api_scheme_id: scheme._id, is_deleted: { $ne: true } },
      { is_latest: false },
    );

    const portfolioDate = portfolio_date ? new Date(portfolio_date) : new Date();
    const snap = await MfApiTopHolding.create({
      mf_api_scheme_id: scheme._id,
      external_key:     scheme.external_key,
      scheme_name:      scheme.scheme_name,
      portfolio_date:   portfolioDate,
      snapshot_month:   portfolioDate.getMonth() + 1,
      snapshot_year:    portfolioDate.getFullYear(),
      holdings:         holdings || [],
      holdings_count:   (holdings || []).length,
      is_latest:        true,
      uploaded_at:      new Date(),
      ...rest,
    });

    return sendSuccess(res, "Top holdings imported", snap);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to import top holdings", 500);
  }
};

export const getMfApiTopHoldings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const latest = await MfApiTopHolding.findOne({
      mf_api_scheme_id: id,
      is_latest: true,
      is_deleted: { $ne: true },
    }).lean();
    return sendSuccess(res, "Top holdings fetched", latest || null);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to fetch top holdings", 500);
  }
};

// ─── NAV History ────────────────────────────────────────────────────────────

export const getMfApiNavHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const days = Math.min(Number(req.query.days || 365), 1825); // max 5 years
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const history = await MfApiNavHistory.find({
      scheme_id: id,
      date: { $gte: fromDate },
    })
      .sort({ date: 1 })
      .select("date nav nav_change nav_change_pct")
      .lean();

    return sendSuccess(res, "NAV history fetched", history);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to fetch NAV history", 500);
  }
};

export const syncSchemeToManual = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { syncApiSchemeToManual } = await import("../services/mfApiBridgeService");
    const result = await syncApiSchemeToManual(id, { activating: true });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Bridge sync failed" });
  }
};
