import mongoose, { Types } from "mongoose";
import type { Request, Response } from "express";
import { userSubscriptionPaymentService } from "@/services/userSubscriptionPaymentService";
import { userSubscriptionService } from "@/services/userSubscriptionService";
import SubscriptionPlanModel from "@/models/subscriptionPlan.model";
import UserSubscriptionPayment from "@/models/userSubscriptionPaymentModel";
import { sendError, sendSuccess } from "../utils/apiResponse";

interface AddSubscriptionPaymentBody {
  user_id: string;
  plan_id: string;
  amount?: number;
  currency?: string;
  payment_method?: string;
  type: "new" | "upgrade" | "downgrade";
  user_subscription_id?: string | null;
  metadata?: Record<string, unknown>;
}

// ====================== CREATE PAYMENT (ADMIN/SYSTEM) ======================
export const addSubscriptionPayment = async (
  req: Request<unknown, unknown, AddSubscriptionPaymentBody>,
  res: Response,
) => {
  try {
    const {
      user_id,
      plan_id,
      amount,
      currency,
      payment_method,
      type,
      user_subscription_id,
      metadata,
    } = req.body;

    // ---------- VALIDATION ----------
    if (!user_id || !plan_id || !type) {
      return sendError(
        res,
        "Missing required fields: user_id, plan_id, type",
        400,
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(user_id) ||
      !mongoose.Types.ObjectId.isValid(plan_id)
    ) {
      return sendError(res, "Invalid ObjectId", 400);
    }

    const plan = await SubscriptionPlanModel.findById(plan_id).lean();
    if (!plan) {
      return sendError(res, "Plan not found", 400);
    }

    const isFreePlan = plan.plan_type === "Free";

    // Check purchase eligibility for Premium
    if (plan.plan_type === "Premium") {
      const eligibility =
        await userSubscriptionService.checkPurchaseEligibility(
          user_id,
          plan_id,
        );
      if (!eligibility.canPurchase) {
        return sendError(res, eligibility.message, 403, null, {
          code: eligibility.code || "PURCHASE_BLOCKED",
        });
      }
    }

    // ---------- 1. Create or Update Subscription FIRST ----------
    let result;
    try {
      const durationValue = plan.duration?.value || 1;
      const durationUnit = plan.duration?.unit || "month";

      result = await userSubscriptionService.createOrUpdateSubscriptionWithPayment(
        user_id,
        plan._id.toString(),
        durationValue,
        durationUnit as "day" | "month" | "year",
        isFreePlan ? "free_sample" : undefined,
        false,
        "system_update",
        false,
        {
          amount: isFreePlan ? 0 : amount,
          currency: currency || plan.currency || "INR",
          paymentMethod: isFreePlan
            ? "free_plan"
            : ((payment_method || "system") as "system" | "manual" | "free_plan"),
          metadata: {
            ...metadata,
            note: isFreePlan ? "Free plan" : "Paid plan",
            assigned_by: "admin",
          },
        },
      );
    } catch (err: any) {
      console.error("Failed to create subscription:", err);
      return sendError(res, err.message || "Failed to create subscription", 500);
    }

    // ---------- 4. RESPONSE ----------
    return sendSuccess(
      res,
      "Subscription payment created successfully",
      { payment: result.payment, subscription: result.subscription },
      201,
      { payment: result.payment, subscription: result.subscription },
    );
  } catch (error: any) {
    console.error("Error creating subscription payment:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

// ====================== USER PURCHASE (SELF-SERVICE) ======================
export const userPurchaseSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { plan_id, payment_method = "manual", amount } = req.body;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    if (!plan_id) {
      return sendError(res, "plan_id is required", 400);
    }

    const plan = await SubscriptionPlanModel.findById(plan_id).lean();
    if (!plan) {
      return sendError(res, "Plan not found", 400);
    }

    const isFreePlan = plan.plan_type === "Free";

    // Check purchase eligibility for Premium
    if (plan.plan_type === "Premium") {
      const eligibility =
        await userSubscriptionService.checkPurchaseEligibility(userId, plan_id);
      if (!eligibility.canPurchase) {
        return sendError(res, eligibility.message, 403, null, {
          code: eligibility.code || "PURCHASE_BLOCKED",
        });
      }
    }

    // ---------- 1. Create or Update Subscription FIRST ----------
    const durationValue = plan.duration?.value || 1;
    const durationUnit = plan.duration?.unit || "month";

    const result =
      await userSubscriptionService.createOrUpdateSubscriptionWithPayment(
        userId,
        plan._id.toString(),
        durationValue,
        durationUnit as "day" | "month" | "year",
        isFreePlan ? "free_sample" : undefined,
        true,
        "user_purchase",
        false,
        {
          amount: isFreePlan ? 0 : amount,
          currency: plan.currency || "INR",
          paymentMethod: isFreePlan
            ? "free_plan"
            : ((payment_method || "manual") as "manual" | "system" | "free_plan"),
          metadata: {
            note: isFreePlan ? "Free plan purchase" : "Paid plan purchase",
            purchased_by_user: true,
            is_user_purchase: true,
          },
        },
      );

    return sendSuccess(
      res,
      "Subscription purchased successfully",
      { payment: result.payment, subscription: result.subscription },
      201,
      { payment: result.payment, subscription: result.subscription },
    );
  } catch (error: any) {
    console.error("User purchase error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

export const updateSubscriptionPayment = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid payment ID", 400);
    }

    const updated = await userSubscriptionPaymentService.update(id, req.body);
    if (!updated) {
      return sendError(res, "Payment not found", 404);
    }

    return sendSuccess(res, "Subscription payment updated", updated);
  } catch (error: any) {
    console.error("Update payment error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

export const getSubscriptionPaymentById = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid payment ID", 400);
    }

    const payment = await UserSubscriptionPayment.findById(id)
      .populate("plan_id", "name price duration currency")
      .populate("user_id", "firstname lastname email")
      .populate("user_subscription_id", "status plan_type start_date end_date");

    if (!payment) {
      return sendError(res, "Payment not found", 404);
    }

    return sendSuccess(res, "Payment fetched successfully", payment);
  } catch (error: any) {
    console.error("Get payment error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

export const getLatestPaymentByUser = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return sendError(res, "User ID is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return sendError(res, "Invalid user ID", 400);
    }

    const latestPayment = await UserSubscriptionPayment.findOne({
      user_id: new Types.ObjectId(user_id),
    })
      .sort({ payment_date: -1 })
      .populate("plan_id", "name price")
      .populate("user_id", "firstname lastname email");

    if (!latestPayment) {
      return sendError(res, "No payments found", 404);
    }

    return sendSuccess(res, "Latest payment fetched successfully", latestPayment, 200, {
      payment: latestPayment,
    });
  } catch (err: any) {
    console.error("Get latest payment error:", err);
    return sendError(res, err.message || "Server error", 500);
  }
};

export const getMyPaymentHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    const payments = await UserSubscriptionPayment.find({
      user_id: new Types.ObjectId(userId),
    })
      .populate("plan_id", "name price duration")
      .populate("user_subscription_id", "status plan_type end_date")
      .sort({ payment_date: -1 });

    const mappedPayments = payments.map((p) => ({
        _id: p._id.toString(),
        planName: (p.plan_id as any)?.name || "Unknown",
        amount: p.amount,
        currency: p.currency,
        type: p.type,
        paymentDate: p.payment_date,
        paymentMethod: p.payment_method,
        paymentStatus: p.payment_status,
        transactionId: p.transaction_id,
        metadata: p.metadata,
      }));

    return sendSuccess(
      res,
      "Payment history fetched successfully",
      mappedPayments,
      200,
      { total: mappedPayments.length, payments: mappedPayments },
    );
  } catch (error: any) {
    console.error("Get payment history error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

//           // End date is day before next payment's start date
//           const nextPaymentStartDate = await calculatePaymentStartDate(
//             nextPayment,
//             currentSubscription,
//             nextPlan,
//           );
//           endDate = new Date(nextPaymentStartDate);
//           endDate.setDate(endDate.getDate() - 1); // Previous day

export const getUserSubscriptionHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, "Invalid user ID", 400);
    }

    const payments = await UserSubscriptionPayment.find({
      user_id: new Types.ObjectId(userId),
    })
      .populate("plan_id", "name price duration currency")
      .sort({ payment_date: -1 })
      .lean();

    const mappedPayments = payments.map((p: any) => ({
        _id: p._id.toString(),
        subscriptionId: p.user_subscription_id?.toString(),

        planName: p.plan_snapshot?.name || p.plan_id?.name || "Unknown",
        amount: p.amount,
        currency: p.currency,

        type: p.type,
        paymentDate: p.payment_date,

        startDate: p.start_date,
        endDate: p.end_date,

        transactionId: p.transaction_id,
        orderId: p.order_id,
        paymentMethod: p.payment_method,
        paymentStatus: p.payment_status,
        metadata: p.metadata,
      }));

    return sendSuccess(
      res,
      "User subscription history fetched successfully",
      mappedPayments,
      200,
      { total: mappedPayments.length, payments: mappedPayments },
    );
  } catch (err) {
    console.error("Error fetching subscription history:", err);
    return sendError(res, "Server error", 500);
  }
};

