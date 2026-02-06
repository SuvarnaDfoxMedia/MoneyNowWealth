export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer;
  contentType?: string;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface EmailJob {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  metadata?: {
    type: string;
    userId?: string;
    subscriptionId?: string;
  };
}

// Template data interfaces
export interface SubscriptionEmailData {
  userName: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  planPrice?: number;
  status?: "new" | "upgrade" | "downgrade";
  isUserPurchase?: boolean;
  isPromotional?: boolean;
}

export interface TrialUpgradedData {
  userName: string;
  endDate: Date;
  isPromotional: boolean;
  features?: string[];
}

export interface ExpiryReminderData {
  userName: string;
  planName: string;
  endDate: Date;
  daysRemaining?: number;
  hoursRemaining?: number;
  isPromotional?: boolean;
}

export interface AuthEmailData {
  userName: string;
  resetUrl?: string;
}

export interface ContentEmailData {
  userName: string;
  title: string;
  summary?: string;
  link: string;
}
