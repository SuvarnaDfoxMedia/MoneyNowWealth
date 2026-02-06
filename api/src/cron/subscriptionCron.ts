// import cron from "node-cron";
// import mongoose from "mongoose";
// import UserSubscription from "../models/userSubscriptionModel";
// import SubscriptionPlan from "../models/subscriptionPlan.model";
// import User from "../models/userModel";
// import UserSubscriptionPayment from "@/models/userSubscriptionPaymentModel";
// import { emailService } from "@/emails/emailService";
// import {
//   getMidnight,
//   getTomorrowMidnight,
//   isCreated24HoursAgo,
// } from "@/utils/dateUtils";

// export const startSubscriptionScheduler = async () => {
//   console.log(" Subscription scheduler running:", new Date().toISOString());

//   const now = new Date();
//   const todayMidnight = getMidnight(now);
//   const tomorrowMidnight = getTomorrowMidnight();

//   // ========== PART 1: Downgrade Expired Premium Trials ==========
//   console.log(" Checking for expired Premium subscriptions to downgrade...");

//   const expiredPremiumSubscriptions = await UserSubscription.find({
//     is_deleted: false,
//     is_active: true,
//     plan_type: "Premium",
//     end_date: { $lt: todayMidnight },
//   }).populate("user_id", "firstname email");

//   console.log(
//     ` Found ${expiredPremiumSubscriptions.length} expired Premium subscriptions`,
//   );

//   for (const sub of expiredPremiumSubscriptions) {
//     try {
//       const user = sub.user_id as any;

//       const freePlan = await SubscriptionPlan.findOne({
//         name: "Free",
//         is_active: true,
//         is_deleted: false,
//       });

//       if (!freePlan) continue;

//       const freeEndDate = getTomorrowMidnight();

//       sub.plan_type = "Free";
//       sub.plan_id = freePlan._id;
//       sub.trial_type = "free_sample";
//       sub.start_date = todayMidnight;
//       sub.end_date = freeEndDate;
//       sub.is_promotional = false;
//       sub.promotional_trial_used = true;
//       sub.eligibility.can_purchase_premium = true;
//       sub.eligibility.last_premium_expiry_date = sub.end_date;
//       sub.eligibility.purchase_required = true;

//       sub.history.push({
//         plan_type: "Premium→Free",
//         status: "downgrade",
//         changed_at: now,
//         reason: "promotional_expired",
//       });

//       await sub.save();

//       const payment = await UserSubscriptionPayment.create({
//         user_id: sub.user_id,
//         plan_id: freePlan._id,
//         user_subscription_id: sub._id,
//         amount: 0,
//         currency: "INR",
//         payment_method: "system",
//         payment_status: "success",
//         type: "downgrade",
//         payment_date: now,
//         metadata: {
//           reason: "automatic_downgrade_on_expiry",
//           previous_plan: "Premium",
//           new_plan: "Free",
//           was_promotional: true,
//         },
//       });

//       sub.last_payment_id = payment._id;
//       await sub.save();

//       if (user.email) {
//         //  Send subscription expired email
//         await emailService.subscriptionExpired(user.email, {
//           userName: user.firstname || "User",
//           planName: "Premium",
//           startDate: sub.start_date, // Use original start date
//           endDate: sub.end_date, // Use original expiry date
//         });

//         //  Send subscription activated email for Free plan
//         await emailService.subscriptionActivated(user.email, {
//           userName: user.firstname || "User",
//           planName: "Free",
//           startDate: todayMidnight,
//           endDate: freeEndDate,
//           planPrice: 0,
//           status: "downgrade",
//           isPromotional: false,
//         });
//       }
//     } catch (err) {
//       console.error(` Failed to process expired subscription:`, err);
//     }
//   }

//   // ========== PART 2: Give Promotional Trials ==========
//   console.log("\n Checking for new users eligible for Premium trial...");

//   const premiumPlan = await SubscriptionPlan.findOne({
//     name: "Premium",
//     is_active: true,
//     is_deleted: false,
//   });

//   if (premiumPlan) {
//     // Get users created more than 24 hours ago
//     const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

//     const users = await User.find({
//       created_at: { $lt: twentyFourHoursAgo },
//       role: "user",
//     }).select("firstname email created_at");

//     console.log(
//       ` Found ${users.length} users created more than 24 hours ago`,
//     );

//     for (const user of users) {
//       try {
//         const subscription = await UserSubscription.findOne({
//           user_id: user._id,
//           is_deleted: false,
//           promotional_trial_used: false,
//           plan_type: "Free",
//         });

