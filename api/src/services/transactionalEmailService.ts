import {
  passwordChangedTemplate,
  passwordResetTemplate,
  subscriptionExpiryReminderTemplate,
  welcomeTemplate,
} from "../emails/templates";
import type { AuthEmailData, ExpiryReminderData } from "../emails/types";
import { sendEmail } from "../emails/sendEmail";

class TransactionalEmailService {
  private async deliverEmail(
    to: string,
    subject: string,
    html: string,
    type:
      | "welcome"
      | "password_reset"
      | "password_changed"
      | "subscription_expiry_reminder",
  ): Promise<boolean> {
    try {
      await sendEmail({
        to,
        subject,
        html,
        metadata: { type, channel: "smtp" },
      });
      return true;
    } catch (error) {
      console.error(`Transactional email failed type=${type} to=${to}`, error);
      return false;
    }
  }

  async sendWelcome(to: string, data: AuthEmailData): Promise<boolean> {
    const tpl = welcomeTemplate(data);
    return this.deliverEmail(to, tpl.subject, tpl.html, "welcome");
  }

  async sendPasswordReset(to: string, data: AuthEmailData): Promise<boolean> {
    const tpl = passwordResetTemplate(data);
    return this.deliverEmail(to, tpl.subject, tpl.html, "password_reset");
  }

  async sendPasswordChanged(
    to: string,
    data: AuthEmailData,
  ): Promise<boolean> {
    const tpl = passwordChangedTemplate(data);
    return this.deliverEmail(to, tpl.subject, tpl.html, "password_changed");
  }

  async sendSubscriptionExpiryReminder(
    to: string,
    data: ExpiryReminderData,
  ): Promise<boolean> {
    const tpl = subscriptionExpiryReminderTemplate(data);
    return this.deliverEmail(
      to,
      tpl.subject,
      tpl.html,
      "subscription_expiry_reminder",
    );
  }
}

export const transactionalEmailService = new TransactionalEmailService();
