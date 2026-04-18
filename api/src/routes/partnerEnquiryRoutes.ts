import express from "express";
import {
  addPartnerEnquiry,
  getPartnerEnquiries,
  getPartnerEnquiryById,
  softDeletePartnerEnquiry,
  updatePartnerEnquiryStatus,
} from "../controllers/partnerEnquiryController.js";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

const router = express.Router();

router.post("/partner-enquiries", addPartnerEnquiry);

const adminMiddleware = roleFromUrl(["admin"]);

router.get(
  "/:role/partner-enquiries",
  ...adminMiddleware,
  getPartnerEnquiries,
);

router.get(
  "/:role/partner-enquiries/:id",
  ...adminMiddleware,
  getPartnerEnquiryById,
);

router.patch(
  "/:role/partner-enquiries/status/:id",
  ...adminMiddleware,
  updatePartnerEnquiryStatus,
);

router.delete(
  "/:role/partner-enquiries/delete/:id",
  ...adminMiddleware,
  softDeletePartnerEnquiry,
);

export default router;
