export const newsletterTemplate = (data: { title: string }) => ({
  subject: ` Monthly Newsletter: ${data.title}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #140084; padding: 25px; border-radius: 10px 10px 0 0; margin: -30px -30px 30px -30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">
              MoneyNow Wealth
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              Monthly Financial Insights
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <span style="display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 8px 20px; border-radius: 25px; font-size: 14px; font-weight: bold;">
              ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </span>
          </div>
          
          <h2 style="color: #140084; margin: 20px 0 10px 0; font-size: 24px; line-height: 1.3;">
            ${data.title}
          </h2>
          <p style="color: #666; font-size: 16px; margin: 10px 0 20px 0;">
            Your monthly dose of financial wisdom and market insights
          </p>
        </div>
        
        <!-- Content -->
        <div style="margin: 30px 0;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e0e0e0;">
            <h3 style="color: #140084; margin-top: 0; border-left: 4px solid #140084; padding-left: 15px;">
               Market Overview
            </h3>
            <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
              This month's financial landscape analysis and key market movements that could impact your investments.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e0e0e0;">
            <h3 style="color: #140084; margin-top: 0; border-left: 4px solid #140084; padding-left: 15px;">
               Investment Strategies
            </h3>
            <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
              Expert strategies to optimize your portfolio in the current economic climate.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e0e0e0;">
            <h3 style="color: #140084; margin-top: 0; border-left: 4px solid #140084; padding-left: 15px;">
               This Month's Focus
            </h3>
            <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
              Special deep-dive into topics that matter most for your financial growth this month.
            </p>
          </div>
        </div>
        
        <!-- Newsletter Info -->
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #bbdefb;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="background: #2196F3; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
              <span style="color: white; font-size: 20px;"></span>
            </div>
            <div>
              <h4 style="color: #1565c0; margin: 0; font-size: 18px;">Monthly Newsletter</h4>
              <p style="color: #333; margin: 5px 0 0 0; font-size: 14px;">
                Find detailed analysis and insights in the attached PDF
              </p>
            </div>
          </div>
        </div>
        
        <!-- Call to Action -->
        <div style="text-align: center; margin: 40px 0 30px 0;">
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
            Want more insights between newsletters?
          </p>
          <a href="${process.env.WEBSITE_URL || "#"}/premium" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
            Upgrade to Premium →
          </a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
            This newsletter is sent to all MoneyNow Wealth subscribers
          </p>
          <div style="display: flex; justify-content: center; gap: 20px; margin: 15px 0;">
            <a href="${process.env.WEBSITE_URL || "#"}/articles" style="color: #667eea; text-decoration: none; font-size: 14px;">Articles</a>
            <a href="${process.env.WEBSITE_URL || "#"}/topics" style="color: #667eea; text-decoration: none; font-size: 14px;">Topics</a>
            <a href="${process.env.WEBSITE_URL || "#"}/preferences" style="color: #667eea; text-decoration: none; font-size: 14px;">Preferences</a>
            <a href="${process.env.WEBSITE_URL || "#"}/unsubscribe" style="color: #999; text-decoration: none; font-size: 14px;">Unsubscribe</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} MoneyNow Wealth. All rights reserved.<br/>
            This is an automated newsletter, please do not reply.
          </p>
        </div>
        
      </div>
    </div>
  `,
});
