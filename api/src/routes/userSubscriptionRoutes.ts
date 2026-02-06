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
  getMySubscriptionHistory,
} from "../controllers/userSubscriptionController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import { protect } from "../middlewares/authMiddleware";
import { getUserSubscriptionHistory } from "@/controllers/userSubscriptionPaymentController";

const router = express.Router();

/* -------------------- USER ROUTES (Authenticated) -------------------- */
router.get("/subscriptions/me", protect, getMySubscription);
router.get("/subscriptions/me/history", protect, getMySubscriptionHistory);
router.post("/subscriptions/purchase", protect, purchaseSubscription);
router.get("/subscriptions/:id", getUserSubscriptionById);

/* -------------------- ADMIN ROUTES -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- ADMIN VIEW -------------------- */
router.get(
  "/:role/subscriptions/:id",
  protect,
  adminMiddleware,
  getUserSubscriptionById,
);

router.get(
  "/:role/subscriptions",
  protect,
  adminMiddleware,
  getUserSubscriptions,
);

router.get(
  "/:role/subscriptions/user/:userId/history",
  protect,
  adminMiddleware,
  getUserSubscriptionHistory,
);

/* -------------------- CREATE -------------------- */
router.post(
  "/:role/subscriptions/create",
  protect,
  adminMiddleware,
  addUserSubscription,
);

/* -------------------- MANUAL ASSIGNMENT -------------------- */
router.post(
  "/:role/subscriptions/assign",
  protect,
  adminMiddleware,
  assignUserSubscription,
);

/* -------------------- UPDATE -------------------- */
router.put(
  "/:role/subscriptions/edit/:id",
  protect,
  adminMiddleware,
  updateUserSubscription,
);

/* -------------------- TOGGLE STATUS -------------------- */
router.patch(
  "/:role/subscriptions/change/:id/status",
  protect,
  adminMiddleware,
  toggleUserSubscriptionStatus,
);

/* -------------------- DELETE -------------------- */
router.delete(
  "/:role/subscriptions/delete/:id",
  protect,
  adminMiddleware,
  deleteUserSubscription,
);

/* -------------------- RESTORE -------------------- */
router.patch(
  "/:role/subscriptions/:id/restore",
  protect,
  adminMiddleware,
  restoreUserSubscription,
);

export default router;
