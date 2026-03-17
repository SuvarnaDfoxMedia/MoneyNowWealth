import cron from "node-cron";
import User from "../models/userModel";
import { getResponseEmailService } from "../services/getResponseEmailService";

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

        const recipients = users
          .map((u) => u.email)
          .filter((email): email is string => !!email && email.includes("@"));
        const newsletterUrl = `${process.env.BASE_URL}/uploads/newsletters/week-1.pdf`;

        /* OLD SMTP IMPLEMENTATION (COMMENTED)
        emailService.newsletter(
          users.map((u) => u.email),
          `${process.env.BASE_URL}/uploads/newsletters/week-1.pdf`,
          "Weekly Market Newsletter",
        );
        */
        await getResponseEmailService.sendNewsletterBulk(
          recipients,
          "Weekly Market Newsletter",
          newsletterUrl,
        );

        console.log(`Newsletter job queued for ${users.length} users`);
      } catch (error) {
        console.error("Newsletter cron failed:", error);
      }
    },
    { timezone: "Asia/Kolkata" },
  );
}
