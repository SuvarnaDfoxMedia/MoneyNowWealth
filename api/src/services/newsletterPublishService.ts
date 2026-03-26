import NewsletterPublish, {
  INewsletterPublish,
} from "../models/newsletterPublishModel";
import { Newsletter } from "../models/newsletterModel";
import { getResponseEmailService } from "./getResponseEmailService";
import fs from "fs";
import path from "path";

interface GetNewsletterPublishParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "draft" | "scheduled" | "published";
  frequency?: "daily" | "weekly" | "monthly";
  includeDeleted?: boolean;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  isAdmin?: boolean;
}

interface PaginationResult<T> {
  newsletters: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

const VALID_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
const VALID_SEND_STATUSES = ["scheduled", "published"] as const;

const isDueForPublishing = (publishDate: Date, now = new Date()) =>
  publishDate <= now;

const resolveStatusForPublishDate = (
  status: INewsletterPublish["status"] | undefined,
  publishDate: Date,
  now = new Date(),
): INewsletterPublish["status"] => {
  if (status === "draft") {
    return "draft";
  }

  return isDueForPublishing(publishDate, now) ? "published" : "scheduled";
};

const canSendForStatus = (status: INewsletterPublish["status"]) =>
  status === "scheduled" || status === "published";

const queueAutoSend = (id: string, source: string) => {
  setTimeout(() => {
    newsletterPublishService.sendNewsletterEmails(id).catch((error) => {
      console.error(`Failed to auto-send newsletter after ${source}:`, error);
    });
  }, 1000);
};

export const newsletterPublishService = {
  getAll: async ({
    page = 1,
    limit = 10,
    search = "",
    status,
    frequency,
    includeDeleted = false,
    sortField = "publish_date",
    sortOrder = "desc",
    isAdmin = false,
  }: GetNewsletterPublishParams): Promise<
    PaginationResult<INewsletterPublish>
  > => {
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (!includeDeleted) filter.is_deleted = false;

    if (!isAdmin) {
      filter.is_active = true;
      filter.status = "published";
    } else if (status) {
      filter.status = status;
    }

    if (frequency) filter.frequency = frequency;

    if (search.trim()) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { frequency: { $regex: search, $options: "i" } },
      ];
    }

    const sortConfig: Record<string, 1 | -1> = {};
    sortConfig[sortField] = sortOrder === "desc" ? -1 : 1;

    const [newsletters, total] = await Promise.all([
      NewsletterPublish.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsletterPublish.countDocuments(filter),
    ]);

    return {
      newsletters,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  },

  getById: async (id: string): Promise<INewsletterPublish | null> => {
    return NewsletterPublish.findOne({
      _id: id,
      is_deleted: false,
    }).lean();
  },

  getActiveById: async (id: string): Promise<INewsletterPublish | null> => {
    return NewsletterPublish.findOne({
      _id: id,
      is_deleted: false,
      is_active: true,
      status: "published",
    }).lean();
  },

  create: async (
    data: Partial<INewsletterPublish>,
  ): Promise<INewsletterPublish> => {
    if (!data.title || !data.publish_date || !data.pdf_file) {
      throw new Error("Title, publish date, and file are required");
    }

    if (!data.frequency) data.frequency = "daily";

    if (!VALID_FREQUENCIES.includes(data.frequency)) {
      throw new Error("Invalid frequency");
    }

    const publishDate = new Date(data.publish_date);
    const now = new Date();

    data.status = resolveStatusForPublishDate(data.status, publishDate, now);

    const newsletter = new NewsletterPublish({
      ...data,
      publish_date: publishDate,
      is_email_sent: false,
      is_deleted: false,
    });

    await newsletter.save();

    if (newsletter.status === "published" && !newsletter.is_email_sent) {
      queueAutoSend(newsletter._id.toString(), "create");
    }

    return newsletter;
  },

