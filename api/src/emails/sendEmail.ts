import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { SendEmailParams, EmailAttachment } from "./types";

dotenv.config();

export const sendEmail = async ({
  to,
  subject,
  text = "",
  html = "",
  attachments = [],
}: SendEmailParams): Promise<void> => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP configuration missing. Ensure SMTP_HOST, SMTP_USER, and SMTP_PASS are set in .env",
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    const recipients = Array.isArray(to) ? to : [to];
    const recipientString = recipients.join(", ");

    await transporter.sendMail({
      from: `"MoneyNow Wealth" <${user}>`,
      to: recipientString,
      subject,
      text,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.log(
      `EMAIL_SENT_SMTP recipients=${recipients.length} to=${recipientString}`,
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`EMAIL_FAILED channel=smtp message=${err.message}`);
    } else {
      console.error("EMAIL_FAILED channel=smtp", err);
    }
    throw err;
  }
};
