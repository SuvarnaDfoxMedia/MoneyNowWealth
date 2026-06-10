import express from "express";

import {
  getPages,
  getPageById,
  addPage,
  updatePage,
  togglePageStatus,
  deletePage,
  getPageBySlug,
} from "../controllers/cmsPageController.js";

import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */
router.get("/cmspages", getPages); // list all pages
router.get("/cmspages/:id", getPageById); // get single page
router.get("/cmspages/slug/:slug", getPageBySlug);

/* -------------------- ADMIN-ONLY MIDDLEWARE -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- ADMIN ROUTES -------------------- */
router.get("/:role/cmspages", adminMiddleware, getPages);
router.get("/:role/cmspages/:id", adminMiddleware, getPageById);

router.post("/:role/cmspages/create", adminMiddleware, addPage);

router.put("/:role/cmspages/edit/:id", adminMiddleware, updatePage);

router.patch(
  "/:role/cmspages/change/:id/status",
  adminMiddleware,
  togglePageStatus
);

router.delete("/:role/cmspages/delete/:id", adminMiddleware, deletePage);

export default router;
