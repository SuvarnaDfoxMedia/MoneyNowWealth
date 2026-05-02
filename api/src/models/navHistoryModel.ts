import mongoose, { Document, Model, Schema } from "mongoose";

export interface INavHistory extends Document {
  schemeId: mongoose.Types.ObjectId;
  date: Date;
  nav: number;
  totalAssets: number;
  totalLiabilities: number;
  totalUnits: number;
  created_at: Date;
  updated_at: Date;
}

const navHistorySchema = new Schema<INavHistory>(
  {
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MFFund",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    nav: { type: Number, required: true },
    totalAssets: { type: Number, required: true },
    totalLiabilities: { type: Number, required: true },
    totalUnits: { type: Number, required: true },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

navHistorySchema.index({ schemeId: 1, date: 1 }, { unique: true });
navHistorySchema.index({ date: -1 });

const NavHistory: Model<INavHistory> =
  (mongoose.models.NavHistory as Model<INavHistory>) ||
  mongoose.model<INavHistory>("NavHistory", navHistorySchema, "nav_histories");

export default NavHistory;
