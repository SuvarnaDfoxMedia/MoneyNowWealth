import type { Request, Response } from "express";
import User from "@/models/userModel";
import SubscriptionPlan from "@/models/subscriptionPlan.model";
import { userSubscriptionService } from "@/services/userSubscriptionService";
import { userSubscriptionPaymentService } from "@/services/userSubscriptionPaymentService";

export const getUserSubscriptions = async (req: Request, res: Response) => {
  try {
    const result = await userSubscriptionService.getAll(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getUserSubscriptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let subscription = await userSubscriptionService.getById(id);
    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    const payment =
      await userSubscriptionPaymentService.getLatestBySubscriptionId(
        subscription._id.toString(),
      );

    return res.json({
      success: true,
      subscription,
      payment,
    });
  } catch (error) {
    console.error("Get subscription by ID error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const addUserSubscription = async (req: Request, res: Response) => {
  try {
    const { user_id, plan_id, trial_type } = req.body;

    if (!user_id || !plan_id) {
      return res.status(400).json({
        success: false,
        message: "user_id and plan_id are required",
      });
    }

    const planDoc = await SubscriptionPlan.findById(plan_id);
    if (!planDoc) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plan_id" });
    }

    const subscription =
      await userSubscriptionService.createOrUpdateSubscription(
        user_id,
        planDoc._id.toString(),
        planDoc.duration.value,
        planDoc.duration.unit as "day" | "month" | "year",
        trial_type,
        false,
        "manual_assign",
      );

    return res.status(201).json({ success: true, subscription });
  } catch (error: any) {
    console.error("Create subscription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const updateUserSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = await userSubscriptionService.update(id, req.body);
    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    return res.json({ success: true, subscription });
  } catch (error) {
    console.error("Update subscription error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const toggleUserSubscriptionStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const subscription = await userSubscriptionService.toggleActiveStatus(id);
    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    return res.json({
      success: true,
      message: subscription.is_active
        ? "Subscription activated successfully"
        : "Subscription deactivated successfully",
      subscription,
    });
  } catch (error) {
    console.error("Toggle subscription status error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const deleteUserSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = await userSubscriptionService.softDelete(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.json({
      success: true,
      message: "Subscription soft deleted successfully",
      subscription,
    });
  } catch (error) {
    console.error("Delete subscription error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const restoreUserSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = await userSubscriptionService.restore(id);
    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    return res.json({
      success: true,
      message: "Subscription restored successfully",
      subscription,
    });
  } catch (error) {
    console.error("Restore subscription error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const assignUserSubscription = async (req: Request, res: Response) => {
  try {
    const { user_id, plan_name, duration_days, reason } = req.body;

    if (!user_id || !plan_name) {
      return res.status(400).json({
        success: false,
        message: "user_id and plan_name are required",
      });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const plan = await SubscriptionPlan.findOne({
      name: plan_name,
      is_active: true,
      is_deleted: false,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    if (plan_name === "Premium" && plan.price === 0) {
      const existingSub = await userSubscriptionService.getByUserId(user_id);
      if (existingSub?.promotional_trial_used) {
        return res.status(400).json({
          success: false,
          message:
            "User has already used promotional trial. Assign a paid Premium plan instead.",
          code: "TRIAL_ALREADY_USED",
        });
      }
    }

    const durationValue = duration_days || plan.duration.value;
    const durationUnit = duration_days ? "day" : plan.duration.unit;

    const subscription =
      await userSubscriptionService.createOrUpdateSubscription(
        user_id,
        plan._id.toString(),
        durationValue,
        durationUnit as "day" | "month" | "year",
        plan.name.toLowerCase() === "free" ? "free_sample" : "premium_sample",
        false,
        "manual_assign",
      );

    return res.status(201).json({
      success: true,
      message: "Subscription assigned successfully",
      subscription,
      reason: reason || "Manual assignment",
    });
  } catch (error) {
    console.error("Assign subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const subscription = await userSubscriptionService.getByUserId(userId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    const paymentHistory =
      await userSubscriptionService.getPaymentHistory(userId);

    return res.json({
      success: true,
      subscription,
      paymentHistory,
    });
  } catch (error) {
    console.error("Get my subscription error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const purchaseSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { plan_id } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: "plan_id is required",
      });
    }

    const planDoc = await SubscriptionPlan.findById(plan_id);
    if (!planDoc) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plan_id" });
    }

    const eligibility = await userSubscriptionService.checkPurchaseEligibility(
      userId,
      plan_id,
    );
    if (!eligibility.canPurchase) {
      return res.status(403).json({
        success: false,
        message: eligibility.message,
        code: eligibility.code || "PURCHASE_BLOCKED",
      });
    }

    const subscription =
      await userSubscriptionService.createOrUpdateSubscription(
        userId,
        planDoc._id.toString(),
        planDoc.duration.value,
        planDoc.duration.unit as "day" | "month" | "year",
        planDoc.name.toLowerCase() === "free" ? "free_sample" : undefined,
        true,
        "user_purchase",
      );

    return res.status(201).json({
      success: true,
      message: "Subscription purchased successfully",
      subscription,
    });
  } catch (error: any) {
    console.error("Purchase subscription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getMySubscriptionHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const subscription = await userSubscriptionService.getByUserId(userId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    const paymentHistory =
      await userSubscriptionService.getPaymentHistory(userId);

    const history = paymentHistory.map((payment: any) => ({
      payment_id: payment._id,
      date: payment.payment_date,
      plan: payment.plan_id?.name || "Unknown",
      amount: payment.amount,
      type: payment.type,
      method: payment.payment_method,
      status: payment.payment_status,
      is_promotional: payment.metadata?.is_promotional || false,
    }));

    return res.json({
      success: true,
      current_subscription: {
        plan: subscription.plan_type,
        status: subscription.status,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        is_promotional: subscription.is_promotional,
      },
      history,
    });
  } catch (error) {
    console.error("Get subscription history error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
