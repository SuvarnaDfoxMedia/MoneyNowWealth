import mongoose, { Document, Schema, Model } from "mongoose";

const yearValueMapField = {
  type: Map,
  of: Number,
  default: () => ({}),
};

const categoryReturnsSchema = new Schema(
  {
    trailing: {
      "1w": { type: Number, default: null },
      "1m": { type: Number, default: null },
      "3m": { type: Number, default: null },
      "6m": { type: Number, default: null },
      "1y": { type: Number, default: null },
      "3y": { type: Number, default: null },
      "5y": { type: Number, default: null },
      "10y": { type: Number, default: null },
      since_launch: { type: Number, default: null },
    },
    annual: {
      ytd: { type: Number, default: null },
      yearly_returns: yearValueMapField,
    },
  },
  { _id: false },
);

export interface IMFCategory extends Document {
  name: string;
  main_category_id: mongoose.Types.ObjectId;
  description?: string;
  category_average_returns?: {
    trailing?: Record<string, number | null>;
    annual?: {
      ytd?: number | null;
      yearly_returns?: Map<string, number | null> | Record<string, number | null>;
    };
  };
  category_returns?: {
    trailing?: Record<string, number | null>;
    annual?: {
      ytd?: number | null;
      yearly_returns?: Map<string, number | null> | Record<string, number | null>;
    };
  };
  risk_level?: string;
  suggested_use_case?: string;
  suggested_use_case_note?: string;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mfCategorySchema = new Schema<IMFCategory>(
  {
    name: { type: String, required: true, trim: true },
    main_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MFMainCategory",
      required: true,
      index: true,
    },
    description: { type: String, trim: true, default: "" },
    category_returns: { type: categoryReturnsSchema, default: () => ({}) },
    category_average_returns: { type: categoryReturnsSchema, default: () => ({}) },
    risk_level: { type: String, trim: true, default: "" },
    suggested_use_case: { type: String, trim: true, default: "" },
    suggested_use_case_note: { type: String, trim: true, default: "" },
    is_active: { type: Number, default: 1, index: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfCategorySchema.index({ main_category_id: 1, name: 1, is_active: 1, is_deleted: 1 });
mfCategorySchema.index({ main_category_id: 1, "category_average_returns.trailing.3y": -1 });

const MFCategory: Model<IMFCategory> =
  mongoose.models.MFCategory || mongoose.model<IMFCategory>("MFCategory", mfCategorySchema);

export default MFCategory;
