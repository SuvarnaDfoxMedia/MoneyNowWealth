import express from "express";
import {
  getUnreadEnquiryCounts,
  markEnquiriesAsRead,
} from "../controllers/enquiryUnreadController.js";
import {
  adminProtect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/admin/enquiries/unread-counts",
  adminProtect,
  authorizeRoles("admin"),
  getUnreadEnquiryCounts,
);

router.patch(
  "/admin/enquiries/read",
  adminProtect,
  authorizeRoles("admin"),
  markEnquiriesAsRead,
);

export default router;
