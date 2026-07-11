import type { Request, Response } from "express";
import User from "@/models/userModel";
import SubscriptionPlan from "@/models/subscriptionPlan.model";
import { userSubscriptionService } from "@/services/userSubscriptionService";
import { userSubscriptionPaymentService } from "@/services/userSubscriptionPaymentService";
import { sendError, sendSuccess } from "../utils/apiResponse";

export const getUserSubscriptions = async (req: Request, res: Response) => {
  try {
    const result = await userSubscriptionService.getAll(req.query);
    return sendSuccess(res, "Subscriptions fetched successfully", result, 200, {
      ...result,
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return sendError(res, "Internal server error", 500);
  }
};

export const getUserSubscriptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let subscription = await userSubscriptionService.getById(id);
    if (!subscription) {
      return sendError(res, "Subscription not found", 404);
    }

    const recordUserId = (subscription.user_id as any)?._id
      ? (subscription.user_id as any)._id.toString()
      : subscription.user_id.toString();

    if (
      (req as any).user?.role !== "admin" &&
      (req as any).user?.role !== "editor" &&
      recordUserId !== (req as any).user?.id
    ) {
      return sendError(res, "Access denied", 403);
    }

    const payment =
      await userSubscriptionPaymentService.getLatestBySubscriptionId(
        subscription._id.toString(),
      );

    return sendSuccess(
      res,
      "Subscription fetched successfully",
      { subscription, payment },
    );
  } catch (error) {
    console.error("Get subscription by ID error:", error);
    return sendError(res, "Internal server error", 500);
  }
};

export const addUserSubscription = async (req: Request, res: Response) => {
  try {
    const { user_id, plan_id, trial_type } = req.body;

    if (!user_id || !plan_id) {
      return sendError(res, "user_id and plan_id are required", 400);
    }

    const planDoc = await SubscriptionPlan.findById(plan_id);
    if (!planDoc) {
      return sendError(res, "Invalid plan_id", 400);
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

    return sendSuccess(res, "Subscription created successfully", subscription, 201, {
      subscription,
    });
  } catch (error: any) {
    console.error("Create subscription error:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

export const updateUserSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = await userSubscriptionService.update(id, req.body);
    if (!subscription) {
      return sendError(res, "Subscription not found", 404);
    }

    return sendSuccess(res, "Subscription updated successfully", subscription, 200, {
      subscription,
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    return sendError(res, "Internal server error", 500);
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
      return sendError(res, "Subscription not found", 404);
    }

    return sendSuccess(
      res,
      subscription.is_active
        ? "Subscription activated successfully"
        : "Subscription deactivated successfully",
      subscription,
      200,
      { subscription },
    );
  } catch (error) {
    console.error("Toggle subscription status error:", error);
    return sendError(res, "Internal server error", 500);
  }
};

export const deleteUserSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = await userSubscriptionService.softDelete(id);

    if (!subscription) {
      return sendError(res, "Subscription not found", 404);
    }

    return sendSuccess(
      res,
      "Subscription soft deleted successfully",
      subscription,
      200,
      { subscription },
    );
  } catch (error) {
    console.error("Delete subscription error:", error);
    return sendError(res, "Internal server error", 500);
  }
};

export const restoreUserSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = await userSubscriptionService.restore(id);
    if (!subscription) {
      return sendError(res, "Subscription not found", 404);
    }

    return sendSuccess(
      res,
      "Subscription restored successfully",
      subscription,
      200,
      { subscription },
    );
  } catch (error) {
    console.error("Restore subscription error:", error);
    return sendError(res, "Internal server error", 500);
  }
};

export const assignUserSubscription = async (req: Request, res: Response) => {
  try {
    const { user_id, plan_id, plan_name, duration_days, reason } = req.body;

    if (!user_id || (!plan_id && !plan_name)) {
      return sendError(res, "user_id and either plan_id or plan_name are required", 400);
    }

    const user = await User.findById(user_id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const normalizedPlanName =
      typeof plan_name === "string" ? plan_name.trim() : "";

    let plan = null;

    if (plan_id) {
      plan = await SubscriptionPlan.findOne({
        _id: plan_id,
        is_active: true,
        is_deleted: false,
      });
    }

    if (!plan && normalizedPlanName) {
      plan = await SubscriptionPlan.findOne({
        name: normalizedPlanName,
        is_active: true,
        is_deleted: false,
      });
    }

    if (!plan && normalizedPlanName) {
      const normalizedType = normalizedPlanName.toLowerCase();
      if (normalizedType === "free" || normalizedType === "premium") {
        plan = await SubscriptionPlan.findOne({
          plan_type: normalizedType === "free" ? "Free" : "Premium",
          is_active: true,
          is_deleted: false,
        });
      }
    }

    if (!plan) {
      return sendError(res, "Plan not found", 404);
    }

    const durationValue = duration_days || plan.duration.value;
    const durationUnit = duration_days ? "day" : plan.duration.unit;

    const subscription =
      await userSubscriptionService.createOrUpdateSubscription(
        user_id,
        plan._id.toString(),
        durationValue,
        durationUnit as "day" | "month" | "year",
        plan.plan_type === "Free" ? "free_sample" : "premium_sample",
        false,
        "manual_assign",
      );

    return sendSuccess(
      res,
      "Subscription assigned successfully",
      subscription,
      201,
      { subscription, reason: reason || "Manual assignment" },
    );
  } catch (error) {
    console.error("Assign subscription error:", error);
    return sendError(res, "Internal server error", 500);
  }
};

export const getMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    const subscription = await userSubscriptionService.getByUserId(userId);

    if (!subscription) {
      return sendError(res, "No active subscription found", 404);
    }

    const paymentHistory =
      await userSubscriptionService.getPaymentHistory(userId);

    const canGetPremiumTrial = !subscription.promotional_trial_used;
    const isPremium = subscription.canAccessPremiumContent();

    return sendSuccess(
      res,
      "Subscription fetched successfully",
      { subscription, paymentHistory, canGetPremiumTrial, isPremium }
    );
  } catch (error) {
    console.error("Get my subscription error:", error);
    return sendError(res, "Internal server error", 500);
  }
};



export const upgradeMySubscriptionToPremiumTrial = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    const subscription =
      await userSubscriptionService.upgradeUserToPremiumTrial(userId);

    return sendSuccess(
      res,
      "Premium trial activated successfully",
      { subscription }
    );
  } catch (error: any) {
    console.error("Upgrade to premium trial error:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

export const getMySubscriptionHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    const subscription = await userSubscriptionService.getByUserId(userId);

    if (!subscription) {
      return sendError(res, "No subscription found", 404);
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

    return sendSuccess(
      res,
      "Subscription history fetched successfully",
      {
        current_subscription: {
          plan: subscription.plan_type,
          status: subscription.status,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          is_promotional: subscription.is_promotional,
        },
        history,
      },
      200,
      {
        current_subscription: {
          plan: subscription.plan_type,
          status: subscription.status,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          is_promotional: subscription.is_promotional,
        },
        history,
      },
    );
  } catch (error) {
    console.error("Get subscription history error:", error);
    return sendError(res, "Internal server error", 500);
  }
};
