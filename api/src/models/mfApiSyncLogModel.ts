import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMfApiSyncLog extends Document {
  action: string;
  scheme_id?: mongoose.Types.ObjectId | null;
  scheme_name?: string;
  external_scheme_id?: string;
  status: "success" | "failed" | "running" | "queued" | string;
  message?: string;
  error?: string;
  payload?: mongoose.Schema.Types.Mixed;
  response?: mongoose.Schema.Types.Mixed;
  created_by_role?: string;
  created_by_user?: mongoose.Types.ObjectId | null;
  created_at: Date;
  updated_at: Date;
}

const mfApiSyncLogSchema = new Schema<IMfApiSyncLog>(
  {
    action: { type: String, required: true, trim: true, index: true },
    scheme_id: { type: mongoose.Schema.Types.ObjectId, ref: "MfApiScheme", default: null, index: true },
    scheme_name: { type: String, trim: true, default: "", index: true },
    external_scheme_id: { type: String, trim: true, default: "", index: true },
    status: { type: String, trim: true, default: "queued", index: true },
    message: { type: String, trim: true, default: "" },
    error: { type: String, trim: true, default: "" },
    payload: { type: Schema.Types.Mixed, default: null },
    response: { type: Schema.Types.Mixed, default: null },
    created_by_role: { type: String, trim: true, default: "" },
    created_by_user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfApiSyncLogSchema.index({ created_at: -1 });
mfApiSyncLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
mfApiSyncLogSchema.index({ action: 1, status: 1, created_at: -1 });

const MfApiSyncLog: Model<IMfApiSyncLog> =
  (mongoose.models.MfApiSyncLog as Model<IMfApiSyncLog>) ||
  mongoose.model<IMfApiSyncLog>("MfApiSyncLog", mfApiSyncLogSchema, "mf_api_sync_logs");

export default MfApiSyncLog;
