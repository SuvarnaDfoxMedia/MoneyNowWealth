import cron from "node-cron";
import { emailService } from "@/emails/emailService";
import { PREMIUM_EXPIRY_REMINDER_DAYS } from "@/config/subscription";
import UserSubscription from "../models/userSubscriptionModel";
import { userSubscriptionService } from "../services/userSubscriptionService";
import { getMidnight, getRemainingDaysInclusive } from "@/utils/dateUtils";

export const startSubscriptionScheduler = async () => {
  console.log(" Subscription scheduler running:", new Date().toISOString());

  const now = new Date();
  const todayMidnight = getMidnight(now);

  console.log(" Checking for expired premium subscriptions...");

  const expiredSubscriptions = await UserSubscription.find({
    is_deleted: false,
    is_active: true,
    status: "active",
    plan_type: "Premium",
    end_date: { $lt: todayMidnight },
  }).populate("user_id", "firstname email");

  console.log(
    ` Found ${expiredSubscriptions.length} expired premium subscriptions`,
  );

  const processedUsers = new Set<string>();

  for (const sub of expiredSubscriptions) {
    try {
      const user = sub.user_id as any;
      const userId = user?._id?.toString?.() || sub.user_id?.toString();

      if (!userId || processedUsers.has(userId)) {
        continue;
      }

      processedUsers.add(userId);

      const transitionedSubscription =
        await userSubscriptionService.applyExpiredPremiumDowngrade(
          sub._id.toString(),
          now,
        );

      if (transitionedSubscription) {
        console.log("CRON TRANSITION", {
          userId,
          oldPlan: "Premium",
          newPlan: "Free",
          startDate: transitionedSubscription.start_date,
          endDate: transitionedSubscription.end_date,
        });
      }
    } catch (err) {
      console.error(" Failed to process expired subscription:", err);
    }
  }

  console.log("\n Sending reminder emails...");

  const expiringSubscriptions = await UserSubscription.find({
    is_active: true,
    is_deleted: false,
    status: "active",
    plan_type: "Premium",
    end_date: { $gte: todayMidnight },
  }).populate("user_id", "firstname email");

  console.log(
    ` Found ${expiringSubscriptions.length} active premium subscriptions`,
  );

  for (const sub of expiringSubscriptions) {
    try {
      const user = sub.user_id as any;
      if (!user?.email) {
        continue;
      }

      const daysRemaining = getRemainingDaysInclusive(
        sub.end_date,
        todayMidnight,
      );

      if (!PREMIUM_EXPIRY_REMINDER_DAYS.includes(daysRemaining as any)) {
        continue;
      }

      if (userSubscriptionService.hasExpiryReminderBeenSent(sub, daysRemaining)) {
        continue;
      }

      const sent = await emailService.sendSubscriptionExpiryReminder(
        user.email,
        {
          userName: user.firstname || "User",
          planName: sub.plan_type,
          endDate: sub.end_date,
          daysRemaining,
          isPromotional: sub.is_promotional === true,
        },
      );

      if (!sent) {
        console.log(
          ` Subscription reminder failed for ${user.email} (${daysRemaining} days remaining)`,
        );
        continue;
      }

      await userSubscriptionService.markExpiryReminderSent(
        sub._id.toString(),
        daysRemaining,
      );

      console.log(
        ` Subscription reminder sent to ${user.email} (${daysRemaining} days remaining)`,
      );
    } catch (err) {
      console.error(" Failed to process subscription reminder:", err);
    }
  }

  console.log("\n Subscription scheduler completed");
};

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
