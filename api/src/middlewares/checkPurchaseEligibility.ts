import SubscriptionPlan from "@/models/subscriptionPlan.model";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { userSubscriptionService } from "@/services/userSubscriptionService";

export const checkPurchaseEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Skip for admin routes
    if (req.path.includes("/:role/")) return next();

    const userId = req.user?.id || req.body.user_id;

    if (!userId) return next();

    // Check if this is a Premium purchase
    const planId = req.body.plan_id;
    if (planId) {
      const plan = await SubscriptionPlan.findById(planId);
      if (plan && plan.plan_type === "Premium") {
        const eligibility =
          await userSubscriptionService.checkPurchaseEligibility(userId);

        if (!eligibility.canPurchase) {
          return res.status(403).json({
            success: false,
            message: eligibility.message,
            code: "PREMIUM_EXPIRED_REQUIRE_PURCHASE",
          });
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
