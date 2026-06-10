import express from "express";
import {
  getUserSubscriptions,
  getUserSubscriptionById,
  addUserSubscription,
  updateUserSubscription,
  deleteUserSubscription,
  toggleUserSubscriptionStatus,
  restoreUserSubscription,
  assignUserSubscription,
  getMySubscription,
  purchaseSubscription,
  upgradeMySubscriptionToPremiumTrial,
  getMySubscriptionHistory,
} from "../controllers/userSubscriptionController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import { adminProtect, userProtect } from "../middlewares/authMiddleware";
import { getUserSubscriptionHistory } from "@/controllers/userSubscriptionPaymentController";

const router = express.Router();

/* -------------------- USER ROUTES (Authenticated) -------------------- */
router.get("/subscriptions/me", userProtect, getMySubscription);
router.get("/subscriptions/me/history", userProtect, getMySubscriptionHistory);
router.post("/subscriptions/purchase", userProtect, purchaseSubscription);
router.post(
  "/subscriptions/upgrade-premium-trial",
  userProtect,
  upgradeMySubscriptionToPremiumTrial,
);
router.get("/subscriptions/:id", getUserSubscriptionById);

/* -------------------- ADMIN ROUTES -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- ADMIN VIEW -------------------- */
router.get(
  "/:role/subscriptions/:id",
  adminProtect,
  adminMiddleware,
  getUserSubscriptionById,
);

router.get(
  "/:role/subscriptions",
  adminProtect,
  adminMiddleware,
  getUserSubscriptions,
);

router.get(
  "/:role/subscriptions/user/:userId/history",
  adminProtect,
  adminMiddleware,
  getUserSubscriptionHistory,
);

/* -------------------- CREATE -------------------- */
router.post(
  "/:role/subscriptions/create",
  adminProtect,
  adminMiddleware,
  addUserSubscription,
);

/* -------------------- MANUAL ASSIGNMENT -------------------- */
router.post(
  "/:role/subscriptions/assign",
  adminProtect,
  adminMiddleware,
  assignUserSubscription,
);

/* -------------------- UPDATE -------------------- */
router.put(
  "/:role/subscriptions/edit/:id",
  adminProtect,
  adminMiddleware,
  updateUserSubscription,
);

/* -------------------- TOGGLE STATUS -------------------- */
router.patch(
  "/:role/subscriptions/change/:id/status",
  adminProtect,
  adminMiddleware,
  toggleUserSubscriptionStatus,
);

/* -------------------- DELETE -------------------- */
router.delete(
  "/:role/subscriptions/delete/:id",
  adminProtect,
  adminMiddleware,
  deleteUserSubscription,
);

/* -------------------- RESTORE -------------------- */
router.patch(
  "/:role/subscriptions/:id/restore",
  adminProtect,
  adminMiddleware,
  restoreUserSubscription,
);

export default router;