//         if (!subscription) continue;

//         console.log(` Giving promotional trial to user: ${user.email}`);

//         subscription.plan_id = premiumPlan._id;
//         subscription.plan_type = "Premium";
//         subscription.trial_type = "premium_sample";
//         subscription.is_promotional = true;
//         subscription.start_date = todayMidnight;
//         subscription.end_date = tomorrowMidnight;
//         subscription.updated_at = now;

//         subscription.history.push({
//           plan_type: "Free→Premium",
//           status: "upgrade",
//           changed_at: now,
//           reason: "promotional_trial",
//         });

//         await subscription.save();

//         const payment = await UserSubscriptionPayment.create({
//           user_id: user._id,
//           plan_id: premiumPlan._id,
//           user_subscription_id: subscription._id,
//           amount: 0,
//           currency: "INR",
//           payment_method: "system",
//           payment_status: "success",
//           type: "upgrade",
//           payment_date: now,
//           metadata: {
//             reason: "promotional_trial",
//             is_promotional: true,
//             trial_duration_days: 1,
//           },
//         });

//         subscription.last_payment_id = payment._id;
//         await subscription.save();

//         if (user.email) {
//           //  Send trial upgraded email
//           await emailService.trialUpgraded(user.email, {
//             userName: user.firstname || "User",
//             endDate: tomorrowMidnight,
//             isPromotional: true,
//             features: [
//               "Access to Premium content",
//               "Ad-free experience",
//               "Exclusive investment insights",
//               "Priority customer support",
//             ],
//           });
//         }

//         console.log(
//           ` Promotional trial given to ${user.email} (expires: ${tomorrowMidnight})`,
//         );
//       } catch (err) {
//         console.error(` Failed to give promotional trial to user:`, err);
//       }
//     }
//   }

//   // ========== PART 3: Send Reminder Emails ==========
//   console.log("\n Sending reminder emails...");

//   const expiringSubscriptions = await UserSubscription.find({
//     is_active: true,
//     is_deleted: false,
//     plan_type: "Premium",
//     end_date: { $gte: todayMidnight, $lte: tomorrowMidnight },
//   }).populate("user_id", "firstname email");

//   console.log(
//     ` Found ${expiringSubscriptions.length} subscriptions expiring soon`,
//   );

//   for (const sub of expiringSubscriptions) {
//     const user = sub.user_id as any;
//     if (user?.email) {
//       const hoursRemaining = Math.ceil(
//         (sub.end_date.getTime() - now.getTime()) / (1000 * 60 * 60),
//       );

//       try {
//         //  Send subscription reminder email
//         await emailService.subscriptionReminder(user.email, {
//           userName: user.firstname || "User",
//           planName: "Premium",
//           endDate: sub.end_date,
//           hoursRemaining: hoursRemaining,
//           daysRemaining: Math.ceil(hoursRemaining / 24),
//           isPromotional: sub.is_promotional,
//         });

//         console.log(
//           ` Reminder sent to ${user.email} (${hoursRemaining} hours remaining)`,
//         );
//       } catch (err) {
//         console.error(` Failed to send reminder to ${user.email}:`, err);
//       }
//     }
//   }

//   console.log(` Sent ${expiringSubscriptions.length} reminder emails`);
//   console.log("\n Subscription scheduler completed");
// };

// // Schedule cron job to run daily at midnight
// cron.schedule(
//   "0 0 * * *",
//   async () => {
//     try {
//       console.log(" Running subscription cron job at midnight...");
//       await startSubscriptionScheduler();
//     } catch (err) {
//       console.error(" Subscription cron failed:", err);
//     }
//   },
//   { timezone: "Asia/Kolkata" },
// );

// console.log(" Subscription cron scheduled (running daily at midnight IST)");

import cron from "node-cron";
import UserSubscription from "../models/userSubscriptionModel";
import SubscriptionPlan from "../models/subscriptionPlan.model";
import User from "../models/userModel";
import UserSubscriptionPayment from "@/models/userSubscriptionPaymentModel";
import { emailService } from "@/emails/emailService";
import { addDurationToDate, getMidnight } from "@/utils/dateUtils";

