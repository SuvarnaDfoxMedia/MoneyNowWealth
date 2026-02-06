import { ContentEmailData } from "../../types";

export const topicPublishedTemplate = (data: ContentEmailData) => ({
  subject: ` New Topic: ${data.title}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: #f8f9fa;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #140084; padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Topic Published</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Exclusive for MoneyNow Wealth subscribers</p>
        </div>
        
        <h2 style="color: #140084; margin: 20px 0 10px 0; font-size: 22px;">${data.title}</h2>
        
        <div style="display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 10px 0;">
           Educational Content
        </div>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin: 20px 0;">
        <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
          ${data.summary || `We've just published a new topic "${data.title}" that we think you'll find valuable. Dive in to expand your financial knowledge.`}
        </p>
        
        <div style="background: #f0f7ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #140084;">
          <p style="color: #333; margin: 0; font-size: 14px;">
            <strong> Why this matters:</strong> Staying informed is key to making smart financial decisions.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.link}" style="display: inline-block; padding: 15px 40px; background: #140084; color: white; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background 0.3s;">
          Explore This Topic Now
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 10px;">
          Estimated reading time: 10-15 minutes
        </p>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
        <h4 style="color: #140084; margin-top: 0; font-size: 16px;">What You'll Learn:</h4>
        <ul style="color: #333; padding-left: 20px; margin: 10px 0;">
          <li>Key concepts and strategies</li>
          <li>Practical applications</li>
          <li>Expert insights</li>
          <li>Actionable takeaways</li>
        </ul>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <div style="color: #666; font-size: 12px;">
          <p style="margin: 0;">Sent to: ${data.userName}</p>
          <p style="margin: 5px 0 0 0;">Subscription: Active</p>
        </div>
        <div>
          <a href="${process.env.WEBSITE_URL || "#"}/preferences" style="color: #667eea; font-size: 12px; text-decoration: none;">
            Manage notifications
          </a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px;">
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} MoneyNow Wealth. Empowering your financial journey.</p>
        <p style="margin: 5px 0;">If you no longer wish to receive topic notifications, you can <a href="${process.env.WEBSITE_URL || "#"}/unsubscribe" style="color: #999;">unsubscribe here</a>.</p>
      </div>
    </div>
  `,
});
