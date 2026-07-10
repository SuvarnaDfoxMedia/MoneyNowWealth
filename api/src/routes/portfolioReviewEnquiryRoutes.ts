import express from "express";
import {
  addPortfolioReviewEnquiry,
  getPortfolioReviewEnquiries,
  softDeletePortfolioReviewEnquiry,
} from "../controllers/portfolioReviewEnquiryController.js";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

const router = express.Router();
const adminMiddleware = roleFromUrl(["admin"]);

router.post("/portfolio-review-enquiries", addPortfolioReviewEnquiry);
router.get(
  "/:role/portfolio-review-enquiries",
  ...adminMiddleware,
  getPortfolioReviewEnquiries,
);
router.delete(
  "/:role/portfolio-review-enquiries/delete/:id",
  ...adminMiddleware,
  softDeletePortfolioReviewEnquiry,
);

export default router;
