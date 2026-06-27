import express from "express";
import {
  submitAssessment,
  getAssessments,
  getAssessmentById,
  deleteAssessment,
  restoreAssessment,
  toggleContactedStatus,
} from "../controllers/financialAssessmentController";

import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import { adminProtect } from "../middlewares/authMiddleware";

const router = express.Router();

/* ============================================
   PUBLIC ROUTES (USER SIDE)
============================================ */

/* ---------------------------------------------------
   1. Submit Financial Assessment (Lead + Result)
--------------------------------------------------- */
router.post("/financial-assessment", submitAssessment);

/* ---------------------------------------------------
   2. Get Single Assessment (Optional)
--------------------------------------------------- */
router.get("/:role/financial-assessment/:id", ...roleFromUrl(["admin", "editor"]), getAssessmentById);

/* ============================================
   ADMIN ROUTES (LEAD MANAGEMENT)
============================================ */

// Helper for admin middleware
const applyAdminMiddleware = (handler: any) => {
  return [...roleFromUrl(["admin"]), handler];
};

/* ---------------------------------------------------
   ADMIN: Get all assessments (Leads)
--------------------------------------------------- */
router.get(
  "/:role/financial-assessments",
  ...applyAdminMiddleware(getAssessments),
);

/* ---------------------------------------------------
   ADMIN: Get single assessment
--------------------------------------------------- */
router.get(
  "/:role/financial-assessments/:id",
  ...applyAdminMiddleware(getAssessmentById),
);

/* ---------------------------------------------------
   ADMIN: Mark lead as contacted
--------------------------------------------------- */
router.patch(
  "/:role/financial-assessments/contacted/:id",
  ...applyAdminMiddleware(toggleContactedStatus),
);

/* ---------------------------------------------------
   ADMIN: Soft delete lead
--------------------------------------------------- */
router.delete(
  "/:role/financial-assessments/delete/:id",
  ...applyAdminMiddleware(deleteAssessment),
);

/* ---------------------------------------------------
   ADMIN: Restore deleted lead
--------------------------------------------------- */
router.patch(
  "/:role/financial-assessments/restore/:id",
  ...applyAdminMiddleware(restoreAssessment),
);

export default router;
