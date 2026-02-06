import { TrialUpgradedData } from "../../types";

export const trialUpgradedTemplate = (data: TrialUpgradedData) => ({
  subject: ` ${data.isPromotional ? "Free Premium Trial" : "Premium Trial"} Activated!`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4CAF50;">Hello ${data.userName},</h2>
      <p>Congratulations! You've been granted a <strong>${data.isPromotional ? "FREE Premium Trial" : "Premium Trial"}</strong>!</p>
      <p>From now until <strong>${formatDate(data.endDate)}</strong>, you'll have access to:</p>
      <ul style="background: #f9f9f9; padding: 15px 30px; border-radius: 5px; margin: 15px 0;">
        <li>All premium content and articles</li>
        <li>Exclusive investment insights</li>
        <li>Ad-free reading experience</li>
        <li>Priority customer support</li>
        ${(data.features || []).map((feature) => `<li>${feature}</li>`).join("")}
      </ul>
      <p>Your trial ends on: <strong>${formatDate(data.endDate)}</strong></p>
      <p>Enjoy your premium access!</p>
      <br/>
      <p style="color: #666;">If you have any questions, feel free to contact our support team.</p>
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
    hour: "2-digit",
    minute: "2-digit",
  });
};
