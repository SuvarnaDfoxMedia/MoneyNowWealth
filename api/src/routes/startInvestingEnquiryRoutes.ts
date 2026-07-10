import express from "express";
import {
  addStartInvestingEnquiry,
  getStartInvestingEnquiries,
  softDeleteStartInvestingEnquiry,
} from "../controllers/startInvestingEnquiryController.js";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

const router = express.Router();
const adminMiddleware = roleFromUrl(["admin"]);

router.post("/start-investing-enquiries", addStartInvestingEnquiry);
router.get(
  "/:role/start-investing-enquiries",
  ...adminMiddleware,
  getStartInvestingEnquiries,
);
router.delete(
  "/:role/start-investing-enquiries/delete/:id",
  ...adminMiddleware,
  softDeleteStartInvestingEnquiry,
);

export default router;
