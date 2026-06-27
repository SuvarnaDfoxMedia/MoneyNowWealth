import express from "express";
import {
  addSubscriptionPayment,
  updateSubscriptionPayment,
  getSubscriptionPaymentById,
  getLatestPaymentByUser,
  getUserSubscriptionHistory,
  getInvoiceByPaymentId,
  userPurchaseSubscription,
  getMyPaymentHistory,
} from "../controllers/userSubscriptionPaymentController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import { adminProtect, userProtect } from "../middlewares/authMiddleware";

const router = express.Router();

/* -------------------- USER ROUTES (Authenticated) -------------------- */
router.post(
  "/subscription-payment/purchase",
  userProtect,
  userPurchaseSubscription,
);
router.get("/subscription-payment/history/me", userProtect, getMyPaymentHistory);
router.get("/subscription-payment/:id", userProtect, getSubscriptionPaymentById);
router.get("/subscription-payment/invoice/:paymentId", userProtect, getInvoiceByPaymentId);
router.get("/subscription-payment/history/:userId", userProtect, getUserSubscriptionHistory);

/* -------------------- ADMIN ROUTES -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- CREATE -------------------- */
router.post(
  "/:role/subscription-payment/create",
  ...adminMiddleware,
  addSubscriptionPayment,
);

/* -------------------- UPDATE -------------------- */
router.put(
  "/:role/subscription-payment/edit/:id",
  ...adminMiddleware,
  updateSubscriptionPayment,
);

/* -------------------- GET LATEST PAYMENT -------------------- */
router.get(
  "/:role/subscription-payment/user/:user_id/latest",
  ...adminMiddleware,
  getLatestPaymentByUser,
);

export default router;
