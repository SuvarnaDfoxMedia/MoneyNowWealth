import express from "express";
import {
  addNewsletter,
  getNewsletters,
  getNewsletterById,
  deleteNewsletter,
} from "../controllers/newsletterController.js";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */
router.post("/newsletter", addNewsletter); // Add subscriber

/* -------------------- ADMIN ROUTES -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- PROTECTED ADMIN ENDPOINTS -------------------- */

// Get all subscribers (with pagination, filters, search)
router.get("/newsletter",  getNewsletters);

// Get one subscriber by id
router.get("/newsletter/:id", ...adminMiddleware, getNewsletterById);

// Soft delete subscriber
router.delete(
  "/:role/newsletter/delete/:id",
  ...adminMiddleware,
  deleteNewsletter
);

export default router;
