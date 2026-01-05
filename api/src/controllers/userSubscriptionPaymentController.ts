import mongoose, { Types } from "mongoose";
import type { Request, Response } from "express";

import { userSubscriptionPaymentService } from "@/services/userSubscriptionPaymentService";
import { userSubscriptionService } from "@/services/userSubscriptionService";
import SubscriptionPlanModel from "@/models/subscriptionPlan.model";
import UserSubscriptionPayment from "@/models/userSubscriptionPaymentModel";
import UserSubscription, { IUserSubscription } from "@/models/userSubscriptionModel";


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

export const addSubscriptionPayment = async (
  req: Request<unknown, unknown, AddSubscriptionPaymentBody>,
  res: Response
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
    if (!user_id || !plan_id || !type)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    if (
      !mongoose.Types.ObjectId.isValid(user_id) ||
      !mongoose.Types.ObjectId.isValid(plan_id) ||
      (user_subscription_id && !mongoose.Types.ObjectId.isValid(user_subscription_id))
    )
      return res.status(400).json({ success: false, message: "Invalid ObjectId" });

    const plan = await SubscriptionPlanModel.findById(plan_id).lean();
    if (!plan) return res.status(400).json({ success: false, message: "Plan not found" });

    const isFreePlan = String(plan.name).toLowerCase() === "free";

    // ---------- 1️⃣ Create Payment ----------
    const payment = await userSubscriptionPaymentService.create({
      user_id: new Types.ObjectId(user_id),
      plan_id: new Types.ObjectId(plan_id),
      user_subscription_id: user_subscription_id ? new Types.ObjectId(user_subscription_id) : null,
      amount: isFreePlan ? 0 : amount ?? 0,
      currency: currency || "INR",
      payment_method: isFreePlan ? "free_plan" : payment_method || "manual",
      type,
      metadata: metadata || { note: isFreePlan ? "Free plan" : "Paid plan" },
      payment_date: new Date(),
      payment_status: "success",
    });

    // ---------- 2️⃣ Create or Update Subscription ----------
    let subscription: IUserSubscription | null = null;
    try {
      const durationValue = plan.duration?.value ?? 1;
      const durationUnit = plan.duration?.unit ?? "month";

      subscription = await userSubscriptionService.createOrUpdateSubscription(
        user_id,
        plan._id.toString(),
        durationValue,
        durationUnit,
        isFreePlan ? "free_sample" : undefined
      );

      // ✅ Type-safe assignment of ObjectId
      payment.user_subscription_id = subscription._id as Types.ObjectId;
      await payment.save();
    } catch (err) {
      console.error("Failed to update subscription:", err);
    }

    // ---------- 3️⃣ RESPONSE ----------
    return res.status(201).json({
      success: true,
      message: "Subscription payment created successfully",
      payment,
      subscription,
    });
  } catch (error: any) {
    console.error("Error creating subscription payment:", error);
    return res.status(500).json({ success: false, message: error?.message || "Server error" });
  }
};

export const updateSubscriptionPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid payment ID" });

    const updated = await userSubscriptionPaymentService.update(id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: "Payment not found" });

    return res.json({ success: true, message: "Subscription payment updated", data: updated });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, message: error?.message || "Server error" });
  }
};

export const getSubscriptionPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid payment ID" });

    const payment = await userSubscriptionPaymentService.getById(id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const populatedPayment = await UserSubscriptionPayment.populate(payment, {
      path: "plan_id",
      select: "name price duration currency",
    });

    return res.json({ success: true, message: "Payment fetched", data: populatedPayment });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, message: error?.message || "Server error" });
  }
};

export const getLatestPaymentByUser = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    if (!user_id)
      return res.status(400).json({ success: false, message: "User ID is required" });

    const latestPayment = await UserSubscriptionPayment.find({ user_id: new Types.ObjectId(user_id) })
      .sort({ payment_date: -1 }) // latest first
      .limit(1)
      .populate("plan_id") // plan details
      .populate("user_id"); // user details

    if (!latestPayment.length)
      return res.status(404).json({ success: false, message: "No payments found" });

    return res.status(200).json({ success: true, payment: latestPayment[0] });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};


export const getUserSubscriptionHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const payments = await UserSubscriptionPayment.find({ user_id: userId })
      .populate([
        { path: "user_subscription_id", select: "status start_date end_date plan_type trial_type" },
        { path: "plan_id", select: "name price duration" }
      ])
      .sort({ payment_date: 1 });

    const orderedPayments = payments.sort((a, b) => {
      const order = { new: 0, upgrade: 1, downgrade: 2 };
      return (order[a.type as keyof typeof order] || 99) - (order[b.type as keyof typeof order] || 99);
    });

    return res.status(200).json({
      success: true,
      total: orderedPayments.length,
      payments: orderedPayments.map((p) => {
        // Cast via unknown first
        const sub = p.user_subscription_id as unknown as IUserSubscription;
        const plan = p.plan_id as unknown as { name: string; price: number; duration: any };

        return {
          subscriptionId: sub?._id,
          planName: plan?.name,
          amount: p.amount,
          currency: p.currency,
          type: p.type, // new | upgrade | downgrade
          trialType: sub?.trial_type,
          status: sub?.status,
          startDate: sub?.start_date,
          endDate: sub?.end_date,
          paymentDate: p.payment_date,
          transactionId: p.transaction_id,
          orderId: p.order_id,
        };
      }),
    });
  } catch (err) {
    console.error("Error fetching subscription history:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


