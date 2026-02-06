import { AuthEmailData } from "../../types";

export const userRegisteredTemplate = (data: AuthEmailData) => ({
  subject: ` New User Registration - MoneyNow Wealth`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: #f8f9fa;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #198754; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 30px -30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New User Registration</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
              System Notification
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <div style="display: inline-flex; align-items: center; background: #e8f5e9; color: #2e7d32; padding: 10px 25px; border-radius: 25px; font-size: 14px; font-weight: bold;">
              <span style="margin-right: 10px; font-size: 18px;"></span>
              New Account Created
            </div>
          </div>
          
          <h2 style="color: #333; margin: 20px 0 10px 0; font-size: 22px;">
            Welcome, ${data.userName}!
          </h2>
          <p style="color: #666; font-size: 16px; margin: 10px 0 20px 0;">
            A new user has successfully registered on the platform
          </p>
        </div>
        
        <!-- Registration Details -->
        <div style="background: #f0f7ff; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #198754;">
          <h3 style="color: #198754; margin-top: 0; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #d1e3ff;">
            Registration Information
          </h3>
          
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px; margin-bottom: 15px;">
            <div style="color: #666; font-weight: bold;">User Name:</div>
            <div style="color: #333;">${data.userName}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px; margin-bottom: 15px;">
            <div style="color: #666; font-weight: bold;">Registration Time:</div>
            <div style="color: #333;">${new Date().toLocaleString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            })}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px;">
            <div style="color: #666; font-weight: bold;">Status:</div>
            <div style="color: #333;">
              <span style="display: inline-block; background: #d4edda; color: #155724; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                 Active
              </span>
            </div>
          </div>
        </div>
        
        <!-- Auto-Assigned Features -->
        <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e0e0e0;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 20px;">Auto-Assigned Features</h3>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
            <div style="text-align: center;">
              <div style="background: #e3f2fd; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                <span style="color: #1976d2; font-size: 24px;">🆓</span>
              </div>
              <div style="color: #333; font-weight: bold; margin-bottom: 5px;">Free Plan</div>
              <div style="color: #666; font-size: 13px;">30-day access</div>
            </div>
            
            <div style="text-align: center;">
              <div style="background: #e8f5e9; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                <span style="color: #2e7d32; font-size: 24px;"></span>
              </div>
              <div style="color: #333; font-weight: bold; margin-bottom: 5px;">Premium Trial</div>
              <div style="color: #666; font-size: 13px;">In 24 hours</div>
            </div>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin-top: 20px; border: 1px solid #ffeaa7;">
            <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
              <strong>Note:</strong> User will automatically receive a 24-hour Premium trial after 24 hours if they remain on Free plan.
            </p>
          </div>
        </div>
        
        <!-- Admin Actions -->
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #dee2e6;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 20px;">Available Actions</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
            <a href="${process.env.ADMIN_URL || "#"}/users" style="display: inline-block; padding: 10px 20px; background: #0d6efd; color: white; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: bold;">
              View User Profile
            </a>
            <a href="${process.env.ADMIN_URL || "#"}/subscriptions/assign" style="display: inline-block; padding: 10px 20px; background: #6f42c1; color: white; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: bold;">
              Assign Subscription
            </a>
            <a href="${process.env.ADMIN_URL || "#"}/analytics" style="display: inline-block; padding: 10px 20px; background: #198754; color: white; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: bold;">
              View Analytics
            </a>
          </div>
        </div>
        
        <!-- System Info -->
        <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h4 style="color: #495057; margin-top: 0; margin-bottom: 10px; font-size: 14px;">System Information</h4>
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; font-size: 13px;">
            <div style="color: #6c757d;">Notification ID:</div>
            <div style="color: #333;">REG-${Date.now().toString(36).toUpperCase()}</div>
            <div style="color: #6c757d;">Trigger:</div>
            <div style="color: #333;">User Registration Webhook</div>
            <div style="color: #6c757d;">Environment:</div>
            <div style="color: #333;">${process.env.NODE_ENV || "production"}</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
            This is an automated notification from the MoneyNow Wealth admin system
          </p>
          <div style="display: flex; justify-content: center; gap: 15px; margin: 15px 0; font-size: 13px;">
            <a href="${process.env.ADMIN_URL || "#"}" style="color: #6c757d; text-decoration: none;">Admin Dashboard</a>
            <span style="color: #ccc;">|</span>
            <a href="${process.env.ADMIN_URL || "#"}/settings/notifications" style="color: #6c757d; text-decoration: none;">Notification Settings</a>
            <span style="color: #ccc;">|</span>
            <a href="mailto:admin@moneynowwealth.com" style="color: #6c757d; text-decoration: none;">Contact Admin</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} MoneyNow Wealth Admin System • This email was auto-generated
          </p>
        </div>
        
      </div>
    </div>
  `,
});
