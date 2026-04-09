import mongoose, { Document, Schema, Model } from "mongoose";
import { capitalizePlugin } from "../plugins/capitalize.plugin";

/* ===============================
   Interface: Newsletter Publication
   =============================== */
export interface INewsletterPublish extends Document {
  title: string;
  description?: string;

  // Publication metadata
  issue_number: number; // Auto-incremented: NWL-001, NWL-002
  publish_date: Date;
  status: "draft" | "scheduled" | "published";

  //  Newsletter Type / Frequency
  frequency: "daily" | "weekly" | "monthly";

  // File information
  pdf_file: string; // PDF filename in uploads/newsletters/
  file_size?: number; // File size in bytes

  // Email tracking
  is_email_sent: boolean;
  email_sent_at?: Date;
  total_recipients?: number;

  // Audit fields
  is_active: boolean;
  is_deleted: boolean;
  deleted_at?: Date; //soft delete timestamp
  created_at: Date;
  updated_at: Date;
}

/* ===============================
   Schema Definition
   =============================== */
const newsletterPublishSchema = new Schema<INewsletterPublish>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    issue_number: {
      type: Number,
      unique: true,
      index: true,
    },

    publish_date: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["draft", "scheduled", "published"],
      default: "draft",
      index: true,
    },

    //  Newsletter Type / Frequency Added
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
      required: true,
      index: true,
    },

    pdf_file: {
      type: String,
      required: true,
      trim: true,
    },

    file_size: {
      type: Number,
      default: 0,
    },

    // Email tracking
    is_email_sent: {
      type: Boolean,
      default: false,
      index: true,
    },

    email_sent_at: {
      type: Date,
      default: null,
    },

    total_recipients: {
      type: Number,
      default: 0,
    },

    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Soft delete
    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ===============================
   Capitalization Plugin - COMPLETE except list
   =============================== */
newsletterPublishSchema.plugin(capitalizePlugin, {
  except: [
    // File field
    "pdf_file",

    "status",
    "frequency",

    // Number fields
    "issue_number",
    "file_size",
    "total_recipients",

    // Boolean fields
    "is_email_sent",
    "is_active",
    "is_deleted",

    // Date fields
    "publish_date",
    "email_sent_at",
    "deleted_at",
    "created_at",
    "updated_at",

    // MongoDB internal fields
    "_id",
    "__v",
  ],
  descriptionFields: ["description"],
});

/* ===============================
   Pre-save Hook: Auto-generate issue number
   =============================== */
newsletterPublishSchema.pre<INewsletterPublish>("save", async function (next) {
  if (!this.issue_number) {
    const lastIssue = await mongoose.models.NewsletterPublish.findOne(
      {},
      { issue_number: 1 },
    )
      .sort({ issue_number: -1 })
      .lean<{ issue_number?: number }>();

    const lastNumber = lastIssue?.issue_number ?? 0;

    this.issue_number = lastNumber + 1;
  }
  next();
});

/* ===============================
   Virtual: Issue code (NWL-001 format)
   =============================== */
newsletterPublishSchema.virtual("issue_code").get(function () {
  return `NWL-${String(this.issue_number).padStart(3, "0")}`;
});

/* ===============================
   Virtual: Public PDF URL
   =============================== */
newsletterPublishSchema.virtual("pdf_url").get(function () {
  if (!this.pdf_file) return null;
  return `/uploads/newsletters/${this.pdf_file}`;
});

/* ===============================
   Virtual: Is published and ready
   =============================== */
newsletterPublishSchema.virtual("is_published").get(function () {
  return this.status === "published" && this.is_email_sent === true;
});

/* ===============================
   Virtual: Can be sent (scheduled or published without email)
   =============================== */
newsletterPublishSchema.virtual("can_send_email").get(function () {
  const now = new Date();
  return (
    (this.status === "scheduled" && this.publish_date <= now) ||
    (this.status === "published" && !this.is_email_sent)
  );
});

/* ===============================
   Indexes for performance
   =============================== */
newsletterPublishSchema.index({ status: 1, publish_date: 1 });
newsletterPublishSchema.index({ is_email_sent: 1, publish_date: 1 });
newsletterPublishSchema.index({ is_deleted: 1, status: 1 });
newsletterPublishSchema.index({ frequency: 1, publish_date: 1 });

/* ===============================
   Model Export
   =============================== */
const NewsletterPublish: Model<INewsletterPublish> =
  mongoose.models.NewsletterPublish ||
  mongoose.model<INewsletterPublish>(
    "NewsletterPublish",
    newsletterPublishSchema,
  );

export default NewsletterPublish;
