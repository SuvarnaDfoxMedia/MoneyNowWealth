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

// const router = express.Router();

// // -------------------- PUBLIC ROUTES --------------------
// // List all subscription plans
// router.get("/subscription-plan", getSubscriptionPlans);
// // Get single subscription plan by ID
// router.get("/subscription-plan/:id", getSubscriptionPlanById);

// // -------------------- ADMIN / EDITOR ROUTES --------------------
// const adminEditorMiddleware = roleFromUrl(["admin"]);

// // Create a new subscription plan
// router.post("/:role/subscription-plan/create", adminEditorMiddleware, addSubscriptionPlan);

// // Update an existing subscription plan
// router.put("/:role/subscription-plan/edit/:id", adminEditorMiddleware, updateSubscriptionPlan);

// // Toggle subscription plan status (active/inactive)
// router.patch("/:role/subscription-plan/change/:id/status", adminEditorMiddleware, toggleSubscriptionPlanStatus);

// // Delete subscription plan (soft delete)
// router.delete("/:role/subscription-plan/delete/:id", adminEditorMiddleware, deleteSubscriptionPlan);

// export default router;


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
