import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMFBenchmark extends Document {
  name: string;
  category?: string;
  main_category_id?: mongoose.Types.ObjectId | null;
  category_id?: mongoose.Types.ObjectId | null;
  type: string;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mfBenchmarkSchema = new Schema<IMFBenchmark>(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, trim: true, default: "" },
    main_category_id: { type: Schema.Types.ObjectId, ref: "MFMainCategory", default: null, index: true },
    category_id: { type: Schema.Types.ObjectId, ref: "MFCategory", default: null, index: true },
    type: { type: String, trim: true, default: "index" },
    is_active: { type: Number, default: 1, index: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfBenchmarkSchema.index({ name: 1, type: 1, is_deleted: 1 }, { unique: true });

const MFBenchmark: Model<IMFBenchmark> =
  mongoose.models.MFBenchmark ||
  mongoose.model<IMFBenchmark>("MFBenchmark", mfBenchmarkSchema, "mfbenchmarks");

export default MFBenchmark;
