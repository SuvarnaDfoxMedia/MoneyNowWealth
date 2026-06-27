import NewsletterPublish, {
  INewsletterPublish,
} from "../models/newsletterPublishModel";
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
const IST_OFFSET_MINUTES = 5.5 * 60;

const normalizeToIstStartOfDay = (value: Date | string) => {
  const inputDate = new Date(value);

  if (Number.isNaN(inputDate.getTime())) {
    throw new Error("Invalid publish date");
  }

  const istTime = new Date(
    inputDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000,
  );

  return new Date(
    Date.UTC(
      istTime.getUTCFullYear(),
      istTime.getUTCMonth(),
      istTime.getUTCDate(),
      0,
      0,
      0,
      0,
    ) -
      IST_OFFSET_MINUTES * 60 * 1000,
  );
};

const getIstStartOfNextDay = (value = new Date()) => {
  const startOfDay = normalizeToIstStartOfDay(value);
  return new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
};

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
    const finalLimit = Math.min(Math.max(Number(limit) || 10, 1), 200);
    const skip = (page - 1) * finalLimit;
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
    const ALLOWED_SORT_FIELDS = ["publish_date", "created_at", "updated_at", "title", "frequency", "status"];
    const safeSortField = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : "publish_date";
    sortConfig[safeSortField] = sortOrder === "desc" ? -1 : 1;

    const [newsletters, total] = await Promise.all([
      NewsletterPublish.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(finalLimit)
        .lean(),
      NewsletterPublish.countDocuments(filter),
    ]);

    return {
      newsletters,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / finalLimit),
      limit: finalLimit,
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

    const publishDate = normalizeToIstStartOfDay(data.publish_date);
    const now = new Date();

    data.status = resolveStatusForPublishDate(data.status, publishDate, now);

    const newsletter = new NewsletterPublish({
      ...data,
      publish_date: publishDate,
      is_email_sent: false,
      is_deleted: false,
    });

    await newsletter.save();
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
      ? normalizeToIstStartOfDay(updateData.publish_date)
      : newsletter.publish_date;

    if (updateData.status !== undefined || updateData.publish_date) {
      updateData.status = resolveStatusForPublishDate(
        updateData.status ?? newsletter.status,
        effectivePublishDate,
        now,
      );
    }

    if (updateData.publish_date) {
      updateData.publish_date = effectivePublishDate;
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

    if (oldFilePath && fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error("File delete error:", err);
      }
    }

    return newsletter;
  },

  publishNow: async (id: string): Promise<INewsletterPublish> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) throw new Error("Not found");

    newsletter.status = "published";
    newsletter.publish_date = new Date();
    newsletter.updated_at = new Date();

    await newsletter.save();
    return newsletter;
  },

  schedule: async (
    id: string,
    publishDate: Date,
  ): Promise<INewsletterPublish> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) throw new Error("Not found");

    const normalizedPublishDate = normalizeToIstStartOfDay(publishDate);
    const nextStatus = resolveStatusForPublishDate(
      "scheduled",
      normalizedPublishDate,
      new Date(),
    );

    newsletter.status = nextStatus;
    newsletter.publish_date = normalizedPublishDate;
    newsletter.updated_at = new Date();

    return newsletter.save();
  },

  publishDueNewsletters: async () => {
    const now = new Date();
    const publishCutoff = getIstStartOfNextDay(now);

    const result = await NewsletterPublish.updateMany(
      {
        is_deleted: false,
        status: "scheduled",
        publish_date: { $lt: publishCutoff },
      },
      {
        $set: {
          status: "published",
          updated_at: now,
        },
      },
    );

    return result.modifiedCount;
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
