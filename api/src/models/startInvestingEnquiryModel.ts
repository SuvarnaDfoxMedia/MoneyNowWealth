import mongoose, { Document, Model, Schema, Types } from "mongoose";

interface IEnquiryReadEntry {
  userId: Types.ObjectId;
  readAt: Date;
}

export interface IStartInvestingEnquiry extends Document {
  full_name: string;
  email: string;
  mobile: string;
  country_code: string;
  goal: "childs_future" | "retirement" | "growing_savings" | "not_sure";
  calculator_type?: "childrenEducation" | "retirement" | "targetSip" | null;
  calculator_inputs?: Record<string, number | string>;
  calculator_result?: Record<string, number>;
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

const startInvestingEnquirySchema = new Schema<IStartInvestingEnquiry>(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    country_code: { type: String, required: true, trim: true },
    goal: {
      type: String,
      enum: ["childs_future", "retirement", "growing_savings", "not_sure"],
      required: true,
    },
    calculator_type: {
      type: String,
      enum: ["childrenEducation", "retirement", "targetSip", null],
      default: null,
    },
    calculator_inputs: {
      type: Schema.Types.Mixed,
      default: null,
    },
    calculator_result: {
      type: Schema.Types.Mixed,
      default: null,
    },
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

startInvestingEnquirySchema.pre<IStartInvestingEnquiry>(
  "save",
  function saveHook(next) {
    this.updated_at = new Date();
    next();
  },
);

startInvestingEnquirySchema.index({ created_at: -1 });
startInvestingEnquirySchema.index({ "readBy.userId": 1 });

export const StartInvestingEnquiry: Model<IStartInvestingEnquiry> =
  mongoose.models.StartInvestingEnquiry ||
  mongoose.model<IStartInvestingEnquiry>(
    "StartInvestingEnquiry",
    startInvestingEnquirySchema,
  );
