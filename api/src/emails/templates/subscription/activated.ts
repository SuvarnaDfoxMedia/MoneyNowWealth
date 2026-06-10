import { SubscriptionEmailData } from "../../types";

export const subscriptionActivatedTemplate = (data: SubscriptionEmailData) => ({
  subject: ` ${getActivationSubject(data)}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4CAF50;">Hello ${data.userName},</h2>
      <p>Your <strong>${data.planName}</strong> subscription has been ${getActivationText(data)}!</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Plan:</strong> ${data.planName}</p>
        <p><strong>Start Date:</strong> ${formatDate(data.startDate)}</p>
        <p><strong>End Date:</strong> ${formatDate(data.endDate)}</p>
        ${data.planPrice && data.planPrice > 0 ? `<p><strong>Amount:</strong> ₹${data.planPrice}</p>` : ""}
        ${data.isPromotional ? `<p><em> This is a promotional trial</em></p>` : ""}
      </div>
      
      <p>Thank you for choosing our service!</p>
      <br/>
      <p>Best regards,<br/>The MoneyNow Wealth Team</p>
    </div>
  `,
});

const getActivationSubject = (data: SubscriptionEmailData): string => {
  if (data.isPromotional) return "Premium Trial Activated!";
  if (data.status === "upgrade") return "Subscription Upgraded";
  if (data.status === "downgrade") return "Subscription Changed";
  return "Subscription Activated";
};

const getActivationText = (data: SubscriptionEmailData): string => {
  if (data.isPromotional) return "activated as a promotional trial";
  if (data.status === "upgrade") return "upgraded";
  if (data.status === "downgrade") return "changed";
  return "activated";
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
