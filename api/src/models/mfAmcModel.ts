import mongoose, { Document, Schema, Model } from "mongoose";

export interface IMFAmc extends Document {
  name: string;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mfAmcSchema = new Schema<IMFAmc>(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    is_active: { type: Number, default: 1, index: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

const MFAmc: Model<IMFAmc> =
  mongoose.models.MFAmc || mongoose.model<IMFAmc>("MFAmc", mfAmcSchema);

export default MFAmc;
