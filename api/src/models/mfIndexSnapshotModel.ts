import mongoose, { Document, Schema, Model } from "mongoose";

export interface IMFIndexSnapshot extends Document {
  benchmark_index_name: string;
  main_category_id?: mongoose.Types.ObjectId | null;
  category_id?: mongoose.Types.ObjectId | null;
  returns?: {
    y1?: number | null;
    y3?: number | null;
    y5?: number | null;
    y10?: number | null;
  };
  last_updated_date: Date;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mfIndexSnapshotSchema = new Schema<IMFIndexSnapshot>(
  {
    benchmark_index_name: { type: String, required: true, trim: true, index: true },
    main_category_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFMainCategory", default: null, index: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFCategory", default: null, index: true },
    returns: {
      y1: { type: Number, default: null },
      y3: { type: Number, default: null },
      y5: { type: Number, default: null },
      y10: { type: Number, default: null },
    },
    last_updated_date: { type: Date, required: true, index: true },
    is_active: { type: Number, default: 1, index: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfIndexSnapshotSchema.index({ benchmark_index_name: 1, last_updated_date: -1 }, { unique: true });
mfIndexSnapshotSchema.index({ main_category_id: 1, last_updated_date: -1 });

const MFIndexSnapshot: Model<IMFIndexSnapshot> =
  mongoose.models.MFIndexSnapshot ||
  mongoose.model<IMFIndexSnapshot>("MFIndexSnapshot", mfIndexSnapshotSchema);

export default MFIndexSnapshot;
