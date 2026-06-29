import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { getSmtpConfig } from "../config/emailEnv";
import { SendEmailParams } from "./types";
import { logger } from "../utils/logger";

dotenv.config();

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

const createTransporter = async () => {
  const { host, port, user, pass } = getSmtpConfig();

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  await transporter.verify();
  logger.info(`SMTP transporter verified host=${host} port=${port}`);

  return transporter;
};

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = createTransporter().catch((error) => {
      transporterPromise = null;
      logger.error("SMTP transporter initialization failed: " + error);
      throw error;
    });
  }

  return transporterPromise;
};

export const sendEmail = async ({
  to,
  subject,
  text = "",
  html = "",
  attachments = [],
  metadata,
}: SendEmailParams): Promise<void> => {
  const transporter = await getTransporter();
  const { user } = getSmtpConfig();
  const recipients = Array.isArray(to) ? to : [to];
  const recipientString = recipients.join(", ");
  const attemptLabel = metadata?.type ? ` type=${metadata.type}` : "";

  try {
    logger.info(
      `EMAIL_SEND_ATTEMPT channel=smtp recipients=${recipients.length}${attemptLabel} to=${recipientString}`,
    );

    await transporter.sendMail({
      from: `"MoneyNow Wealth" <${user}>`,
      to: recipientString,
      subject,
      text,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    logger.info(
      `EMAIL_SENT_SMTP recipients=${recipients.length}${attemptLabel} to=${recipientString}`,
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(
        `EMAIL_FAILED channel=smtp recipients=${recipients.length}${attemptLabel} to=${recipientString} message=${err.message}`,
      );
    } else {
      logger.error(
        `EMAIL_FAILED channel=smtp recipients=${recipients.length}${attemptLabel} to=${recipientString}: ` +
        err
      );
    }
    throw err;
  }
};
