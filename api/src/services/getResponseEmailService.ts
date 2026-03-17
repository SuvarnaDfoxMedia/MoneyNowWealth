import axios from "axios";
import {
  newsletterTemplate,
  subscriptionActivatedTemplate,
  subscriptionExpiredTemplate,
  subscriptionReminderTemplate,
  topicPublishedTemplate,
  trialUpgradedTemplate,
} from "../emails/templates";
import type {
  ContentEmailData,
  ExpiryReminderData,
  SubscriptionEmailData,
  TrialUpgradedData,
} from "../emails/types";

type SendGetResponseEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

class GetResponseEmailService {
  private readonly apiBase =
    process.env.GETRESPONSE_API_BASE || "https://api.getresponse.com/v3";

  private get apiKey(): string {
    const key = process.env.GETRESPONSE_API_KEY;
    if (!key) throw new Error("GETRESPONSE_API_KEY missing");
    return key;
  }

  private get fromEmail(): string {
    return (
      process.env.GETRESPONSE_FROM_EMAIL ||
      process.env.SMTP_USER ||
      "no-reply@moneynowwealth.com"
    );
  }

  private get fromName(): string {
    return process.env.GETRESPONSE_FROM_NAME || "MoneyNow Wealth";
  }

  private get contactCampaignId(): string | undefined {
    return process.env.GETRESPONSE_CAMPAIGN_ID;
  }

  private get contactEndpoint(): string {
    return `${this.apiBase}/contacts`;
  }

  private get emailEndpoint(): string {
    return `${this.apiBase}/transactional/emails`;
  }

  private get headers() {
    return {
      "X-Auth-Token": `api-key ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async addContact(email: string): Promise<void> {
    const campaignId = this.contactCampaignId;
    if (!campaignId) return;

    try {
      await axios.post(
        this.contactEndpoint,
        {
          email,
          campaign: { campaignId },
        },
        { headers: this.headers },
      );
      console.log(`EMAIL_SENT_GETRESPONSE contact_added to=${email}`);
    } catch (error: any) {
      console.error(
        `EMAIL_FAILED channel=getresponse operation=add_contact to=${email}`,
        error?.response?.data || error?.message || error,
      );
      throw error;
    }
  }

  async sendEmail({ to, subject, html }: SendGetResponseEmailArgs) {
    try {
      await axios.post(
        this.emailEndpoint,
        {
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          subject,
          content: { html },
          recipients: [{ email: to }],
        },
        { headers: this.headers },
      );
      console.log(`EMAIL_SENT_GETRESPONSE to=${to} subject="${subject}"`);
    } catch (error: any) {
      console.error(
        `EMAIL_FAILED channel=getresponse operation=send_email to=${to}`,
        error?.response?.data || error?.message || error,
      );
      throw error;
    }
  }

  async sendMarketingEmail(to: string, subject: string, html: string) {
    return this.sendEmail({ to, subject, html });
  }

  async sendCampaignEmail(to: string, subject: string, html: string) {
    return this.sendEmail({ to, subject, html });
  }

  async sendNewsletterEmail(to: string, title: string, fileUrl?: string) {
    const tpl = newsletterTemplate({ title });
    const html = fileUrl
      ? `${tpl.html}<p style="font-family:Arial,sans-serif;">Newsletter file: <a href="${fileUrl}">${fileUrl}</a></p>`
      : tpl.html;

    return this.sendEmail({
      to,
      subject: tpl.subject,
      html,
    });
  }

  async sendNewsletterBulk(recipients: string[], title: string, fileUrl?: string) {
    const settled = await Promise.allSettled(
      recipients.map((to) => this.sendNewsletterEmail(to, title, fileUrl)),
    );

    const successful = settled.filter((item) => item.status === "fulfilled").length;
    const failed = settled.length - successful;
    return { successful, failed };
  }

  async sendBlogNotification(to: string, data: ContentEmailData) {
    const tpl = topicPublishedTemplate(data);
    return this.sendEmail({ to, subject: tpl.subject, html: tpl.html });
  }

  async sendSubscriptionActivated(to: string, data: SubscriptionEmailData) {
    const tpl = subscriptionActivatedTemplate(data);
    return this.sendEmail({ to, subject: tpl.subject, html: tpl.html });
  }

  async sendSubscriptionExpired(to: string, data: SubscriptionEmailData) {
    const tpl = subscriptionExpiredTemplate(data);
    return this.sendEmail({ to, subject: tpl.subject, html: tpl.html });
  }

  async sendTrialUpgraded(to: string, data: TrialUpgradedData) {
    const tpl = trialUpgradedTemplate(data);
    return this.sendEmail({ to, subject: tpl.subject, html: tpl.html });
  }

  async sendSubscriptionUpdate(to: string, data: ExpiryReminderData) {
    const tpl = subscriptionReminderTemplate(data);
    return this.sendEmail({ to, subject: tpl.subject, html: tpl.html });
  }
}

export const getResponseEmailService = new GetResponseEmailService();
