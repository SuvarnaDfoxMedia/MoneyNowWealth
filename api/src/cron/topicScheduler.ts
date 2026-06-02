
// /* ---------------------------------------------------
//    Topic & Article Scheduler (runs every 5 minutes)
//    Handles BOTH topics and articles publishing notifications
// --------------------------------------------------- */

import cron from "node-cron";
import Topic, { type ITopic } from "../models/topicModel";
import Article from "../models/articleModel";
import User from "../models/userModel";

/* ---------------------------------------------------
   Topic & Article Scheduler (runs every 5 minutes)
   Handles BOTH topics and articles publishing notifications
--------------------------------------------------- */

export function startTopicScheduler() {
  // Run every 5 minutes for development
  cron.schedule(
    "*/5 * * * *",
    async () => {
      try {
        console.log(
          " Topic & Article scheduler running at:",
          new Date().toISOString(),
        );
        const now = new Date();

        // ============================================
        // 1. CHECK FOR NEWLY PUBLISHED TOPICS
        // ============================================
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find topics published today that haven't had emails sent yet
        const topicsToNotify: ITopic[] = await Topic.find({
          status: "published",
          publish_date: {
            $gte: today,
            $lt: tomorrow,
          },
          is_deleted: false,
          is_email_sent: false,
          is_active: 1,
        });

        // ============================================
        // 2. CHECK FOR NEWLY PUBLISHED ARTICLES
        // ============================================
        const articlesToNotify = await Article.find({
          status: "published",
          publish_date: {
            $gte: today,
            $lt: tomorrow,
          },
          is_email_sent: false,
          is_deleted: false,
        }).populate("topic_id", "title slug");

        console.log(` Found ${topicsToNotify.length} new topic(s) to notify`);
        console.log(
          ` Found ${articlesToNotify.length} new article(s) to notify`,
        );

        if (!topicsToNotify.length && !articlesToNotify.length) {
          console.log(
            " No new topics or articles to notify subscribers about.",
          );
          return;
        }

        // ============================================
        // 3. GET ACTIVE SUBSCRIBERS WITH VALID EMAILS
        // ============================================
        // Get users who have active subscriptions (Free or Premium)
        const activeSubscribers = await User.aggregate([
          {
            $match: {
              is_deleted: false,
              email: { $exists: true, $ne: "" },
              role: "user",
            },
          },
          {
            $lookup: {
              from: "usersubscriptions",
              localField: "_id",
              foreignField: "user_id",
              as: "subscription",
            },
          },
          {
            $match: {
              "subscription.0": {
                $exists: true,
              },
              "subscription.is_active": true,
              "subscription.is_deleted": false,
            },
          },
          {
            $project: {
              email: 1,
              firstname: 1,
              subscriptionStatus: { $arrayElemAt: ["$subscription.status", 0] },
              planType: { $arrayElemAt: ["$subscription.plan_type", 0] },
            },
          },
        ]);

        const subscriberEmails = activeSubscribers
          .map((u) => u.email)
          .filter((email): email is string => !!email && email.includes("@"));

        if (!subscriberEmails.length) {
          console.log(" No active subscribers found to notify.");
          return;
        }

        console.log(` Found ${subscriberEmails.length} active subscribers`);

        // ============================================
        // 4. SEND EMAILS FOR NEW TOPICS
        // ============================================
        for (const topic of topicsToNotify) {
          try {
            // Use topicPublished method for individual user emails
            for (const subscriber of activeSubscribers) {
              if (subscriber.email && subscriber.email.includes("@")) {
                const payload = {
                  userName: subscriber.firstname || "Subscriber",
                  title: topic.title,
                  summary: topic.summary || "Check out our latest topic",
                  link: `${process.env.WEBSITE_URL}/blog/${topic.slug}`,
                };

                try {
                } catch (grError: any) {
                  console.error(
                    ` EMAIL_FAILED channel=getresponse to=${subscriber.email} operation=topic_notification`,
                    grError?.message || grError,
                  );
                }
              }
            }

            // Mark email as sent
            await Topic.findByIdAndUpdate(topic._id, {
              is_email_sent: true,
              updated_at: new Date(),
            });

            console.log(` Email notifications sent for topic: ${topic.title}`);
          } catch (err) {
            console.error(
              ` Failed to send email for topic ${topic.title}:`,
              err,
            );
          }
        }

        // ============================================
        // 5. SEND EMAILS FOR NEW ARTICLES
        // ============================================
        for (const article of articlesToNotify) {
          try {
            const topic = article.topic_id as any;

            // Use newArticle method for bulk emails
            const contentData = {
              title: article.title,
              summary:
                article.introduction?.substring(0, 200) + "..." ||
                "New article published on " + (topic?.title || "our platform"),
              link: `${process.env.WEBSITE_URL}/article/${article.slug}`,
            };

            // Send to each subscriber with their name
            for (const subscriber of activeSubscribers) {
              if (subscriber.email && subscriber.email.includes("@")) {
                const payload = {
                  userName: subscriber.firstname || "Subscriber",
                  ...contentData,
                };

                try {
                } catch (grError: any) {
                  console.error(
                    ` EMAIL_FAILED channel=getresponse to=${subscriber.email} operation=article_notification`,
                    grError?.message || grError,
                  );
                }
              }
            }

            // Mark email as sent
            await Article.findByIdAndUpdate(article._id, {
              is_email_sent: true,
              updated_at: new Date(),
            });

            console.log(
              ` Email notifications sent for article: ${article.title}`,
            );
          } catch (err) {
            console.error(
              ` Failed to send email for article ${article.title}:`,
              err,
            );
          }
        }

        console.log(" Topic & Article email notifications completed.");
      } catch (error) {
        console.error(" Error in topic & article scheduler:", error);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log(" Topic & Article scheduler started (runs every 5 minutes IST)");
}
