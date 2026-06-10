import { SubscriptionEmailData } from "../../types";

export const subscriptionExpiredTemplate = (data: SubscriptionEmailData) => ({
  subject: ` Your ${data.planName} subscription has expired`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #f44336;">Hello ${data.userName},</h2>
      <p>Your <strong>${data.planName}</strong> subscription has expired on <strong>${formatDate(data.endDate)}</strong>.</p>
      
      ${
        data.planName.includes("Premium")
          ? `<div style="background: #ffebee; padding: 15px; border-radius: 5px; border: 1px solid #ffcdd2;">
             <p><strong>Note:</strong> Your access to premium content has been restricted. To regain premium access, please purchase a new subscription.</p>
           </div>`
          : `<p>You can still access free content with your account.</p>`
      }
      
      <br/>
      <p style="color: #666;">We hope to see you back soon!</p>
      <br/>
      <p>Best regards,<br/>The MoneyNow Wealth Team</p>
    </div>
  `,
});

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
