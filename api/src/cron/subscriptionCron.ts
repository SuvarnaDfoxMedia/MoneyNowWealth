import cron from "node-cron";
import mongoose from "mongoose";
import UserSubscription from "../models/userSubscriptionModel";
import SubscriptionPlan from "../models/subscriptionPlan.model";
import { userSubscriptionService } from "@/services/userSubscriptionService";
import { userSubscriptionPaymentService } from "@/services/userSubscriptionPaymentService";

// -----------------------------
// Typed Subscription for Payment
// -----------------------------
interface SubscriptionForPayment {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  plan_id?: mongoose.Types.ObjectId;
  end_date?: Date;
  last_payment_id?: mongoose.Types.ObjectId;
  status?: string;
  trial_type?: string;
  is_active?: boolean;
  save: () => Promise<any>;
}

// -----------------------------
// Subscription Scheduler
// -----------------------------
export const startSubscriptionScheduler = async () => {
  console.log("Subscription scheduler running:", new Date().toISOString());

  const now = new Date();

  // Fetch active & non-deleted subscriptions
  const activeSubs = await UserSubscription.find({
    is_deleted: false,
    is_active: true,
  });

  for (const sub of activeSubs) {
    // Skip if subscription is still valid
    if (sub.end_date && sub.end_date > now) continue;

    console.log(`Subscription expired for user: ${sub.user_id}`);

    // Deactivate old subscription
    sub.is_active = false;
    await sub.save();

    let newPlan;
    let status: "upgrade" | "downgrade";

    // Determine downgrade / upgrade
    if (sub.plan_type === "Free") {
      newPlan = await SubscriptionPlan.findOne({
        name: "Premium",
        is_active: true,
      });
      status = "upgrade";
    } else if (sub.plan_type === "Premium") {
      newPlan = await SubscriptionPlan.findOne({
        name: "Free",
        is_active: true,
      });
      status = "downgrade";
    } else {
      continue;
    }

    if (!newPlan) {
      console.warn(`No valid plan found for user: ${sub.user_id}`);
      continue;
    }

    try {
      const trialType =
        newPlan.name.toLowerCase() === "free"
          ? "free_sample"
          : "premium_sample";

      // Create / Update subscription
      const newSub = await userSubscriptionService.createOrUpdateSubscription(
        sub.user_id.toString(),
        newPlan._id.toString(),
        newPlan.duration.value,
        newPlan.duration.unit,
        trialType,
        status
      );

      /**
       * IMPORTANT:
       * Cron-triggered payments are SYSTEM payments.
       * No transaction_id or order_id should be generated.
       */
      const subForPayment = newSub as unknown as SubscriptionForPayment;

      await userSubscriptionPaymentService.createPaymentForSubscription(
        subForPayment,
        newPlan,
        status // service will internally set payment_method = "system"
      );

      console.log(
        `Auto ${status} subscription & payment created for user: ${sub.user_id}`
      );
    } catch (err) {
      console.error(
        `Failed to auto ${status} subscription for user: ${sub.user_id}`,
        err
      );
    }
  }
};

// -----------------------------
// Cron job: Runs every day at 12:00 AM
// -----------------------------
cron.schedule("0 0 * * *", async () => {
  try {
    await startSubscriptionScheduler();
  } catch (err) {
    console.error("Subscription cron failed:", err);
  }
});
