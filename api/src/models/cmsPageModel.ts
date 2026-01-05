import mongoose, { Document, Schema, Model, Query } from "mongoose";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const AutoIncrementFactory = require("mongoose-sequence");
const AutoIncrement = AutoIncrementFactory(mongoose);

// -------------------------
// Interfaces
// -------------------------
export interface ISection {
  title?: string;
  content?: string;
  images?: string[];
  videos?: string[];
  cta?: { text?: string; url?: string };
}

export interface IFaq {
  question?: string;
  answer?: string;
}

export interface ICmsPage extends Document {
  _id: mongoose.Types.ObjectId;
  page_code: string;
  page_number: number;
  title: string;
  slug: string;
  sections?: ISection[];
  faqs?: IFaq[];
  status: "draft" | "published" | "archived";
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// -------------------------
// Schema
// -------------------------
const cmsPageSchema = new Schema<ICmsPage>(
  {
    page_code: { type: String, unique: true, index: true },
    page_number: { type: Number, unique: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    sections: {
      type: [
        {
          title: String,
          content: String,
          images: [String],
          videos: [String],
          cta: { text: String, url: String },
        },
      ],
      default: [],
    },
    faqs: {
      type: [
        {
          question: String,
          answer: String,
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    is_active: { type: Number, default: 1 },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// -------------------------
// Apply Auto-Increment Plugin
// -------------------------
cmsPageSchema.plugin(AutoIncrement, {
  id: "cms_page_seq",
  inc_field: "page_number",
  start_seq: 1,
});

// -------------------------
// Post-save: generate page_code
// -------------------------
cmsPageSchema.post("save", async function (doc: ICmsPage) {
  if (!doc.page_code && doc.page_number) {
    const number = String(doc.page_number).padStart(3, "0");
    doc.page_code = `PAGE_${number}`;
    await doc.updateOne({ page_code: doc.page_code });
  }
});

// -------------------------
// Pre-find: exclude soft-deleted
// -------------------------
cmsPageSchema.pre<Query<ICmsPage[], ICmsPage>>(/^find/, function (this: Query<ICmsPage[], ICmsPage>, next: (err?: any) => void) {
  this.where({ is_deleted: false });
  next();
});

// -------------------------
// Pre deleteOne: soft delete
// -------------------------
cmsPageSchema.pre("deleteOne", { document: true, query: false }, async function (this: ICmsPage, next: (err?: any) => void) {
  this.is_deleted = true;
  this.is_active = 0;
  this.deleted_at = new Date();
  await this.save();
  next();
});

// -------------------------
// Indexes
// -------------------------
cmsPageSchema.index({ is_active: 1, is_deleted: 1, status: 1, created_at: -1 });

// -------------------------
// Static Method: softDelete
// -------------------------
interface CmsPageModel extends Model<ICmsPage> {
  softDelete(id: string): Promise<ICmsPage>;
}

cmsPageSchema.statics.softDelete = async function (id: string): Promise<ICmsPage> {
  const page = await this.findById(id);
  if (!page) throw new Error("CMS Page not found");
  page.is_deleted = true;
  page.is_active = 0;
  page.deleted_at = new Date();
  await page.save();
  return page;
};

// -------------------------
// Model Export
// -------------------------
const CmsPage: CmsPageModel = mongoose.model<ICmsPage, CmsPageModel>("CmsPage", cmsPageSchema);
export default CmsPage;
