import mongoose, { Document, Schema, Model } from "mongoose";

export interface IMFMainCategory extends Document {
  name: string;
  description?: string;
  sort_order?: number;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mfMainCategorySchema = new Schema<IMFMainCategory>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Number, default: 1, index: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfMainCategorySchema.index({ name: 1, is_active: 1, is_deleted: 1 });

const MFMainCategory: Model<IMFMainCategory> =
  mongoose.models.MFMainCategory ||
  mongoose.model<IMFMainCategory>("MFMainCategory", mfMainCategorySchema);

export default MFMainCategory;
