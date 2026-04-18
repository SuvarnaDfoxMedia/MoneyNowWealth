import { AuthEmailData } from "../../types";

export const passwordResetTemplate = (data: AuthEmailData) => ({
  subject: ` Reset Your Password - MoneyNow Wealth`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #140084;">Hi ${data.userName},</h2>
      <p>We received a request to reset your password. Click the link below to set a new password. This link expires in 10 minutes:</p>
      
      <div style="background: #f7f9fc; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center;">
        <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 24px; background: #140084; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      
      <p style="word-break: break-all; font-size: 14px; color: #666; margin-top: 20px;">
        Or copy this link:<br/>
        <span style="color: #140084;">${data.resetUrl}</span>
      </p>
      
      <p style="font-size:14px;color:#777;">If you did not request a password reset, please ignore this email.</p>
      <p style="font-size:14px;color:#999;margin-top:20px;">— MoneyNow Wealth Team</p>
    </div>
  `,
});
