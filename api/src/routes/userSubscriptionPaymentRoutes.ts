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
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

/* -------------------- USER ROUTES (Authenticated) -------------------- */
router.post(
  "/subscription-payment/purchase",
  protect,
  userPurchaseSubscription,
);
router.get("/subscription-payment/history/me", protect, getMyPaymentHistory);
router.get("/subscription-payment/:id", getSubscriptionPaymentById);
router.get("/subscription-payment/invoice/:paymentId", getInvoiceByPaymentId);
router.get("/subscription-payment/history/:userId", getUserSubscriptionHistory);

/* -------------------- ADMIN ROUTES -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- CREATE -------------------- */
router.post(
  "/:role/subscription-payment/create",
  protect,
  adminMiddleware,
  addSubscriptionPayment,
);

/* -------------------- UPDATE -------------------- */
router.put(
  "/:role/subscription-payment/edit/:id",
  protect,
  adminMiddleware,
  updateSubscriptionPayment,
);

/* -------------------- GET LATEST PAYMENT -------------------- */
router.get(
  "/:role/subscription-payment/user/:user_id/latest",
  protect,
  adminMiddleware,
  getLatestPaymentByUser,
);

export default router;
