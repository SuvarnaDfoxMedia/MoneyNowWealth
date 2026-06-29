import { EmailJob } from "./types";
import { sendEmail } from "./sendEmail";
import { logger } from "../utils/logger";

class EmailQueue {
  private queue: EmailJob[] = [];
  private isProcessing = false;
  private maxRetries = 3;

  add(job: EmailJob): void {
    this.queue.push(job);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  addBulk(jobs: EmailJob[]): void {
    this.queue.push(...jobs);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const job = this.queue.shift();
        if (job) {
          await this.processJobWithRetry(job);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJobWithRetry(
    job: EmailJob,
    retryCount = 0,
  ): Promise<void> {
    try {
      if (Array.isArray(job.to)) {
        for (const recipient of job.to) {
          await sendEmail({
            to: recipient,
            subject: job.subject,
            html: job.html,
            text: job.text,
            attachments: job.attachments,
          });
        }
      } else {
        await sendEmail(job);
      }

      logger.info(` Email sent successfully: ${job.subject}`);
    } catch (error) {
      logger.error(
        ` Failed to send email (attempt ${retryCount + 1}/${this.maxRetries}): ` +
        error
      );

      if (retryCount < this.maxRetries) {
        setTimeout(
          () => {
            this.processJobWithRetry(job, retryCount + 1);
          },
          5000 * (retryCount + 1),
        ); // Exponential backoff
      } else {
        logger.error(` Max retries exceeded for email: ${job.subject}`);
        // TODO: Log to monitoring service or database
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
  }
}

export const emailQueue = new EmailQueue();
