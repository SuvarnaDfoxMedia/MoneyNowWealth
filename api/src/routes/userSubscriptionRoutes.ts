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
router.post(
  "/subscriptions/upgrade-premium-trial",
  userProtect,
  upgradeMySubscriptionToPremiumTrial,
);
router.get("/subscriptions/:id", userProtect, getUserSubscriptionById);

/* -------------------- ADMIN ROUTES -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- ADMIN VIEW -------------------- */
router.get(
  "/:role/subscriptions/:id",
  ...adminMiddleware,
  getUserSubscriptionById,
);

router.get(
  "/:role/subscriptions",
  ...adminMiddleware,
  getUserSubscriptions,
);

router.get(
  "/:role/subscriptions/user/:userId/history",
  ...adminMiddleware,
  getUserSubscriptionHistory,
);

/* -------------------- CREATE -------------------- */
router.post(
  "/:role/subscriptions/create",
  ...adminMiddleware,
  addUserSubscription,
);

/* -------------------- MANUAL ASSIGNMENT -------------------- */
router.post(
  "/:role/subscriptions/assign",
  ...adminMiddleware,
  assignUserSubscription,
);

/* -------------------- UPDATE -------------------- */
router.put(
  "/:role/subscriptions/edit/:id",
  ...adminMiddleware,
  updateUserSubscription,
);

/* -------------------- TOGGLE STATUS -------------------- */
router.patch(
  "/:role/subscriptions/change/:id/status",
  ...adminMiddleware,
  toggleUserSubscriptionStatus,
);

/* -------------------- DELETE -------------------- */
router.delete(
  "/:role/subscriptions/delete/:id",
  ...adminMiddleware,
  deleteUserSubscription,
);

/* -------------------- RESTORE -------------------- */
router.patch(
  "/:role/subscriptions/:id/restore",
  ...adminMiddleware,
  restoreUserSubscription,
);

export default router;