  update: async (
    id: string,
    updateData: Partial<INewsletterPublish>,
  ): Promise<INewsletterPublish | null> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) throw new Error("Newsletter not found");

    if (
      updateData.frequency &&
      !VALID_FREQUENCIES.includes(updateData.frequency)
    ) {
      throw new Error("Invalid frequency");
    }

    const now = new Date();
    const effectivePublishDate = updateData.publish_date
      ? new Date(updateData.publish_date)
      : newsletter.publish_date;

    if (updateData.status !== undefined || updateData.publish_date) {
      updateData.status = resolveStatusForPublishDate(
        updateData.status ?? newsletter.status,
        effectivePublishDate,
        now,
      );
    }

    let oldFilePath: string | null = null;
    if (updateData.pdf_file && updateData.pdf_file !== newsletter.pdf_file) {
      oldFilePath = path.join(
        process.cwd(),
        "uploads",
        "newsletters",
        newsletter.pdf_file,
      );
    }

    Object.assign(newsletter, updateData);
    newsletter.updated_at = now;

    await newsletter.save();

    if (newsletter.status === "published" && !newsletter.is_email_sent) {
      queueAutoSend(id, "update");
    }

    if (oldFilePath && fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error("File delete error:", err);
      }
    }

    return newsletter;
  },

  sendNewsletterEmails: async (id: string) => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) throw new Error("Newsletter not found");

    if (newsletter.is_email_sent) {
      throw new Error("Emails already sent");
    }

    const now = new Date();
    if (newsletter.publish_date > now) {
      throw new Error("Publish date not reached yet");
    }

    if (!canSendForStatus(newsletter.status)) {
      throw new Error("Only scheduled or published newsletters can be sent");
    }

    if (newsletter.status !== "published") {
      newsletter.status = "published";
      newsletter.updated_at = now;
      await newsletter.save();
    }

    const subscribers = await Newsletter.find({
      is_deleted: false,
      email: { $exists: true, $ne: "" },
    }).select("email name");

    if (!subscribers.length) {
      throw new Error("No subscribers found");
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      "newsletters",
      newsletter.pdf_file,
    );

    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    const emails = subscribers
      .map((subscriber) => subscriber.email)
      .filter((email): email is string => !!email && email.includes("@"));

    const fileUrl = `${process.env.BASE_URL}/uploads/newsletters/${newsletter.pdf_file}`;
    const result = await getResponseEmailService.sendNewsletterBulk(
      emails,
      newsletter.title,
      fileUrl,
    );

    if (result.successful === 0) {
      throw new Error("Failed to send newsletter emails");
    }

    newsletter.is_email_sent = true;
    newsletter.email_sent_at = new Date();
    newsletter.total_recipients = emails.length;
    newsletter.status = "published";
    newsletter.updated_at = new Date();

    await newsletter.save();

    return {
      success: result.successful > 0,
      message: `Sent to ${result.successful}`,
      totalRecipients: emails.length,
      successful: result.successful,
      failed: result.failed,
    };
  },

  publishNow: async (id: string): Promise<INewsletterPublish> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) throw new Error("Not found");

    newsletter.status = "published";
    newsletter.publish_date = new Date();
    newsletter.is_email_sent = false;
    newsletter.updated_at = new Date();

    await newsletter.save();
    queueAutoSend(id, "publishNow");

    return newsletter;
  },

  schedule: async (
    id: string,
    publishDate: Date,
  ): Promise<INewsletterPublish> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) throw new Error("Not found");

    if (publishDate <= new Date()) {
      throw new Error("Future date required");
    }

    newsletter.status = "scheduled";
    newsletter.publish_date = publishDate;
    newsletter.is_email_sent = false;
    newsletter.updated_at = new Date();

    return newsletter.save();
  },

  softDelete: async (id: string) => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) throw new Error("Not found");

    newsletter.is_deleted = true;
    newsletter.deleted_at = new Date();
    newsletter.updated_at = new Date();

    return newsletter.save();
  },

  restore: async (id: string) => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) throw new Error("Not found");

    newsletter.is_deleted = false;
    newsletter.deleted_at = undefined;
    newsletter.updated_at = new Date();

    return newsletter.save();
  },

  getNewslettersReadyToSend: async () => {
    const now = new Date();

    return NewsletterPublish.find({
      is_deleted: false,
      is_email_sent: false,
      status: { $in: VALID_SEND_STATUSES },
      publish_date: { $lte: now },
    }).lean();
  },

  uploadFile: async (file: Express.Multer.File) => {
    if (!file) throw new Error("No file uploaded");

    return {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/newsletters/${file.filename}`,
    };
  },

  getFilePath: async (id: string): Promise<string | null> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter || !newsletter.pdf_file) return null;

    return path.join(
      process.cwd(),
      "uploads",
      "newsletters",
      newsletter.pdf_file,
    );
  },
};