// Helper function to calculate start date for a payment
const calculatePaymentStartDate = async (
  payment: any,
  currentSubscription: any,
  plan: any,
): Promise<Date> => {
  // If this payment is linked to a subscription, use its start date
  if (payment.user_subscription_id && currentSubscription) {
    return currentSubscription.start_date;
  }

  // Otherwise calculate based on payment date
  const startDate = new Date(payment.payment_date);

  // For upgrades/downgrades, we might need to check previous payment
  if (payment.metadata?.previous_state) {
    // This is a state transition, so it likely started when the previous state ended
    // We'll use the payment date as start date
    return startDate;
  }

  return startDate;
};

export const getInvoiceByPaymentId = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return sendError(res, "Invalid payment ID", 400);
    }

    const payment = await UserSubscriptionPayment.findById(paymentId)
      .populate("plan_id", "name price duration currency")
      .populate("user_id", "firstname lastname email")
      .populate("user_subscription_id", "start_date end_date trial_type");

    if (!payment) {
      return sendError(res, "Invoice not found", 404);
    }

    const plan = payment.plan_id as any;
    const user = payment.user_id as any;
    const subscription = payment.user_subscription_id as any;

    const invoice = {
        _id: payment._id.toString(),
        invoiceId: payment._id.toString(),

        planName: plan?.name || payment.plan_snapshot?.name || "Unknown Plan",
        amount: payment.amount,
        currency: payment.currency,
        paymentDate: payment.payment_date,

        transactionId: payment.transaction_id,
        orderId: payment.order_id,
        type: payment.type,
        paymentMethod: payment.payment_method,
        paymentStatus: payment.payment_status,

        user: {
          firstname: user?.firstname || "",
          lastname: user?.lastname || "",
          email: user?.email || "",
        },

        validity: {
          startDate: payment.start_date || payment.payment_date,
          endDate: payment.end_date || payment.payment_date,
        },
      };

    return sendSuccess(res, "Invoice fetched successfully", invoice, 200, {
      invoice,
    });
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return sendError(res, "Server error", 500);
  }
};
