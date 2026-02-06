import cron from "node-cron";
import User from "../models/userModel";
import { emailService } from "@/emails/emailService";

export function startNewsletterScheduler() {
  cron.schedule(
    "0 9 * * 1",
    async () => {
      try {
        const users = await User.find({
          newsletter: true,
          email: { $exists: true, $ne: "" },
        }).select("email");

        if (!users.length) return;

        emailService.newsletter(
          users.map((u) => u.email),
          `${process.env.BASE_URL}/uploads/newsletters/week-1.pdf`,
          "Weekly Market Newsletter",
        );

        console.log(`Newsletter job queued for ${users.length} users`);
      } catch (error) {
        console.error("Newsletter cron failed:", error);
      }
    },
    { timezone: "Asia/Kolkata" },
  );
}
