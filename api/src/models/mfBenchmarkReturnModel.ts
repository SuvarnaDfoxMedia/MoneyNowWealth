import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMFBenchmarkReturn extends Document {
  benchmark_id: mongoose.Types.ObjectId;
  date: Date;
  trailing?: Record<string, number | null>;
  annual?: {
    ytd?: number | null;
    yearly_returns?: Map<string, number | null> | Record<string, number | null>;
  };
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
      yearly_returns: { type: Map, of: Number, default: () => ({}) },
    },
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
