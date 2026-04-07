import mongoose, { Document, Model, Schema, Types } from "mongoose";

interface IEnquiryReadEntry {
  userId: Types.ObjectId;
  readAt: Date;
}

export interface IWhoWeWorkWithEnquiry extends Document {
  full_name: string;
  email: string;
  mobile: string;
  country_code: string;
  preference: string;
  persona_id: string;
  persona_label: string;
  status: "new" | "in-progress" | "resolved";
  readBy: IEnquiryReadEntry[];
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

const enquiryReadSchema = new Schema<IEnquiryReadEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const whoWeWorkWithEnquirySchema = new Schema<IWhoWeWorkWithEnquiry>(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    country_code: { type: String, required: true, trim: true },
    preference: { type: String, required: true, trim: true },
    persona_id: { type: String, required: true, trim: true },
    persona_label: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved"],
      default: "new",
    },
    readBy: {
      type: [enquiryReadSchema],
      default: [],
    },
    is_active: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

whoWeWorkWithEnquirySchema.pre<IWhoWeWorkWithEnquiry>(
  "save",
  function saveHook(next) {
    this.updated_at = new Date();
    next();
  },
);

whoWeWorkWithEnquirySchema.index({ created_at: -1 });
whoWeWorkWithEnquirySchema.index({ "readBy.userId": 1 });

export const WhoWeWorkWithEnquiry: Model<IWhoWeWorkWithEnquiry> =
  mongoose.models.WhoWeWorkWithEnquiry ||
  mongoose.model<IWhoWeWorkWithEnquiry>(
    "WhoWeWorkWithEnquiry",
    whoWeWorkWithEnquirySchema,
  );
