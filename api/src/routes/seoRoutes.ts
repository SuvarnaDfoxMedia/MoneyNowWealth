import express from "express";
import {
  createSeoEntry,
  deleteSeoEntry,
  getSeoEntries,
  getSeoEntryById,
  resolveSeoByPath,
  toggleSeoStatus,
  updateSeoEntry,
} from "../controllers/seoController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";

const router = express.Router();
const adminMiddleware = roleFromUrl(["admin"]);

router.get("/seo/resolve", resolveSeoByPath);

router.get("/:role/seo", adminMiddleware, getSeoEntries);
router.get("/:role/seo/:id", adminMiddleware, getSeoEntryById);
router.post("/:role/seo/create", adminMiddleware, createSeoEntry);
router.put("/:role/seo/edit/:id", adminMiddleware, updateSeoEntry);
router.patch("/:role/seo/toggle-status/:id", adminMiddleware, toggleSeoStatus);
router.delete("/:role/seo/delete/:id", adminMiddleware, deleteSeoEntry);

export default router;
