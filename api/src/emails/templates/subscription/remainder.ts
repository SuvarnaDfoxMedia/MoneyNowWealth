export const subscriptionReminderTemplate = (data: any) => ({
  subject: ` Reminder: Your ${data.planName} subscription ends in ${data.daysRemaining} days`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #FF9800;">Hello ${data.userName},</h2>
      <p>This is a reminder that your <strong>${data.planName}</strong> subscription will expire in <strong>${data.daysRemaining} days</strong>.</p>
      <p>Expiry date: <strong>${data.endDate.toLocaleDateString()}</strong></p>
      ${
        data.planName.includes("Premium")
          ? `<div style="background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7;">
               <p><strong>Important:</strong> To continue enjoying premium features, please renew your subscription before it expires.</p>
             </div>`
          : `<p>After expiration, you'll still have access to free content.</p>`
      }
      <br/>
      <p style="color: #666;">Don't miss out on your favorite content!</p>
      <br/>
      <p>Best regards,<br/>The Team</p>
    </div>
  `,
});
