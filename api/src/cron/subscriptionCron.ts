import cron from "node-cron";
import { emailService } from "@/emails/emailService";
import { PREMIUM_EXPIRY_REMINDER_DAYS } from "@/config/subscription";
import UserSubscription from "../models/userSubscriptionModel";
import { userSubscriptionService } from "../services/userSubscriptionService";
import { getMidnight, getRemainingDaysInclusive } from "@/utils/dateUtils";
import { acquireLock, releaseLock } from "../db/cronLock";
import { logger } from "../utils/logger";

export const startSubscriptionScheduler = async () => {
  const acquired = await acquireLock("subscription-scheduler", 10 * 60 * 1000);
  if (!acquired) {
    logger.info("[Cron] subscription-scheduler: lock held by another instance, skipping");
    return;
  }
  try {
    logger.info(" Subscription scheduler running: " + new Date().toISOString());

    const now = new Date();
    const todayMidnight = getMidnight(now);

    logger.info(" Checking for expired premium subscriptions...");

    const expiredSubscriptions = await UserSubscription.find({
      is_deleted: false,
      is_active: true,
      status: "active",
      plan_type: "Premium",
      end_date: { $lt: todayMidnight },
    }).populate("user_id", "firstname email");

    logger.info(
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
          logger.info("CRON TRANSITION: " + JSON.stringify({
            userId,
            oldPlan: "Premium",
            newPlan: "Free",
            startDate: transitionedSubscription.start_date,
            endDate: transitionedSubscription.end_date,
          }));
        }
      } catch (err) {
        logger.error(" Failed to process expired subscription: " + err);
      }
    }

    logger.info("\n Sending reminder emails...");

    const expiringSubscriptions = await UserSubscription.find({
      is_active: true,
      is_deleted: false,
      status: "active",
      plan_type: "Premium",
      end_date: { $gte: todayMidnight },
    }).populate("user_id", "firstname email");

    logger.info(
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
          logger.info(
            ` Subscription reminder failed for ${user.email} (${daysRemaining} days remaining)`,
          );
          continue;
        }

        await userSubscriptionService.markExpiryReminderSent(
          sub._id.toString(),
          daysRemaining,
        );

        logger.info(
          ` Subscription reminder sent to ${user.email} (${daysRemaining} days remaining)`,
        );
      } catch (err) {
        logger.error(" Failed to process subscription reminder: " + err);
      }
    }

    logger.info("\n Subscription scheduler completed");
  } finally {
    await releaseLock("subscription-scheduler");
  }
};

cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      logger.info(" Running subscription cron job at midnight...");
      await startSubscriptionScheduler();
    } catch (err) {
      logger.error(" Subscription cron failed: " + err);
    }
  },
  { timezone: "Asia/Kolkata" },
);

logger.info(" Subscription cron scheduled (running daily at midnight IST)");
