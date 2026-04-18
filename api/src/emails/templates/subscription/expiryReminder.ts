import type { ExpiryReminderData } from "../../types";

const formatDate = (value: Date) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const subscriptionExpiryReminderTemplate = (
  data: ExpiryReminderData,
) => {
  const daysRemaining = Math.max(0, Number(data.daysRemaining || 0));
  const label =
    daysRemaining === 1 ? "1 day" : `${daysRemaining.toString()} days`;
  const planName = data.planName || "Premium";

  return {
    subject: `${planName} access ends in ${label}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="color: #043F79; margin-bottom: 12px;">Your ${planName} access is ending soon</h2>
        <p>Hi ${data.userName || "User"},</p>
        <p>Your ${planName} access is active until <strong>${formatDate(data.endDate)}</strong>.</p>
        <p>You now have <strong>${label}</strong> left before your account returns to Free access.</p>
        <p>Premium gives you deeper research, premium blogs, and exclusive insights while it is active.</p>
        <p style="margin-top: 20px;">Team MoneyNow</p>
      </div>
    `,
  };
};
