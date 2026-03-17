import express from "express";
import {
  addContactEnquiry,
  getContactEnquiries,
  softDeleteContactEnquiry,
} from "../controllers/contactEnquiryController.js";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */

// Add a new enquiry (Public)
router.post("/contact-enquiries", addContactEnquiry);

/* -------------------- ADMIN MIDDLEWARE -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- ADMIN ROUTES -------------------- */
// Get all contact enquiries (Admin only)
router.get("/:role/contact-enquiries", ...adminMiddleware, getContactEnquiries);

// Soft delete contact enquiry (Admin only)
router.delete("/:role/contact-enquiries/delete/:id", ...adminMiddleware, softDeleteContactEnquiry);

// Backward-compatible delete endpoint
router.delete("/contact-enquiries/:id", ...adminMiddleware, softDeleteContactEnquiry);

export default router;
