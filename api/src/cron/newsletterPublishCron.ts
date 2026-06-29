import cron from "node-cron";
import { newsletterPublishService } from "../services/newsletterPublishService";
import { acquireLock, releaseLock } from "../db/cronLock";
import { logger } from "../utils/logger";

/* ============================================
   Newsletter Publishing Scheduler
   Runs every minute to mark due newsletters as published
============================================ */
export function startNewsletterPublishScheduler() {
  cron.schedule(
    "*/5 * * * *",
    async () => {
      const acquired = await acquireLock("newsletter-publish-scheduler", 4 * 60 * 1000);
      if (!acquired) {
        logger.info("[Cron] newsletter-publish-scheduler: lock held by another instance, skipping");
        return;
      }
      try {
        logger.info(
          "Newsletter publish scheduler running at: " +
          new Date().toISOString()
        );

        const publishedCount =
          await newsletterPublishService.publishDueNewsletters();

        logger.info(
          `Newsletter publish scheduler completed. published_count=${publishedCount}`
        );
      } catch (error) {
        logger.error("Error in newsletter publish scheduler: " + error);
      } finally {
        await releaseLock("newsletter-publish-scheduler");
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  logger.info("Newsletter publish scheduler started (runs every 5 minute IST)");
}
