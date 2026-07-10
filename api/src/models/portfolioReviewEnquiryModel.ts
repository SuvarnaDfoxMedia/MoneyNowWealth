import mongoose, { Document, Model, Schema, Types } from "mongoose";

interface IEnquiryReadEntry {
  userId: Types.ObjectId;
  readAt: Date;
}

export interface IPortfolioReviewEnquiry extends Document {
  full_name: string;
  email: string;
  mobile: string;
  country_code: string;
  investor_mindset:
    | "just_getting_started"
    | "investing_not_sure"
    | "second_opinion"
    | "all_over_the_place";
  cas_file_name?: string;
  cas_file_url?: string;
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

const portfolioReviewEnquirySchema = new Schema<IPortfolioReviewEnquiry>(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    country_code: { type: String, required: true, trim: true },
    investor_mindset: {
      type: String,
      enum: [
        "just_getting_started",
        "investing_not_sure",
        "second_opinion",
        "all_over_the_place",
      ],
      required: true,
    },
    cas_file_name: { type: String, trim: true, default: null },
    cas_file_url: { type: String, trim: true, default: null },
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

portfolioReviewEnquirySchema.pre<IPortfolioReviewEnquiry>(
  "save",
  function saveHook(next) {
    this.updated_at = new Date();
    next();
  },
);

portfolioReviewEnquirySchema.index({ created_at: -1 });
portfolioReviewEnquirySchema.index({ "readBy.userId": 1 });

export const PortfolioReviewEnquiry: Model<IPortfolioReviewEnquiry> =
  mongoose.models.PortfolioReviewEnquiry ||
  mongoose.model<IPortfolioReviewEnquiry>(
    "PortfolioReviewEnquiry",
    portfolioReviewEnquirySchema,
  );
