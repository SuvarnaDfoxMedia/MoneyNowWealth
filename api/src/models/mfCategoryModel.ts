import mongoose, { Document, Schema, Model } from "mongoose";

const yearValueMapField = {
  type: Map,
  of: Number,
  default: () => ({}),
};

const categoryReturnsSchema = new Schema(
  {
    w1: { type: Number, default: null },
    m1: { type: Number, default: null },
    m3: { type: Number, default: null },
    m6: { type: Number, default: null },
    y1: { type: Number, default: null },
    y3: { type: Number, default: null },
    y5: { type: Number, default: null },
    y10: { type: Number, default: null },
    ytd: { type: Number, default: null },
    annual: yearValueMapField,
  },
  { _id: false },
);

export interface IMFCategory extends Document {
  name: string;
  main_category_id: mongoose.Types.ObjectId;
  description?: string;
  benchmark_index_name?: string;
  benchmark_return_type?: "Annual" | "Trailing" | "";
  benchmark_returns?: {
    w1?: number | null;
    m1?: number | null;
    m3?: number | null;
    m6?: number | null;
    y1?: number | null;
    y3?: number | null;
    y5?: number | null;
    y10?: number | null;
    ytd?: number | null;
    annual?: Map<string, number | null> | Record<string, number | null>;
  };
  category_average_returns?: {
    w1?: number | null;
    m1?: number | null;
    m3?: number | null;
    m6?: number | null;
    y1?: number | null;
    y3?: number | null;
    y5?: number | null;
    y10?: number | null;
    ytd?: number | null;
    annual?: Map<string, number | null> | Record<string, number | null>;
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
    benchmark_index_name: { type: String, trim: true, default: "" },
    benchmark_return_type: {
      type: String,
      enum: ["Annual", "Trailing", ""],
      default: "Trailing",
    },
    benchmark_returns: { type: categoryReturnsSchema, default: () => ({}) },
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
mfCategorySchema.index({ main_category_id: 1, "benchmark_returns.y3": -1 });

const MFCategory: Model<IMFCategory> =
  mongoose.models.MFCategory || mongoose.model<IMFCategory>("MFCategory", mfCategorySchema);

export default MFCategory;
