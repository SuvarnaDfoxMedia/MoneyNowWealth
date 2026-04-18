import express from "express";
import {
  addWhoWeWorkWithEnquiry,
  getWhoWeWorkWithEnquiries,
  softDeleteWhoWeWorkWithEnquiry,
} from "../controllers/whoWeWorkWithEnquiryController.js";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

const router = express.Router();
const adminMiddleware = roleFromUrl(["admin"]);

router.post("/who-we-work-with-enquiries", addWhoWeWorkWithEnquiry);
router.get(
  "/:role/who-we-work-with-enquiries",
  ...adminMiddleware,
  getWhoWeWorkWithEnquiries,
);
router.delete(
  "/:role/who-we-work-with-enquiries/delete/:id",
  ...adminMiddleware,
  softDeleteWhoWeWorkWithEnquiry,
);

export default router;
