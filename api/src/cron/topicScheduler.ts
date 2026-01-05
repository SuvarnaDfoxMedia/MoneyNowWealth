import cron from "node-cron";
import Topic, { type ITopic } from "../models/topicModel";

/* ---------------------------------------------------
   Topic Scheduler (runs daily at midnight IST)
--------------------------------------------------- */
export function startTopicScheduler() {
  // Run every day at midnight (00:00 IST)
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // reset time to compare only date

        // Find topics scheduled to be published today
        const topicsToPublish: ITopic[] = await Topic.find({
          status: "published",
          publish_date: { $lte: today },
          is_deleted: false,
        });

        if (topicsToPublish.length > 0) {
          console.log(
            `${topicsToPublish.length} topic(s) are scheduled to be published today:`,
            topicsToPublish.map((t) => t.topic_code)
          );
        } else {
          console.log("No topics scheduled for today");
        }

        // Note: Activation must be handled manually via toggleActive method
      } catch (error) {
        console.error("Error in topic scheduler:", error);
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log("Topic scheduler started (runs daily at midnight IST)");
}
