import cron from "node-cron";
import { newsletterPublishService } from "../services/newsletterPublishService";
import { Newsletter } from "../models/newsletterModel";
import path from "path";
import fs from "fs";

/* ============================================
   Newsletter Publishing Scheduler
   Runs every 5 minutes to check for newsletters
   that need to be sent to subscribers
============================================ */
export function startNewsletterPublishScheduler() {
  // Run every 5 minutes for checking scheduled newsletters
  cron.schedule(
    "*/1 * * * *",
    async () => {
      try {
        console.log(
          "Newsletter publish scheduler running at:",
          new Date().toISOString(),
        );

        // Get newsletters ready to send (scheduled/published, publish date reached, email not sent)
        const newslettersToSend =
          await newsletterPublishService.getNewslettersReadyToSend();

        console.log(
          `Found ${newslettersToSend.length} newsletter(s) ready to send`,
        );

        if (!newslettersToSend.length) {
          console.log("No newsletters ready to send at this time.");
          return;
        }

        // Get all subscribers
        const subscribers = await Newsletter.find({
          is_deleted: false,
          email: { $exists: true, $ne: "" },
        }).select("email name");

        if (subscribers.length === 0) {
          console.log("No subscribers found to send newsletters to.");
          return;
        }

        const subscriberEmails = subscribers
          .map((s) => s.email)
          .filter((email): email is string => !!email && email.includes("@"));

        // Process each newsletter
        for (const newsletter of newslettersToSend) {
          try {
            console.log(
              `Processing newsletter: ${newsletter.title} (${newsletter._id})`,
            );

            // Check if file exists
            const filePath = path.join(
              process.cwd(),
              "uploads",
              "newsletters",
              newsletter.pdf_file,
            );

            if (!fs.existsSync(filePath)) {
              console.error(
                `Newsletter file not found: ${newsletter.pdf_file}`,
              );
              continue;
            }

            // Send emails using newsletterPublishService
            const result = await newsletterPublishService.sendNewsletterEmails(
              newsletter._id.toString(),
            );

            console.log(`Newsletter sent: ${result.message}`);
          } catch (error) {
            console.error(
              `Failed to send newsletter ${newsletter.title}:`,
              error,
            );
          }
        }

        console.log("Newsletter publish scheduler completed.");
      } catch (error) {
        console.error("Error in newsletter publish scheduler:", error);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log(
    "Newsletter publish scheduler started (runs every 1 minutes IST)",
  );
}
