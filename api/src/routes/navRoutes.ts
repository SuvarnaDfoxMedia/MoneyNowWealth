import express from "express";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import { uploadNavDataFile } from "../middlewares/uploadMiddleware";
import { exportNav, getLatestNav, getNavHistory, getNavSchemes, getReturns, uploadNav } from "../controllers/navController";
import { getSchemeById, getSchemes } from "../controllers/schemeController";

const router = express.Router();
const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

router.get("/schemes", getSchemes);
router.get("/schemes/:id", getSchemeById);
router.get("/nav/:schemeId/history", getNavHistory);
router.get("/nav/:schemeId/latest", getLatestNav);
router.get("/returns/:schemeId", getReturns);

router.get("/:role/schemes", ...adminEditorMiddleware, getSchemes);
router.get("/:role/schemes/:id", ...adminEditorMiddleware, getSchemeById);
router.post("/:role/nav/upload", ...adminEditorMiddleware, uploadNavDataFile, uploadNav);
router.get("/:role/nav/export", ...adminEditorMiddleware, exportNav);
router.get("/:role/nav/schemes", ...adminEditorMiddleware, getNavSchemes);
router.get("/:role/nav/:schemeId/history", ...adminEditorMiddleware, getNavHistory);
router.get("/:role/nav/:schemeId/latest", ...adminEditorMiddleware, getLatestNav);
router.get("/:role/returns/:schemeId", ...adminEditorMiddleware, getReturns);

export default router;
