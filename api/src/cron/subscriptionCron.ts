
// import cron from "node-cron";
// import mongoose from "mongoose";
// import { userSubscriptionService } from "@/services/userSubscriptionService";

// import UserSubscription from "../models/userSubscriptionModel";
// import SubscriptionPlan from "../models/subscriptionPlan.model";
// import { userSubscriptionPaymentService } from "@/services/userSubscriptionPaymentService";

// // -----------------------------
// // Helper: Add Duration to Date
// // -----------------------------
// const addDuration = (date: Date, value: number, unit: "day" | "month" | "year") => {
//   const result = new Date(date);
//   switch (unit) {
//     case "day":
//       result.setDate(result.getDate() + value);
//       break;
//     case "month":
//       result.setMonth(result.getMonth() + value);
//       break;
//     case "year":
//       result.setFullYear(result.getFullYear() + value);
//       break;
//   }
//   return result;
// };

// // -----------------------------
// // Typed Subscription for Payment
// // -----------------------------
// interface SubscriptionForPayment {
//   _id: mongoose.Types.ObjectId;
//   user_id: mongoose.Types.ObjectId;
//   end_date?: Date;
//   last_payment_id?: mongoose.Types.ObjectId;
//   status?: string;
//   trial_type?: string;
//   is_active?: boolean;
//   save: () => Promise<any>;
// }

// // -----------------------------
// // Subscription Scheduler
// // -----------------------------
// export const startSubscriptionScheduler = async () => {
//   console.log("Subscription scheduler running:", new Date().toISOString());

//   const activeSubs = await UserSubscription.find({ is_deleted: false });

//   for (const sub of activeSubs) {
//     const now = new Date();

//     // Skip if already inactive or not expired
//     if (!sub.is_active) continue;
//     if (sub.end_date && sub.end_date > now) continue;

//     console.log(`Subscription expired for user: ${sub.user_id}`);

//     // Mark current subscription as inactive
//     sub.is_active = false;
//     await sub.save();

//     // Determine new plan
//     let newPlan;
//     let status: "upgrade" | "downgrade";

//     if (sub.plan_type === "Free") {
//       newPlan = await SubscriptionPlan.findOne({ name: "Premium", is_active: true });
//       status = "upgrade";
//     } else if (sub.plan_type === "Premium") {
//       newPlan = await SubscriptionPlan.findOne({ name: "Free", is_active: true });
//       status = "downgrade";
//     }

//     if (!newPlan) continue; // Skip if no valid plan found

//     try {
//       // -----------------------------
//       // -----------------------------
//       const trialType = newPlan.name.toLowerCase() === "free" ? "free_sample" : "premium_sample";

//       const newSub = await userSubscriptionService.createOrUpdateSubscription(
//         sub.user_id.toString(),
//         newPlan._id.toString(),
//         newPlan.duration.value,
//         newPlan.duration.unit,
//         trialType,
//         status // status is explicitly passed
//       );

//       // Cast to proper type for payment service
//       const subForPayment = newSub as unknown as SubscriptionForPayment;

//       // Create payment for new subscription
//       await userSubscriptionPaymentService.createPaymentForSubscription(
//         subForPayment,
//         newPlan,
//         status
//       );

//       console.log(`Created ${status} subscription for user: ${sub.user_id}`);
//     } catch (err) {
//       console.error(`Failed to create ${status} subscription for user: ${sub.user_id}`, err);
//     }
//   }
// };

// // -----------------------------
// // Cron job: Every day at midnight
// // -----------------------------
// cron.schedule("0 0 * * *", async () => {
//   try {
//     await startSubscriptionScheduler();
//   } catch (err) {
//     console.error("Error running subscription scheduler:", err);
//   }
// });



import cron from "node-cron";
import mongoose from "mongoose";
import UserSubscription from "../models/userSubscriptionModel";
import SubscriptionPlan from "../models/subscriptionPlan.model";
import { userSubscriptionService } from "@/services/userSubscriptionService";
import { userSubscriptionPaymentService } from "@/services/userSubscriptionPaymentService";

// -----------------------------
// Helper: Add Duration to Date
// -----------------------------
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

  // Get all active, non-deleted subscriptions
  const activeSubs = await UserSubscription.find({ is_deleted: false, is_active: true });

  for (const sub of activeSubs) {
    // Skip if subscription is still valid
    if (sub.end_date && sub.end_date > now) continue;

    console.log(`Subscription expired for user: ${sub.user_id}`);

    // Mark current subscription as inactive
    sub.is_active = false;
    await sub.save();

    // Determine new plan & status
    let newPlan;
    let status: "upgrade" | "downgrade";

    if (sub.plan_type === "Free") {
      newPlan = await SubscriptionPlan.findOne({ name: "Premium", is_active: true });
      status = "upgrade";
    } else if (sub.plan_type === "Premium") {
      newPlan = await SubscriptionPlan.findOne({ name: "Free", is_active: true });
      status = "downgrade";
    }

    if (!newPlan) {
      console.warn(`No valid plan found for user: ${sub.user_id}, skipping.`);
      continue;
    }

    try {
      const trialType =
        newPlan.name.toLowerCase() === "free" ? "free_sample" : "premium_sample";

      // Create or update subscription for user
      const newSub = await userSubscriptionService.createOrUpdateSubscription(
        sub.user_id.toString(),
        newPlan._id.toString(),
        newPlan.duration.value,
        newPlan.duration.unit,
        trialType,
        status // Pass explicit status
      );

      // Cast to correct type for payment service
      const subForPayment = newSub as unknown as SubscriptionForPayment;

      // Create payment record
      await userSubscriptionPaymentService.createPaymentForSubscription(
        subForPayment,
        newPlan,
        status
      );

      console.log(`Created ${status} subscription for user: ${sub.user_id}`);
    } catch (err) {
      console.error(
        `Failed to create ${status} subscription for user: ${sub.user_id}`,
        err
      );
    }
  }
};

// -----------------------------
// Cron job: Every day at midnight
// -----------------------------
cron.schedule("0 0 * * *", async () => {
  try {
    await startSubscriptionScheduler();
  } catch (err) {
    console.error("Error running subscription scheduler:", err);
  }
});
