import mongoose, { Document, Model, Schema, Types } from "mongoose";

interface IEnquiryReadEntry {
  userId: Types.ObjectId;
  readAt: Date;
}

export interface IOneCroreJourneyEnquiry extends Document {
  full_name: string;
  email: string;
  mobile: string;
  country_code: string;
  wants_callback: boolean;
  wealth_amount: number;
  user_sip_capacity: number;
  years: number;
  expected_return: number;
  inflation_rate: number;
  required_sip: number;
  invested_amount: number;
  growth_amount: number;
  target_wealth: number;
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

const oneCroreJourneyEnquirySchema = new Schema<IOneCroreJourneyEnquiry>(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    country_code: { type: String, required: true, trim: true },
    wants_callback: { type: Boolean, default: false },
    wealth_amount: { type: Number, required: true, min: 0 },
    user_sip_capacity: { type: Number, required: true, min: 0 },
    years: { type: Number, required: true, min: 1 },
    expected_return: { type: Number, required: true, min: 0 },
    inflation_rate: { type: Number, required: true, min: 0 },
    required_sip: { type: Number, required: true, min: 0 },
    invested_amount: { type: Number, required: true, min: 0 },
    growth_amount: { type: Number, required: true, min: 0 },
    target_wealth: { type: Number, required: true, min: 0 },
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

oneCroreJourneyEnquirySchema.pre<IOneCroreJourneyEnquiry>(
  "save",
  function saveHook(next) {
    this.updated_at = new Date();
    next();
  },
);

oneCroreJourneyEnquirySchema.index({ created_at: -1 });
oneCroreJourneyEnquirySchema.index({ "readBy.userId": 1 });

export const OneCroreJourneyEnquiry: Model<IOneCroreJourneyEnquiry> =
  mongoose.models.OneCroreJourneyEnquiry ||
  mongoose.model<IOneCroreJourneyEnquiry>(
    "OneCroreJourneyEnquiry",
    oneCroreJourneyEnquirySchema,
  );
