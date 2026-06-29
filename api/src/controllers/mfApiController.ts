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
  importTopHoldingsForScheme,
  getLatestTopHoldingsForScheme,
  getNavHistoryForScheme,
  resumeDetailedSyncBatch,
  buildManualBridgeResetUpdate,
  buildManualBridgeResetFilter,
} from "../services/mfApiService";
import { sendError, sendSuccess } from "../utils/apiResponse";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware";
import MfApiSyncLog from "../models/mfApiSyncLogModel";

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
    const activeSync = await MfApiSyncLog.findOne({
      action: { $in: ["sync-all", "sync-resume"] },
      status: { $in: ["running", "rate_limited"] },
    });
    if (activeSync) {
      return sendError(res, "A sync is already in progress. Please wait for it to finish or check the sync progress modal.", 409);
    }
    const response = await syncAllExternalSchemes(readContext(req));
    return sendSuccess(res, response.message || "MF API sync started", response);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to start MF API sync", 500);
  }
};

export const syncActiveMfApiSchemes = async (req: Request, res: Response) => {
  try {
    const activeSync = await MfApiSyncLog.findOne({
      action: { $in: ["sync-all", "sync-resume"] },
      status: { $in: ["running", "rate_limited"] },
    });
    if (activeSync) {
      return sendError(res, "A sync is already in progress. Please wait for it to finish or check the sync progress modal.", 409);
    }
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

export const exportMfApi = async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active_only === "true" || req.query.type === "active";
    const exported = await exportMfApiData({ activeOnly });
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

    const snap = await importTopHoldingsForScheme({ schemeId, holdings, portfolio_date, ...rest });
    return sendSuccess(res, "Top holdings imported", snap);
  } catch (error: any) {
    const is404 = error?.message === "Scheme not found";
    return sendError(res, error?.message || "Failed to import top holdings", is404 ? 404 : 500);
  }
};

export const getMfApiTopHoldings = async (req: Request, res: Response) => {
  try {
    const latest = await getLatestTopHoldingsForScheme(req.params.id);
    return sendSuccess(res, "Top holdings fetched", latest || null);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to fetch top holdings", 500);
  }
};

// ─── NAV History ────────────────────────────────────────────────────────────

export const getMfApiNavHistory = async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days || 365);
    const history = await getNavHistoryForScheme(req.params.id, days);
    return sendSuccess(res, "NAV history fetched", history);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to fetch NAV history", 500);
  }
};

export const syncSchemeToManual = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const MfApiScheme = (await import("../models/mfApiSchemeModel")).default;
    const MFFund = (await import("../models/mfFundModel")).default;
    const scheme = await MfApiScheme.findById(id).select("_id scheme_code scheme_name is_active").lean();

    if (!scheme) {
      return sendError(res, "Scheme not found", 404);
    }

    if (scheme.is_active) {
      const { syncApiSchemeToManual } = await import("../services/mf-import/MfApiSyncEngine");
      const result = await syncApiSchemeToManual(id, { activating: true });
      return sendSuccess(res, "Bridge sync completed", result);
    }

    if (!scheme.scheme_code) {
      return sendSuccess(res, "Manual bridge reconcile skipped", {
        action: "skipped",
        reason: "scheme_code missing for inactive scheme",
      });
    }

    const softDeleted = await MFFund.updateMany(
      { ...buildManualBridgeResetFilter(id, scheme.scheme_code), is_deleted: false },
      { $set: buildManualBridgeResetUpdate() },
    );

    await MfApiScheme.findByIdAndUpdate(id, {
      $set: {
        sync_status: "success",
        last_sync_error: "",
        last_synced_at: new Date(),
      },
    });

    return sendSuccess(res, "Manual bridge reconciled", {
      action: "soft_deleted",
      matchedCount: softDeleted.matchedCount,
      modifiedCount: softDeleted.modifiedCount,
    });
  } catch (err: any) {
    return sendError(res, err?.message || "Bridge sync failed", 500);
  }
};

export const resyncAllToManual = async (req: Request, res: Response) => {
  try {
    const { syncApiSchemeToManual } = await import("../services/mf-import/MfApiSyncEngine");
    const MfApiScheme = (await import("../models/mfApiSchemeModel")).default;
    const MFFund = (await import("../models/mfFundModel")).default;

    const schemes = await MfApiScheme.find({
      is_deleted: { $ne: true },
    })
      .select("_id scheme_code is_active")
      .lean();

    // Fire and forget — HTTP responds immediately; reconciliation runs in background
    (async () => {
      let activated = 0;
      let deactivated = 0;
      let failed = 0;
      for (const s of schemes) {
        try {
          if ((s as any).is_active) {
            await syncApiSchemeToManual(String(s._id), { activating: true });
            activated++;
          } else if ((s as any).scheme_code) {
            await MFFund.updateMany(
              {
                ...buildManualBridgeResetFilter(String(s._id), (s as any).scheme_code),
                is_deleted: false,
              },
              { $set: buildManualBridgeResetUpdate() },
            );
            deactivated++;
          }
        } catch (e: any) {
          failed++;
          console.error(`[resync-to-manual] Failed scheme ${s._id}:`, e?.message);
        }
      }
      console.log(
        `[resync-to-manual] Completed ${schemes.length} schemes, ${activated} activated, ${deactivated} deactivated, ${failed} failed`,
      );
    })().catch(console.error);

    return sendSuccess(res, `Bridge reconciliation started for ${schemes.length} schemes`, {
      total: schemes.length,
    });
  } catch (err: any) {
    return sendError(res, err?.message || "Resync failed", 500);
  }
};

export const resumeMfApiSync = async (req: Request, res: Response) => {
  try {
    const response = await resumeDetailedSyncBatch(readContext(req));
    return sendSuccess(res, response.message, response);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to resume sync", 500);
  }
};

export const getUnbridgedSchemes = async (_req: Request, res: Response) => {
  try {
    const MfApiScheme = (await import("../models/mfApiSchemeModel")).default;
    const MFFund = (await import("../models/mfFundModel")).default;

    const activeSchemes = await MfApiScheme.find({
      is_active: true,
      is_deleted: { $ne: true },
    })
      .select("_id scheme_code scheme_name amc_name category last_sync_error sync_status")
      .lean();

    // Build a set of scheme_codes that are already bridged (have an MFFund record)
    const bridgedFunds = await MFFund.find({
      is_deleted: false,
      is_active: 1,
      scheme_code: { $ne: "" },
    })
      .select("scheme_code")
      .lean();

    const bridgedCodes = new Set(bridgedFunds.map((f: any) => f.scheme_code).filter(Boolean));

    const unbridged = activeSchemes.filter((s: any) => !bridgedCodes.has(s.scheme_code));

    return sendSuccess(
      res,
      `${unbridged.length} active schemes not found in manual module`,
      {
        total_active: activeSchemes.length,
        total_bridged: bridgedCodes.size,
        unbridged_count: unbridged.length,
        unbridged,
      }
    );
  } catch (err: any) {
    return sendError(res, err?.message || "Failed to fetch unbridged schemes", 500);
  }
};
