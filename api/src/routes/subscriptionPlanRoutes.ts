
import express from "express";
import {
  getSubscriptionPlans,
  getSubscriptionPlanById,
  addSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  toggleSubscriptionPlanStatus,
} from "../controllers/subscriptionPlanController.js";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */
router.get("/subscription-plan", getSubscriptionPlans); // List all subscription plans
router.get("/subscription-plan/:id", getSubscriptionPlanById); // Get single plan

/* -------------------- ADMIN / EDITOR ROUTES -------------------- */
const adminEditorMiddleware = roleFromUrl(["admin"]);

/* -------------------- CREATE -------------------- */
router.post(
  "/:role/subscription-plan/create",
  ...adminEditorMiddleware,
  addSubscriptionPlan
);

/* -------------------- UPDATE -------------------- */
router.put(
  "/:role/subscription-plan/edit/:id",
  ...adminEditorMiddleware,
  updateSubscriptionPlan
);

/* -------------------- TOGGLE STATUS -------------------- */
// For admin/editor routes
router.patch(
  "/:role/subscription-plan/toggle-status/:id",
  ...adminEditorMiddleware,
  toggleSubscriptionPlanStatus
);

// Optional: for public/non-role routes
router.patch(
  "/subscription-plan/toggle-status/:id",
  toggleSubscriptionPlanStatus
);


/* -------------------- DELETE -------------------- */
router.delete(
  "/:role/subscription-plan/delete/:id",
  ...adminEditorMiddleware,
  deleteSubscriptionPlan
);

export default router;
