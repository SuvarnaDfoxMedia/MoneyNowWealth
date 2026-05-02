import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISeo extends Document {
  name: string;
  page_url: string;
  seo_title?: string;
  meta_description?: string;
  keywords?: string;
  page_schema?: string;
  og_tag?: string;
  status: "draft" | "published" | "archived";
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const normalizePath = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "/";

  const withoutDomain = trimmed.replace(/^https?:\/\/[^/]+/i, "");
  const withSlash = withoutDomain.startsWith("/") ? withoutDomain : `/${withoutDomain}`;
  const cleanPath = withSlash.replace(/\/+$/, "");
  return cleanPath || "/";
};

const seoSchema = new Schema<ISeo>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "",
      index: true,
    },
    page_url: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    seo_title: { type: String, trim: true, default: "" },
    meta_description: { type: String, trim: true, default: "" },
    keywords: { type: String, trim: true, default: "" },
    page_schema: { type: String, default: "" },
    og_tag: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    is_active: {
      type: Number,
      default: 1,
      index: true,
    },
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
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

seoSchema.pre("validate", function (next) {
  if (this.page_url) {
    this.page_url = normalizePath(this.page_url);
  }
  next();
});

seoSchema.pre(/^find/, function (this: any, next) {
  this.where({ is_deleted: false });
  next();
});

seoSchema.index({ page_url: 1, is_deleted: 1 }, { unique: true });
seoSchema.index({ name: 1, seo_title: 1, status: 1, is_active: 1, created_at: -1 });

const Seo: Model<ISeo> =
  mongoose.models.Seo || mongoose.model<ISeo>("Seo", seoSchema);

export { normalizePath };
export default Seo;
