import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMfApiNavHistory extends Document {
  scheme_id: mongoose.Types.ObjectId;
  scheme_name: string;
  external_key: string;
  date: Date;
  nav: number;
  nav_change?: number | null;
  nav_change_pct?: number | null;
  created_at: Date;
  updated_at: Date;
}

const mfApiNavHistorySchema = new Schema<IMfApiNavHistory>(
  {
    scheme_id:    { type: Schema.Types.ObjectId, ref: "MfApiScheme", required: true, index: true },
    scheme_name:  { type: String, trim: true, default: "" },
    external_key: { type: String, trim: true, default: "", index: true },
    date:         { type: Date, required: true, index: true },
    nav:          { type: Number, required: true },
    nav_change:   { type: Number, default: null },
    nav_change_pct: { type: Number, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfApiNavHistorySchema.index({ scheme_id: 1, date: -1 }, { unique: true });
mfApiNavHistorySchema.index({ external_key: 1, date: -1 });
mfApiNavHistorySchema.index({ date: -1 });

const MfApiNavHistory: Model<IMfApiNavHistory> =
  mongoose.models.MfApiNavHistory ||
  mongoose.model<IMfApiNavHistory>(
    "MfApiNavHistory",
    mfApiNavHistorySchema,
    "mf_api_nav_history",
  );

export default MfApiNavHistory;
