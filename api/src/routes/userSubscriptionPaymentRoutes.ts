

import express from "express";
import {
  addSubscriptionPayment,
  updateSubscriptionPayment,
  getSubscriptionPaymentById,
  getLatestPaymentByUser,
  getUserSubscriptionHistory
} from "../controllers/userSubscriptionPaymentController";

import { roleFromUrl } from "../middlewares/roleUrlMiddleware";

const router = express.Router();

// Get a specific subscription payment by ID
router.get("/subscription-payment/:id", getSubscriptionPaymentById);

router.get("/subscription/:subscription_id/payments", getSubscriptionPaymentById);

router.get("/subscription-payment/history/:userId", getUserSubscriptionHistory);

/* -------------------- ADMIN ROUTES -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- CREATE -------------------- */
router.post(
  "/:role/subscription-payment/create",
  ...adminMiddleware,
  addSubscriptionPayment
);

/* -------------------- UPDATE -------------------- */
router.put(
  "/:role/subscription-payment/edit/:id",
  ...adminMiddleware,
  updateSubscriptionPayment
);

// GET latest payment by user ID
router.get("/:role/subscription-payment/user/:user_id/latest",   ...adminMiddleware,
 getLatestPaymentByUser);


export default router;


