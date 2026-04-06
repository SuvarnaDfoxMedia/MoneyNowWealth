import express from "express";
import {
  addOneCroreJourneyEnquiry,
  getOneCroreJourneyEnquiries,
  softDeleteOneCroreJourneyEnquiry,
} from "../controllers/oneCroreJourneyEnquiryController.js";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

const router = express.Router();
const adminMiddleware = roleFromUrl(["admin"]);

router.post("/one-crore-journey-enquiries", addOneCroreJourneyEnquiry);
router.get(
  "/:role/one-crore-journey-enquiries",
  ...adminMiddleware,
  getOneCroreJourneyEnquiries,
);
router.delete(
  "/:role/one-crore-journey-enquiries/delete/:id",
  ...adminMiddleware,
  softDeleteOneCroreJourneyEnquiry,
);

export default router;
