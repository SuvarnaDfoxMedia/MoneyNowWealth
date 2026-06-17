import express from "express";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import { uploadMfApiDataFile } from "../middlewares/uploadMiddleware";
import {
  exportMfApi,
  getDashboard,
  getMfApiLogs,
  getMfApiScheme,
  getMfApiSchemesList,
  importMfApi,
  syncAllMfApiSchemes,
  syncActiveMfApiSchemes,
  syncOneMfApiScheme,
  toggleMfApiSchemeActive,
  bulkToggleMfApiSchemeActive,
  markMfApiSchemesReviewed,
  getMfApiTopHoldings,
  importMfApiTopHoldings,
  getMfApiNavHistory,
  syncSchemeToManual,
  resyncAllToManual,
} from "../controllers/mfApiController";

const router = express.Router();
const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

router.get("/:role/mf-api/dashboard", ...adminEditorMiddleware, getDashboard);
router.get("/:role/mf-api/schemes", ...adminEditorMiddleware, getMfApiSchemesList);
router.get("/:role/mf-api/schemes/:id", ...adminEditorMiddleware, getMfApiScheme);
router.post("/:role/mf-api/schemes/:id/sync-to-manual", ...adminEditorMiddleware, syncSchemeToManual);
router.get("/:role/mf-api/sync-logs", ...adminEditorMiddleware, getMfApiLogs);
router.post("/:role/mf-api/sync-all", ...adminEditorMiddleware, syncAllMfApiSchemes);
router.post("/:role/mf-api/sync-active", ...adminEditorMiddleware, syncActiveMfApiSchemes);
router.post("/:role/mf-api/sync-one", ...adminEditorMiddleware, syncOneMfApiScheme);
router.post(
  "/:role/mf-api/import",
  ...adminEditorMiddleware,
  uploadMfApiDataFile,
  importMfApi,
);
router.get("/:role/mf-api/export", ...adminEditorMiddleware, exportMfApi);
router.patch("/:role/mf-api/schemes/:id/toggle-active", ...adminEditorMiddleware, toggleMfApiSchemeActive);
router.post("/:role/mf-api/schemes/bulk-toggle", ...adminEditorMiddleware, bulkToggleMfApiSchemeActive);
router.post("/:role/mf-api/schemes/mark-reviewed", ...adminEditorMiddleware, markMfApiSchemesReviewed);

// ─ Top Holdings (manual import, not from API) ─
router.get("/:role/mf-api/schemes/:id/top-holdings", ...adminEditorMiddleware, getMfApiTopHoldings);
router.post("/:role/mf-api/schemes/:id/top-holdings", ...adminEditorMiddleware, importMfApiTopHoldings);

// ─ NAV History (built up daily via sync) ─
router.get("/:role/mf-api/schemes/:id/nav-history", ...adminEditorMiddleware, getMfApiNavHistory);

// ─ Bulk bridge re-sync: repopulates MFFund from stored MfApiScheme data ─
router.post("/:role/mf-api/resync-to-manual", ...adminEditorMiddleware, resyncAllToManual);

export default router;
