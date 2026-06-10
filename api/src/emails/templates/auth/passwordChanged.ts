import { AuthEmailData } from "../../types";

export const passwordChangedTemplate = (data: AuthEmailData) => ({
  subject: ` Password Updated Successfully - MoneyNow Wealth`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4CAF50;">Hi ${data.userName},</h2>
      <p>Your password has been successfully changed for your MoneyNow Wealth account.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Security Tip:</strong></p>
        <ul>
          <li>Use a strong, unique password</li>
          <li>Never share your password with anyone</li>
          <li>Enable two-factor authentication if available</li>
        </ul>
      </div>
      
      <p>If you did not make this change, please contact our support team immediately.</p>
      <br/>
      <p style="font-size:14px;color:#999;">— MoneyNow Wealth Security Team</p>
    </div>
  `,
});