export const startSubscriptionScheduler = async () => {
  console.log(" Subscription scheduler running:", new Date().toISOString());

  const now = new Date();
  const todayMidnight = getMidnight(now);

  //  Load plans once (use name instead of plan_type)
  const freePlan = await SubscriptionPlan.findOne({
    name: { $regex: /^free$/i },
    is_active: true,
    is_deleted: false,
  });

  const premiumPlan = await SubscriptionPlan.findOne({
    name: { $regex: /^premium$/i },
    is_active: true,
    is_deleted: false,
  });

  if (!freePlan) {
    console.log(" Free plan not found. Scheduler stopped.");
    return;
  }

  if (!freePlan.duration?.value || !freePlan.duration?.unit) {
    console.log(" Free plan duration missing. Scheduler stopped.");
    return;
  }

  if (
    premiumPlan &&
    (!premiumPlan.duration?.value || !premiumPlan.duration?.unit)
  ) {
    console.log(" Premium plan duration missing. Promo trial will be skipped.");
  }

  // ========== PART 1: Expire & Downgrade Premium (Promo + Paid) ==========
  console.log(" Checking for expired Premium subscriptions...");

  const expiredPremiumSubscriptions = await UserSubscription.find({
    is_deleted: false,
    is_active: true,
    plan_type: "Premium",
    end_date: { $lt: todayMidnight },
  }).populate("user_id", "firstname email");

  console.log(
    ` Found ${expiredPremiumSubscriptions.length} expired Premium subscriptions`,
  );

  for (const sub of expiredPremiumSubscriptions) {
    try {
      const user = sub.user_id as any;

      //  store premium expiry BEFORE overwriting end_date
      const premiumExpiredAt = new Date(sub.end_date);
      const wasPromotional = sub.is_promotional === true;

      // Free plan new end date based on Free plan duration
      const freeStartDate = todayMidnight;
      const freeEndDate = addDurationToDate(
        freeStartDate,
        freePlan.duration.value,
        freePlan.duration.unit,
      );

      // Downgrade to Free
      sub.plan_type = "Free";
      sub.plan_id = freePlan._id;
      sub.trial_type = "free_sample";
      sub.start_date = freeStartDate;
      sub.end_date = freeEndDate;
      sub.status = "active";
      sub.is_active = true;

      // Reset current promotional status
      sub.is_promotional = false;

      // eligibility safe init
      sub.eligibility = sub.eligibility ?? {
        can_purchase_premium: true,
        last_premium_expiry_date: null,
        purchase_required: false,
      };

      sub.eligibility.last_premium_expiry_date = premiumExpiredAt;
      sub.eligibility.purchase_required = wasPromotional;
      sub.eligibility.can_purchase_premium = true;

      if (wasPromotional) {
        sub.promotional_trial_used = true;
      }

      sub.history = sub.history || [];
      sub.history.push({
        plan_type: "Premium→Free",
        status: "downgrade",
        changed_at: now,
        reason: wasPromotional ? "promotional_expired" : "paid_premium_expired",
      });

      await sub.save();

      //  IMPORTANT: store start/end dates in payment
      const payment = await UserSubscriptionPayment.create({
        user_id: sub.user_id,
        plan_id: freePlan._id,
        user_subscription_id: sub._id,

        start_date: freeStartDate,
        end_date: freeEndDate,

        amount: 0,
        currency: "INR",
        payment_method: "system",
        payment_status: "success",
        type: "downgrade",
        payment_date: now,
        metadata: {
          reason: "automatic_downgrade_on_expiry",
          previous_plan: "Premium",
          new_plan: "Free",
          was_promotional: wasPromotional,
          premium_expired_at: premiumExpiredAt,
        },
      });

      sub.last_payment_id = payment._id;
      await sub.save();

      // Emails
      if (user?.email) {
        await emailService.subscriptionExpired(user.email, {
          userName: user.firstname || "User",
          planName: "Premium",
          startDate: sub.start_date,
          endDate: premiumExpiredAt,
        });

        await emailService.subscriptionActivated(user.email, {
          userName: user.firstname || "User",
          planName: "Free",
          startDate: freeStartDate,
          endDate: freeEndDate,
          planPrice: 0,
          status: "downgrade",
          isPromotional: false,
        });
      }

      console.log(
        ` Downgraded ${user?.email || sub.user_id} to Free (Premium expired: ${premiumExpiredAt.toISOString()})`,
      );
    } catch (err) {
      console.error(` Failed to process expired subscription:`, err);
    }
  }

  // ========== PART 2: Give Promotional Trial to eligible users ==========
  console.log("\n Checking for new users eligible for Premium trial...");

  if (premiumPlan && premiumPlan.is_active && !premiumPlan.is_deleted) {
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const users = await User.find({
      created_at: { $lt: twentyFourHoursAgo },
      role: "user",
    }).select("firstname email created_at");

    console.log(` Found ${users.length} users created more than 24 hours ago`);

    for (const user of users) {
      try {
        const subscription = await UserSubscription.findOne({
          user_id: user._id,
          is_deleted: false,
          is_active: true,
          plan_type: "Free",
        });

        if (!subscription) continue;

        subscription.eligibility = subscription.eligibility ?? {
          can_purchase_premium: true,
          last_premium_expiry_date: null,
          purchase_required: false,
        };

        const promoUsed = subscription.promotional_trial_used === true;

        if (promoUsed) continue;

        if (!premiumPlan.duration?.value || !premiumPlan.duration?.unit)
          continue;

        const promoStartDate = todayMidnight;
        const promoEndDate = addDurationToDate(
          promoStartDate,
          premiumPlan.duration.value,
          premiumPlan.duration.unit,
        );

        subscription.plan_id = premiumPlan._id;
        subscription.plan_type = "Premium";
        subscription.trial_type = "premium_sample";
        subscription.is_promotional = true;

        subscription.promotional_trial_used = true;

        subscription.start_date = promoStartDate;
        subscription.end_date = promoEndDate;
        subscription.status = "active";

        subscription.eligibility.purchase_required = false;
        subscription.eligibility.can_purchase_premium = true;

        subscription.history = subscription.history || [];
        subscription.history.push({
          plan_type: "Free→Premium",
          status: "upgrade",
          changed_at: now,
          reason: "promotional_trial",
        });

        await subscription.save();

        //  IMPORTANT: store start/end dates in payment
        const payment = await UserSubscriptionPayment.create({
          user_id: user._id,
          plan_id: premiumPlan._id,
          user_subscription_id: subscription._id,

          start_date: promoStartDate,
          end_date: promoEndDate,

          amount: 0,
          currency: "INR",
          payment_method: "system",
          payment_status: "success",
          type: "upgrade",
          payment_date: now,
          metadata: {
            reason: "promotional_trial",
            is_promotional: true,
            duration: `${premiumPlan.duration.value} ${premiumPlan.duration.unit}(s)`,
          },
        });

        subscription.last_payment_id = payment._id;
        await subscription.save();

        if (user.email) {
          await emailService.trialUpgraded(user.email, {
            userName: user.firstname || "User",
            endDate: promoEndDate,
            isPromotional: true,
            features: [
              "Access to Premium content",
              "Ad-free experience",
              "Exclusive investment insights",
              "Priority customer support",
            ],
          });
        }

        console.log(
          ` Promotional trial given to ${user.email} (expires: ${promoEndDate.toISOString()})`,
        );
      } catch (err) {
        console.error(` Failed to give promotional trial to user:`, err);
      }
    }
  }

  // ========== PART 3: Reminder emails ==========
  console.log("\n Sending reminder emails...");

  const tomorrowMidnight = addDurationToDate(todayMidnight, 1, "day");

  const expiringSubscriptions = await UserSubscription.find({
    is_active: true,
    is_deleted: false,
    plan_type: "Premium",
    end_date: { $gte: todayMidnight, $lt: tomorrowMidnight },
  }).populate("user_id", "firstname email");

  console.log(
    ` Found ${expiringSubscriptions.length} subscriptions expiring soon`,
  );

  for (const sub of expiringSubscriptions) {
    const user = sub.user_id as any;
    if (user?.email) {
      const hoursRemaining = Math.ceil(
        (sub.end_date.getTime() - now.getTime()) / (1000 * 60 * 60),
      );

      try {
        await emailService.subscriptionReminder(user.email, {
          userName: user.firstname || "User",
          planName: "Premium",
          endDate: sub.end_date,
          hoursRemaining,
          daysRemaining: Math.ceil(hoursRemaining / 24),
          isPromotional: sub.is_promotional,
        });

        console.log(
          ` Reminder sent to ${user.email} (${hoursRemaining} hours remaining)`,
        );
      } catch (err) {
        console.error(` Failed to send reminder to ${user.email}:`, err);
      }
    }
  }

  console.log("\n Subscription scheduler completed");
};

// Run daily midnight IST
cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      console.log(" Running subscription cron job at midnight...");
      await startSubscriptionScheduler();
    } catch (err) {
      console.error(" Subscription cron failed:", err);
    }
  },
  { timezone: "Asia/Kolkata" },
);

console.log(" Subscription cron scheduled (running daily at midnight IST)");
