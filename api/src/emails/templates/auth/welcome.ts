import { AuthEmailData } from "../../types";

export const welcomeTemplate = (data: AuthEmailData) => ({
  subject: ` Welcome to MoneyNow Wealth, ${data.userName}!`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4CAF50;">Welcome, ${data.userName}!</h2>
      <p>We're excited to have you on board at <strong>MoneyNow Wealth</strong>!</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Your account is now active with:</strong></p>
        <ul>
          <li>Free subscription plan</li>
          <li>Access to basic content</li>
          <li>Personalized dashboard</li>
          <li>Free 24-hour Premium trial in 24 hours</li>
        </ul>
      </div>
      
      <p>Start exploring your financial growth journey today!</p>
      <br/>
      <p>Best regards,<br/>The MoneyNow Wealth Team</p>
    </div>
  `,
});
