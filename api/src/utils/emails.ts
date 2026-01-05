import nodemailer from "nodemailer";

export interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({
  to,
  subject,
  text = "",
  html = "",
}: SendEmailParams): Promise<void> => {
  // Validate required environment variables
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP configuration missing. Ensure SMTP_HOST, SMTP_USER, and SMTP_PASS are set in .env"
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // SSL if port 465
      auth: { user, pass },
      tls: { rejectUnauthorized: false }, // dev only
    });

    await transporter.sendMail({
      from: `"MoneyNow Wealth" <${user}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Email sending error:", err.message);
    } else {
      console.error("Email sending error:", err);
    }
    throw err; // rethrow to allow upstream handling
  }
};
