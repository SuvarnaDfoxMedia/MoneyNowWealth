import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMFBenchmarkReturn extends Document {
  benchmark_id: mongoose.Types.ObjectId;
  date: Date;
  return_1d?: number | null;
  return_1w?: number | null;
  return_1m?: number | null;
  return_3m?: number | null;
  return_6m?: number | null;
  return_ytd?: number | null;
  return_1y?: number | null;
  return_3y?: number | null;
  return_5y?: number | null;
  return_10y?: number | null;
  annual?: Map<string, number | null> | Record<string, number | null>;
  return_since_inception?: number | null;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mfBenchmarkReturnSchema = new Schema<IMFBenchmarkReturn>(
  {
    benchmark_id: {
      type: Schema.Types.ObjectId,
      ref: "MFBenchmark",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    return_1d: { type: Number, default: null },
    return_1w: { type: Number, default: null },
    return_1m: { type: Number, default: null },
    return_3m: { type: Number, default: null },
    return_6m: { type: Number, default: null },
    return_ytd: { type: Number, default: null },
    return_1y: { type: Number, default: null },
    return_3y: { type: Number, default: null },
    return_5y: { type: Number, default: null },
    return_10y: { type: Number, default: null },
    annual: { type: Map, of: Number, default: () => ({}) },
    return_since_inception: { type: Number, default: null },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfBenchmarkReturnSchema.index(
  { benchmark_id: 1, date: -1, is_deleted: 1 },
  { unique: true },
);

const MFBenchmarkReturn: Model<IMFBenchmarkReturn> =
  mongoose.models.MFBenchmarkReturn ||
  mongoose.model<IMFBenchmarkReturn>(
    "MFBenchmarkReturn",
    mfBenchmarkReturnSchema,
    "mfbenchmarkreturns",
  );

export default MFBenchmarkReturn;
