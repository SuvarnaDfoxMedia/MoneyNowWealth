import mongoose, { Types } from "mongoose";
import type { Request, Response } from "express";
import { userSubscriptionPaymentService } from "@/services/userSubscriptionPaymentService";
import { userSubscriptionService } from "@/services/userSubscriptionService";
import SubscriptionPlanModel from "@/models/subscriptionPlan.model";
import UserSubscriptionPayment from "@/models/userSubscriptionPaymentModel";
import UserSubscription from "@/models/userSubscriptionModel";
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

    const isFreePlan = plan.name.toLowerCase() === "free";

    // Check purchase eligibility for Premium
    if (plan.name.toLowerCase() === "premium") {
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
    let subscription;
    try {
      const durationValue = plan.duration?.value || 1;
      const durationUnit = plan.duration?.unit || "month";

      // Use isUserPurchase = false for admin/system payments
      subscription = await userSubscriptionService.createOrUpdateSubscription(
        user_id,
        plan._id.toString(),
        durationValue,
        durationUnit as "day" | "month" | "year",
        isFreePlan ? "free_sample" : undefined,
        false, // isUserPurchase = false (admin/system assignment)
      );
    } catch (err: any) {
      console.error("Failed to create subscription:", err);
      return sendError(res, err.message || "Failed to create subscription", 500);
    }

    // ---------- 2. Create Payment Entry ----------
    // const payment = await UserSubscriptionPayment.create({
    //   user_id: new Types.ObjectId(user_id),
    //   plan_id: new Types.ObjectId(plan_id),
    //   user_subscription_id: subscription._id,
    //   amount: isFreePlan ? 0 : amount || plan.price || 0,
    //   currency: currency || "INR",
    //   payment_method: isFreePlan ? "free_plan" : payment_method || "system",
    //   payment_status: "success",
    //   type: type,
    //   payment_date: new Date(),
    //   metadata: {
    //     ...metadata,
    //     note: isFreePlan ? "Free plan" : "Paid plan",
    //     assigned_by: "admin",
    //   },
    // });
    const payment = await UserSubscriptionPayment.create({
      user_id: new Types.ObjectId(user_id),
      plan_id: new Types.ObjectId(plan_id),
      user_subscription_id: subscription._id,

      amount: isFreePlan ? 0 : amount || plan.price || 0,
      currency: currency || plan.currency || "INR",
      payment_method: isFreePlan ? "free_plan" : payment_method || "system",
      payment_status: "success",
      type,
      payment_date: new Date(),

      //  FIX: store invoice-valid dates
      start_date: subscription.start_date,
      end_date: subscription.end_date,

      //  optional snapshot (recommended)
      plan_snapshot: {
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        duration: plan.duration,
        features: plan.features || [],
      },

      metadata: {
        ...metadata,
        note: isFreePlan ? "Free plan" : "Paid plan",
        assigned_by: "admin",
      },
    });

    // ---------- 3. Update Subscription with Payment Reference ----------
    subscription.last_payment_id = payment._id;
    await subscription.save();

    // ---------- 4. RESPONSE ----------
    return sendSuccess(
      res,
      "Subscription payment created successfully",
      { payment, subscription },
      201,
      { payment, subscription },
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

    const isFreePlan = plan.name.toLowerCase() === "free";

    // Check purchase eligibility for Premium
    if (plan.name.toLowerCase() === "premium") {
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

    const subscription =
      await userSubscriptionService.createOrUpdateSubscription(
        userId,
        plan._id.toString(),
        durationValue,
        durationUnit as "day" | "month" | "year",
        isFreePlan ? "free_sample" : undefined,
        true, // isUserPurchase = true (user purchase)
      );

    // ---------- 2. Create Payment Entry ----------
    // const payment = await UserSubscriptionPayment.create({
    //   user_id: new Types.ObjectId(userId),
    //   plan_id: new Types.ObjectId(plan_id),
    //   user_subscription_id: subscription._id,
    //   amount: isFreePlan ? 0 : amount || plan.price || 0,
    //   currency: "INR",
    //   payment_method: isFreePlan ? "free_plan" : payment_method,
    //   payment_status: "success",
    //   type: "new",
    //   payment_date: new Date(),
    //   metadata: {
    //     note: isFreePlan ? "Free plan purchase" : "Paid plan purchase",
    //     purchased_by_user: true,
    //     is_user_purchase: true,
    //   },
    // });
    const payment = await UserSubscriptionPayment.create({
      user_id: new Types.ObjectId(userId),
      plan_id: new Types.ObjectId(plan_id),
      user_subscription_id: subscription._id,

      amount: isFreePlan ? 0 : amount || plan.price || 0,
      currency: plan.currency || "INR",
      payment_method: isFreePlan ? "free_plan" : payment_method,
      payment_status: "success",
      type: "new",
      payment_date: new Date(),

      //  FIX: store invoice-valid dates
      start_date: subscription.start_date,
      end_date: subscription.end_date,

      //  optional snapshot
      plan_snapshot: {
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        duration: plan.duration,
        features: plan.features || [],
      },

      metadata: {
        note: isFreePlan ? "Free plan purchase" : "Paid plan purchase",
        purchased_by_user: true,
        is_user_purchase: true,
      },
    });

    // ---------- 3. Update Subscription with Payment Reference ----------
    subscription.last_payment_id = payment._id;
    await subscription.save();

    return sendSuccess(
      res,
      "Subscription purchased successfully",
      { payment, subscription },
      201,
      { payment, subscription },
    );
  } catch (error: any) {
    console.error("User purchase error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

// ====================== UPDATE PAYMENT ======================
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

// ====================== GET PAYMENT BY ID ======================
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

// ====================== GET LATEST PAYMENT BY USER ======================
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

// ====================== GET MY PAYMENT HISTORY ======================
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

// ====================== GET USER SUBSCRIPTION HISTORY ======================
// export const getUserSubscriptionHistory = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { userId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({
//         message: "Invalid user ID",
//       });
//     }

//     const payments = await UserSubscriptionPayment.find({
//       user_id: new Types.ObjectId(userId),
//     })
//       .populate({
//         path: "user_subscription_id",
//         select: "status start_date end_date plan_type trial_type eligibility",
//       })
//       .populate("plan_id", "name price duration")
//       .sort({ payment_date: -1 });

//     const orderedPayments = payments.sort((a, b) => {
//       const order = { new: 0, upgrade: 1, downgrade: 2 };
//       return (
//         (order[a.type as keyof typeof order] || 99) -
//         (order[b.type as keyof typeof order] || 99)
//       );
//     });

//     return res.status(200).json({
//       success: true,
//       total: orderedPayments.length,
//       payments: orderedPayments.map((p) => {
//         const sub = p.user_subscription_id as any;
//         const plan = p.plan_id as any;

//         return {
//           _id: p._id.toString(),
//           subscriptionId: sub?._id?.toString(),
//           planName: plan?.name || "Unknown",
//           amount: p.amount,
//           currency: p.currency,
//           type: p.type,
//           trialType: sub?.trial_type,
//           status: sub?.status,
//           requiresPurchase: sub?.eligibility?.purchase_required || false,
//           startDate: sub?.start_date,
//           endDate: sub?.end_date,
//           paymentDate: p.payment_date,
//           transactionId: p.transaction_id,
//           orderId: p.order_id,
//           paymentMethod: p.payment_method,
//           paymentStatus: p.payment_status,
//         };
//       }),
//     });
//   } catch (err) {
//     console.error("Error fetching subscription history:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// ====================== GET USER SUBSCRIPTION HISTORY ======================
// export const getUserSubscriptionHistory = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { userId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({
//         message: "Invalid user ID",
//       });
//     }

//     // Get all payments for the user
//     const payments = await UserSubscriptionPayment.find({
//       user_id: new Types.ObjectId(userId),
//     })
//       .populate("plan_id", "name price duration")
//       .sort({ payment_date: -1 }); // Sort by payment date

//     // Get the user's current subscription for date calculation
//     const currentSubscription = await UserSubscription.findOne({
//       user_id: new Types.ObjectId(userId),
//       is_deleted: false,
//     });

//     // Calculate dates for each payment entry
//     const calculatedPayments = await Promise.all(
//       payments.map(async (payment, index) => {
//         const plan = payment.plan_id as any;

//         // Calculate start and end dates for THIS payment
//         let startDate: Date;
//         let endDate: Date;

//         if (index === 0) {
//           // Most recent payment - use dates from current subscription
//           if (currentSubscription) {
//             startDate = currentSubscription.start_date;
//             endDate = currentSubscription.end_date;
//           } else {
//             // Fallback: calculate based on payment date
//             startDate = payment.payment_date;
//             endDate = new Date(startDate);

//             if (plan?.duration) {
//               const { value, unit } = plan.duration;
//               switch (unit) {
//                 case "day":
//                   endDate.setDate(endDate.getDate() + value);
//                   break;
//                 case "month":
//                   endDate.setMonth(endDate.getMonth() + value);
//                   break;
//                 case "year":
//                   endDate.setFullYear(endDate.getFullYear() + value);
//                   break;
//               }
//             } else {
//               endDate.setMonth(endDate.getMonth() + 1); // Default 1 month
//             }
//           }
//         } else {
//           // Historical payments - calculate dates based on next payment's start date
//           const nextPayment = payments[index - 1]; // Since array is sorted newest to oldest
//           const nextPlan = nextPayment.plan_id as any;

//           // End date is day before next payment's start date
//           const nextPaymentStartDate = await calculatePaymentStartDate(
//             nextPayment,
//             currentSubscription,
//             nextPlan,
//           );
//           endDate = new Date(nextPaymentStartDate);
//           endDate.setDate(endDate.getDate() - 1); // Previous day

//           // Start date is end date minus plan duration
//           startDate = new Date(endDate);

//           if (plan?.duration) {
//             const { value, unit } = plan.duration;
//             switch (unit) {
//               case "day":
//                 startDate.setDate(startDate.getDate() - value);
//                 break;
//               case "month":
//                 startDate.setMonth(startDate.getMonth() - value);
//                 break;
//               case "year":
//                 startDate.setFullYear(startDate.getFullYear() - value);
//                 break;
//             }
//           } else {
//             startDate.setMonth(startDate.getMonth() - 1); // Default 1 month
//           }
//         }

//         return {
//           _id: payment._id.toString(),
//           subscriptionId: payment.user_subscription_id?.toString(),
//           planName: plan?.name || "Unknown",
//           amount: payment.amount,
//           currency: payment.currency,
//           type: payment.type,
//           paymentDate: payment.payment_date,
//           startDate: startDate,
//           endDate: endDate,
//           transactionId: payment.transaction_id,
//           orderId: payment.order_id,
//           paymentMethod: payment.payment_method,
//           paymentStatus: payment.payment_status,
//           metadata: payment.metadata,
//         };
//       }),
//     );

//     return res.status(200).json({
//       success: true,
//       total: calculatedPayments.length,
//       payments: calculatedPayments,
//     });
//   } catch (err) {
//     console.error("Error fetching subscription history:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };
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

        //  FIXED: payment dates
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

// ====================== GET INVOICE BY PAYMENT ID ======================
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

        //  FIXED: always use payment dates
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
