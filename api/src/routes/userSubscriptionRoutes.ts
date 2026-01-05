// import express from "express";
// import {
//   getUserSubscriptions,
//   getUserSubscriptionById,
//   addUserSubscription,
//   updateUserSubscription,
//   deleteUserSubscription,
//   toggleUserSubscriptionStatus,
//   restoreUserSubscription,
// } from "../controllers/userSubscriptionController";
// import { roleFromUrl } from "../middlewares/roleUrlMiddleware";

// const router = express.Router();
// const adminMiddleware = roleFromUrl(["admin"]);

// /* -------------------------------
//    Public Routes
// ---------------------------------*/
// // Get all subscriptions (for logged-in users)
// router.get("/subscriptions", getUserSubscriptions);

// // Get subscription by ID
// router.get("/subscriptions/:id", getUserSubscriptionById);

// /* -------------------------------
//    Admin Routes
// ---------------------------------*/
// // Get all subscriptions (admin view)
// router.get("/:role/subscriptions", adminMiddleware, getUserSubscriptions);

// // Create a new subscription
// router.post("/:role/subscriptions/create", adminMiddleware, addUserSubscription);

// // Update subscription by ID
// router.put("/:role/subscriptions/edit/:id", adminMiddleware, updateUserSubscription);

// // Toggle subscription status (active/inactive)
// router.patch("/:role/subscriptions/change/:id/status", adminMiddleware, toggleUserSubscriptionStatus);

// // Soft delete subscription
// router.delete("/:role/subscriptions/delete/:id", adminMiddleware, deleteUserSubscription);

// // Restore deleted subscription
// router.patch("/:role/subscriptions/:id/restore", adminMiddleware, restoreUserSubscription);

// export default router;

import express from "express";
import {
  getUserSubscriptions,
  getUserSubscriptionById,
  addUserSubscription,
  updateUserSubscription,
  deleteUserSubscription,
  toggleUserSubscriptionStatus,
  restoreUserSubscription,
} from "../controllers/userSubscriptionController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */
// Get all subscriptions (for logged-in users)
router.get("/subscriptions", getUserSubscriptions);

// Get subscription by ID
router.get("/subscriptions/:id", getUserSubscriptionById);

/* -------------------- ADMIN ROUTES -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- ADMIN VIEW -------------------- */
router.get("/:role/subscriptions", ...adminMiddleware, getUserSubscriptions);

/* -------------------- CREATE -------------------- */
router.post("/:role/subscriptions/create", ...adminMiddleware, addUserSubscription);

/* -------------------- UPDATE -------------------- */
router.put("/:role/subscriptions/edit/:id", ...adminMiddleware, updateUserSubscription);

/* -------------------- TOGGLE STATUS -------------------- */
router.patch("/:role/subscriptions/change/:id/status", ...adminMiddleware, toggleUserSubscriptionStatus);

/* -------------------- DELETE -------------------- */
router.delete("/:role/subscriptions/delete/:id", ...adminMiddleware, deleteUserSubscription);

/* -------------------- RESTORE -------------------- */
router.patch("/:role/subscriptions/:id/restore", ...adminMiddleware, restoreUserSubscription);

export default router;
