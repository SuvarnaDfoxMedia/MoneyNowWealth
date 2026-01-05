import mongoose from "mongoose";
import UserSubscriptionPayment from "@/models/userSubscriptionPaymentModel";
import UserSubscription from "@/models/userSubscriptionModel";

// Helper: Add duration to date
// -------------------------------------------------------
const addDuration = (date: Date, value: number, unit: "day" | "month" | "year") => {
  const result = new Date(date);
  switch (unit) {
    case "day":
      result.setDate(result.getDate() + value);
      break;
    case "month":
      result.setMonth(result.getMonth() + value);
      break;
    case "year":
      result.setFullYear(result.getFullYear() + value);
      break;
  }
  return result;
};

// -------------------------------------------------------
// Interfaces
// -------------------------------------------------------
interface Plan {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  currency?: string;
  duration: {
    value: number;
    unit: "day" | "month" | "year";
  };
}

interface Subscription {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  end_date?: Date;
  last_payment_id?: mongoose.Types.ObjectId;
  status?: string;
  trial_type?: string;
  plan_type?: string;
  is_active?: boolean;
  save: () => Promise<any>;
}

// -------------------------------------------------------
// SERVICE
// -------------------------------------------------------
export const userSubscriptionPaymentService = {

  // Create Payment
  async create(data: Partial<any>) {
    const payment = new UserSubscriptionPayment(data);
    return payment.save();
  },

  // Update Payment
  async update(id: string, data: Partial<any>) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return UserSubscriptionPayment.findByIdAndUpdate(id, data, { new: true });
  },

  // Get Payment by ID
  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return UserSubscriptionPayment.findById(id);
  },

  // -------------------------------------------------------
  // 🔥 MAIN FUNCTION — CREATE PAYMENT & UPDATE SUBSCRIPTION
  // -------------------------------------------------------
  async createPaymentForSubscription(
    sub: Subscription,
    plan: Plan,
    type: "new" | "upgrade" | "downgrade" = "new"
  ) {
    const isFreePlan = plan.name.toLowerCase() === "free";

    // -------------------------------
    // 1️⃣ Create Payment Entry
    // -------------------------------
    const payment = new UserSubscriptionPayment({
      user_id: sub.user_id,
      user_subscription_id: sub._id,
      plan_id: plan._id,

      amount: isFreePlan ? 0 : plan.price,
      currency: plan.currency || "INR",

      payment_method: isFreePlan ? "free_plan" : "manual",
      payment_status: "success",
      payment_date: new Date(),

      // 👇 this is IMPORTANT
      type, // new → upgrade → downgrade

      metadata: {
        note: isFreePlan ? "Free Plan Auto Assigned" : "Paid Plan",
        description: `User subscription ${type}`,
      },
    });

    await payment.save();

    // -------------------------------
    // 2️⃣ Update Subscription
    // -------------------------------
    sub.last_payment_id = payment._id;

    // Extend plan duration from end_date or today's date
    const baseDate = sub.end_date && sub.end_date > new Date() 
      ? sub.end_date 
      : new Date();

    sub.end_date = addDuration(
      baseDate,
      plan.duration.value,
      plan.duration.unit
    );

    // Setting correct status
    sub.status = type;
    sub.is_active = true;

    // Set Proper plan_type & trial_type
    if (isFreePlan) {
      sub.trial_type = "free_sample";
      sub.plan_type = "Free";
    } else {
      sub.trial_type = "premium_sample";
      sub.plan_type = "Premium";
    }

    await sub.save();

    return payment;
  },

  // -------------------------------------------------------
  // Get Latest Payment for any Subscription
  // -------------------------------------------------------
  async getLatestBySubscriptionId(user_subscription_id: string) {
    if (!mongoose.Types.ObjectId.isValid(user_subscription_id)) return null;
    return UserSubscriptionPayment.findOne({ user_subscription_id })
      .sort({ payment_date: -1 })
      .populate("plan_id", "name price duration currency")
      .lean();
  },
};
