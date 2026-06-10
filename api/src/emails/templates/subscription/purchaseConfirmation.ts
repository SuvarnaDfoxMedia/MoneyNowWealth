import { SubscriptionEmailData } from "../../types";

export const purchaseConfirmationTemplate = (data: SubscriptionEmailData) => ({
  subject: ` Purchase Confirmed: ${data.planName} Subscription`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
      <div style="background: white; padding: 30px; border-radius: 10px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #4CAF50; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="font-size: 28px; color: white;">✓</span>
          </div>
          <h1 style="color: #333; margin-bottom: 10px;">Purchase Confirmed!</h1>
          <p style="color: #666; font-size: 16px;">Thank you for your purchase</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
          <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">Order Summary</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
            <div>
              <p style="color: #666; margin: 5px 0; font-size: 14px;">Plan</p>
              <p style="color: #333; font-weight: bold; margin: 5px 0;">${data.planName}</p>
            </div>
            <div>
              <p style="color: #666; margin: 5px 0; font-size: 14px;">Amount</p>
              <p style="color: #333; font-weight: bold; margin: 5px 0;">₹${data.planPrice?.toLocaleString("en-IN") || "0"}</p>
            </div>
            <div>
              <p style="color: #666; margin: 5px 0; font-size: 14px;">Start Date</p>
              <p style="color: #333; font-weight: bold; margin: 5px 0;">${formatDate(data.startDate)}</p>
            </div>
            <div>
              <p style="color: #666; margin: 5px 0; font-size: 14px;">End Date</p>
              <p style="color: #333; font-weight: bold; margin: 5px 0;">${formatDate(data.endDate)}</p>
            </div>
          </div>
          
          <div style="background: #e8f5e9; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #4CAF50;">
            <p style="color: #2e7d32; margin: 0; font-size: 14px;">
              <strong>Payment Status:</strong> Successful
              ${data.isUserPurchase ? "• Purchased by user" : ""}
            </p>
          </div>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <h4 style="color: #1565c0; margin-top: 0;">What's Next?</h4>
          <ul style="color: #333; padding-left: 20px; margin: 10px 0;">
            <li>Your subscription is now active</li>
            <li>Access premium content immediately</li>
            <li>Check your subscription status anytime in your dashboard</li>
            <li>You'll receive a reminder before expiry</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            Need help or have questions?<br/>
            Contact our support team at support@moneynowwealth.com
          </p>
          <a href="${process.env.WEBSITE_URL || "#"}/dashboard" style="display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 25px; font-weight: bold; transition: background 0.3s;">
            Go to Dashboard
          </a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.8); font-size: 12px;">
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} MoneyNow Wealth. All rights reserved.</p>
        <p style="margin: 5px 0;">This is an automated email, please do not reply.</p>
      </div>
    </div>
  `,
});

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
