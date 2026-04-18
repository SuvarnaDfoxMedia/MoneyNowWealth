import { transactionalEmailService } from "../services/transactionalEmailService";
import { AuthEmailData, ExpiryReminderData } from "./types";

export const emailService = {
  async sendWelcome(to: string, data: AuthEmailData): Promise<boolean> {
    return transactionalEmailService.sendWelcome(to, data);
  },

  async sendPasswordReset(to: string, data: AuthEmailData): Promise<boolean> {
    return transactionalEmailService.sendPasswordReset(to, data);
  },

  async sendPasswordChanged(to: string, data: AuthEmailData): Promise<boolean> {
    return transactionalEmailService.sendPasswordChanged(to, data);
  },

  async sendSubscriptionExpiryReminder(
    to: string,
    data: ExpiryReminderData,
  ): Promise<boolean> {
    return transactionalEmailService.sendSubscriptionExpiryReminder(to, data);
  },
};
