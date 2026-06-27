import cron from "node-cron";
import { newsletterPublishService } from "../services/newsletterPublishService";
import { acquireLock, releaseLock } from "../db/cronLock";

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
        console.log("[Cron] newsletter-publish-scheduler: lock held by another instance, skipping");
        return;
      }
      try {
        console.log(
          "Newsletter publish scheduler running at:",
          new Date().toISOString(),
        );

        const publishedCount =
          await newsletterPublishService.publishDueNewsletters();

        console.log(
          `Newsletter publish scheduler completed. published_count=${publishedCount}`,
        );
      } catch (error) {
        console.error("Error in newsletter publish scheduler:", error);
      } finally {
        await releaseLock("newsletter-publish-scheduler");
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log("Newsletter publish scheduler started (runs every 5 minute IST)");
}
