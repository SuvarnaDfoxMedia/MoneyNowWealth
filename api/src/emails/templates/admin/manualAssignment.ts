import { SubscriptionEmailData } from "../../types";

export const manualAssignmentTemplate = (data: SubscriptionEmailData) => ({
  subject: ` Subscription Assigned: ${data.planName} by Admin`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: #f8f9fa;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #6f42c1; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 30px -30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Assignment</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
              Admin initiated subscription update
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <span style="display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 8px 20px; border-radius: 25px; font-size: 14px; font-weight: bold;">
               ${data.isPromotional ? "Promotional" : "Regular"} Assignment
            </span>
          </div>
        </div>
        
        <!-- User Info -->
        <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #6f42c1;">
          <h3 style="color: #6f42c1; margin-top: 0; margin-bottom: 15px;">User Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-bottom: 15px;">
            <div style="color: #666; font-weight: bold;">User:</div>
            <div style="color: #333;">${data.userName}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px;">
            <div style="color: #666; font-weight: bold;">Assigned By:</div>
            <div style="color: #333;">System Administrator</div>
          </div>
        </div>
        
        <!-- Subscription Details -->
        <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e0e0e0;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #6f42c1;">
            Subscription Details
          </h3>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
            <div>
              <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Plan Type</div>
              <div style="color: #333; font-weight: bold; font-size: 18px;">${data.planName}</div>
            </div>
            <div>
              <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Status</div>
              <div style="color: #333; font-weight: bold; font-size: 18px; text-transform: capitalize;">${data.status || "active"}</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
            <div>
              <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Start Date</div>
              <div style="color: #333; font-weight: bold;">${formatDate(data.startDate)}</div>
            </div>
            <div>
              <div style="color: #666; font-size: 14px; margin-bottom: 5px;">End Date</div>
              <div style="color: #333; font-weight: bold;">${formatDate(data.endDate)}</div>
            </div>
          </div>
          
          ${
            data.planPrice !== undefined
              ? `
            <div>
              <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Amount</div>
              <div style="color: #333; font-weight: bold; font-size: 20px;">
                ₹${data.planPrice === 0 ? "0 (Free)" : data.planPrice.toLocaleString("en-IN")}
              </div>
            </div>
          `
              : ""
          }
        </div>
        
        <!-- Admin Notes -->
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #ffeaa7;">
          <h4 style="color: #856404; margin-top: 0; margin-bottom: 10px;">
             Admin Notes
          </h4>
          <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
            This subscription was manually assigned by an administrator. 
            ${data.isPromotional ? "This is a promotional assignment and may have special conditions." : "This is a regular subscription assignment."}
          </p>
        </div>
        
        <!-- Next Steps -->
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #c8e6c9;">
          <h4 style="color: #2e7d32; margin-top: 0; margin-bottom: 15px;">What This Means For You</h4>
          <ul style="color: #333; padding-left: 20px; margin: 0; font-size: 14px;">
            <li>Your subscription has been updated successfully</li>
            <li>You can access all features of the ${data.planName} plan</li>
            <li>You'll receive regular updates about your subscription</li>
            <li>Contact support if you have any questions</li>
          </ul>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
            This is an automated notification from the MoneyNow Wealth admin system
          </p>
          <div style="display: flex; justify-content: center; gap: 15px; margin: 15px 0;">
            <a href="${process.env.WEBSITE_URL || "#"}/dashboard" style="color: #6f42c1; text-decoration: none; font-size: 14px; font-weight: bold;">
              View Dashboard
            </a>
            <span style="color: #ccc;">|</span>
            <a href="${process.env.WEBSITE_URL || "#"}/contact" style="color: #6f42c1; text-decoration: none; font-size: 14px; font-weight: bold;">
              Contact Support
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} MoneyNow Wealth Admin System
          </p>
        </div>
        
      </div>
    </div>
  `,
});

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
