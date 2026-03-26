// import express from "express";
// import {
//   getSubscriptionPlans,
//   getSubscriptionPlanById,
//   addSubscriptionPlan,
//   updateSubscriptionPlan,
//   deleteSubscriptionPlan,
//   toggleSubscriptionPlanStatus,
// } from "../controllers/subscriptionPlanController.js";
// import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

// /* -------------------- CREATE -------------------- */
// router.post(
//   "/:role/subscription-plan/create",
//   ...adminEditorMiddleware,
//   addSubscriptionPlan
// );

// /* -------------------- UPDATE -------------------- */
// router.put(
//   "/:role/subscription-plan/edit/:id",
//   ...adminEditorMiddleware,
//   updateSubscriptionPlan
// );

// /* -------------------- TOGGLE STATUS -------------------- */
// // For admin/editor routes
// router.patch(
//   "/:role/subscription-plan/toggle-status/:id",
//   ...adminEditorMiddleware,
//   toggleSubscriptionPlanStatus
// );

// /* -------------------- DELETE -------------------- */
// router.delete(
//   "/:role/subscription-plan/delete/:id",
//   ...adminEditorMiddleware,
//   deleteSubscriptionPlan
// );

import express from "express";
import {
  getSubscriptionPlans,
  getSubscriptionPlanById,
  addSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  toggleSubscriptionPlanStatus,
} from "../controllers/subscriptionPlanController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */
router.get("/subscription-plan", getSubscriptionPlans);
router.get("/subscription-plan/:id", getSubscriptionPlanById);

/* -------------------- PROTECTED ROUTES -------------------- */
const adminEditorMiddleware = roleFromUrl(["admin"]);

/* -------------------- CREATE -------------------- */

router.get("/:role/subscription-plan", getSubscriptionPlans);
router.get("/:role/subscription-plan/:id", getSubscriptionPlanById);

router.post(
  "/:role/subscription-plan/create",
  protect,
  adminEditorMiddleware,
  addSubscriptionPlan,
);

/* -------------------- UPDATE -------------------- */
router.put(
  "/:role/subscription-plan/edit/:id",
  protect,
  adminEditorMiddleware,
  updateSubscriptionPlan,
);

/* -------------------- TOGGLE STATUS -------------------- */
router.patch(
  "/:role/subscription-plan/toggle-status/:id",
  protect,
  adminEditorMiddleware,
  toggleSubscriptionPlanStatus,
);

/* -------------------- DELETE -------------------- */
router.delete(
  "/:role/subscription-plan/delete/:id",
  protect,
  adminEditorMiddleware,
  deleteSubscriptionPlan,
);

export default router;
