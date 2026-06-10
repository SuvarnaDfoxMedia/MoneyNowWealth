import cron from "node-cron";
import { newsletterPublishService } from "../services/newsletterPublishService";

/* ============================================
   Newsletter Publishing Scheduler
   Runs every minute to mark due newsletters as published
============================================ */
export function startNewsletterPublishScheduler() {
  cron.schedule(
    "*/5 * * * *",
    async () => {
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
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log("Newsletter publish scheduler started (runs every 5 minute IST)");
}
