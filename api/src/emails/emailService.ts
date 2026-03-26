import { emailQueue } from "./emailQueue";
import {
  welcomeTemplate,
  // passwordResetTemplate,
  // passwordChangedTemplate,
  subscriptionActivatedTemplate,
  subscriptionExpiredTemplate,
  trialUpgradedTemplate,
  subscriptionReminderTemplate,
  // purchaseConfirmationTemplate,
  newArticleTemplate,
  topicPublishedTemplate,
  newsletterTemplate,
  passwordResetTemplate,
  passwordChangedTemplate,
  // manualAssignmentTemplate,
  // userRegisteredTemplate,
} from "./templates";
import {
  SubscriptionEmailData,
  TrialUpgradedData,
  ExpiryReminderData,
  AuthEmailData,
  ContentEmailData,
} from "./types";

export const emailService = {
  async sendWelcome(to: string, data: AuthEmailData): Promise<boolean> {
    try {
      const tpl = welcomeTemplate(data);
      emailQueue.add({ to, ...tpl, metadata: { type: "welcome" } });
      console.log(` Welcome email queued for: ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to queue welcome email:", error);
      return false;
    }
  },

  async sendPasswordReset(to: string, data: AuthEmailData): Promise<boolean> {
    try {
      const tpl = passwordResetTemplate(data);
      emailQueue.add({ to, ...tpl, metadata: { type: "password_reset" } });
      console.log(` Password reset email queued for: ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to queue password reset email:", error);
      return false;
    }
  },

  async sendPasswordChanged(to: string, data: AuthEmailData): Promise<boolean> {
    try {
      const tpl = passwordChangedTemplate(data);
      emailQueue.add({ to, ...tpl, metadata: { type: "password_changed" } });
      console.log(` Password changed email queued for: ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to queue password changed email:", error);
      return false;
    }
  },

  async subscriptionActivated(
    to: string,
    data: SubscriptionEmailData,
  ): Promise<boolean> {
    try {
      const tpl = subscriptionActivatedTemplate(data);
      emailQueue.add({
        to,
        ...tpl,
        metadata: { type: "subscription_activated" },
      });
      console.log(` Subscription activation email queued for: ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to queue subscription activation email:", error);
      return false;
    }
  },

  async subscriptionExpired(
    to: string,
    data: SubscriptionEmailData,
  ): Promise<boolean> {
    try {
      const tpl = subscriptionExpiredTemplate(data);
      emailQueue.add({
        to,
        ...tpl,
        metadata: { type: "subscription_expired" },
      });
      console.log(` Subscription expiry email queued for: ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to queue subscription expiry email:", error);
      return false;
    }
  },

  async trialUpgraded(to: string, data: TrialUpgradedData): Promise<boolean> {
    try {
      const tpl = trialUpgradedTemplate(data);
      emailQueue.add({ to, ...tpl, metadata: { type: "trial_upgraded" } });
      console.log(` Trial upgrade email queued for: ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to queue trial upgrade email:", error);
      return false;
    }
  },

  async subscriptionReminder(
    to: string,
    data: ExpiryReminderData,
  ): Promise<boolean> {
    try {
      const tpl = subscriptionReminderTemplate(data);
      emailQueue.add({
        to,
        ...tpl,
        metadata: { type: "subscription_reminder" },
      });
      console.log(` Subscription reminder email queued for: ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to queue subscription reminder email:", error);
      return false;
    }
  },

async newArticle(to: string[], data: ContentEmailData): Promise<boolean> {
    try {
      const tpl = newArticleTemplate(data);
      emailQueue.addBulk(
        to.map((recipient) => ({
          to: recipient,
          ...tpl,
          metadata: { type: "new_article" },
        })),
      );
      console.log(` New article emails queued for ${to.length} recipients`);
      return true;
    } catch (error) {
      console.error("Failed to queue new article emails:", error);
      return false;
    }
  },

  async topicPublished(to: string, data: ContentEmailData): Promise<boolean> {
    try {
      const tpl = topicPublishedTemplate(data);
      emailQueue.add({ to, ...tpl, metadata: { type: "topic_published" } });
      console.log(` Topic published email queued for: ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to queue topic published email:", error);
      return false;
    }
  },

  async newsletter(
    to: string[],
    pdfPath: string,
    title: string,
  ): Promise<boolean> {
    try {
      const tpl = newsletterTemplate({ title });
      emailQueue.addBulk(
        to.map((recipient) => ({
          to: recipient,
          ...tpl,
          attachments: [{ filename: "newsletter.pdf", path: pdfPath }],
          metadata: { type: "newsletter" },
        })),
      );
      console.log(` Newsletter emails queued for ${to.length} recipients`);
      return true;
    } catch (error) {
      console.error("Failed to queue newsletter emails:", error);
      return false;
    }
  },

getQueueSize(): number {
    return emailQueue.getQueueSize();
  },

  clearQueue(): void {
    emailQueue.clearQueue();
  },

  async sendCustomEmail(
    to: string | string[],
    subject: string,
    html: string,
    metadata?: any,
  ): Promise<boolean> {
    try {
      emailQueue.add({ to, subject, html, metadata });
      console.log(
        ` Custom email queued for: ${Array.isArray(to) ? to.join(", ") : to}`,
      );
      return true;
    } catch (error) {
      console.error("Failed to queue custom email:", error);
      return false;
    }
  },
};
