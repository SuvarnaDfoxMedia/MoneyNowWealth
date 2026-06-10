import { ContentEmailData } from "../../types";

export const newArticleTemplate = (data: ContentEmailData) => ({
  subject: ` New Article: ${data.title}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Article Published</h1>
        </div>
        <h2 style="color: #333; margin: 20px 0 10px 0;">${data.title}</h2>
      </div>
      
      ${
        data.summary
          ? `
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="color: #333; line-height: 1.6; margin: 0; font-size: 16px;">
            ${data.summary}
          </p>
        </div>
      `
          : ""
      }
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.link}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
          Read Full Article →
        </a>
      </div>
      
      <div style="background: #f0f7ff; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #d1e3ff;">
        <h4 style="color: #1565c0; margin-top: 0;"> More From MoneyNow Wealth</h4>
        <p style="color: #333; font-size: 14px; margin: 10px 0;">
          Explore our library of articles on personal finance, investments, and wealth management.
        </p>
        <a href="${process.env.WEBSITE_URL || "#"}/articles" style="color: #667eea; text-decoration: none; font-weight: bold; font-size: 14px;">
          Browse All Articles →
        </a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
          You're receiving this email because you're subscribed to MoneyNow Wealth updates.
        </p>
        <a href="${process.env.WEBSITE_URL || "#"}/unsubscribe" style="color: #999; font-size: 12px; text-decoration: none;">
          Unsubscribe from article notifications
        </a>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px;">
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} MoneyNow Wealth. All rights reserved.</p>
        <p style="margin: 5px 0;">This email was sent to subscribers of MoneyNow Wealth.</p>
      </div>
    </div>
  `,
});
