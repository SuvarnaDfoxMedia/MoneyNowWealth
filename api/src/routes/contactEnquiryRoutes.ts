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
router.get("/:role/contact-enquiries", getContactEnquiries);

// Soft delete contact enquiry (Admin only)
router.delete("/contact-enquiries/:id", softDeleteContactEnquiry);

export default router;
