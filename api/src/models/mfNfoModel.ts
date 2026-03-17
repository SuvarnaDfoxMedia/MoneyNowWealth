import mongoose, { Document, Schema, Model } from "mongoose";

export interface IMFNfo extends Document {
  fund_name: string;
  amc_id: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  fund_objective_short?: string;
  subscription_start_date?: Date | null;
  subscription_end_date?: Date | null;
  min_investment?: number | null;
  benchmark?: string;
  risk_level?: string;
  is_open: boolean;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mfNfoSchema = new Schema<IMFNfo>(
  {
    fund_name: { type: String, required: true, trim: true, index: true },
    amc_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFAmc", required: true, index: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFCategory", required: true, index: true },
    fund_objective_short: { type: String, trim: true, default: "" },
    subscription_start_date: { type: Date, default: null },
    subscription_end_date: { type: Date, default: null },
    min_investment: { type: Number, default: null },
    benchmark: { type: String, trim: true, default: "" },
    risk_level: { type: String, trim: true, default: "" },
    is_open: { type: Boolean, default: true, index: true },
    is_active: { type: Number, default: 1, index: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfNfoSchema.index({ is_open: 1, subscription_end_date: 1 });

const MFNfo: Model<IMFNfo> =
  mongoose.models.MFNfo || mongoose.model<IMFNfo>("MFNfo", mfNfoSchema);

export default MFNfo;
