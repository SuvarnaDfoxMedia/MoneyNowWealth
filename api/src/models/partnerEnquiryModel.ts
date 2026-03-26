import mongoose, { Document, Model, Schema } from "mongoose";
import { capitalizePlugin } from "../plugins/capitalize.plugin";

export const PARTNER_CURRENT_STATUS = [
  "I am an individual mutual fund distributor / IFA (ARN holder)",
  "I run a small distribution / wealth firm",
  "I am planning to become a mutual fund distributor (not yet ARN holder)",
] as const;

export type PartnerCurrentStatus =
  (typeof PARTNER_CURRENT_STATUS)[number];

export interface IPartnerEnquiry extends Document {
  full_name: string;
  email: string;
  mobile: string;
  country_code: string;
  city: string;
  organisation_name?: string;
  current_status: PartnerCurrentStatus;
  arn_number?: string;
  terms_accepted: boolean;
  status: "new" | "in-progress" | "resolved";
  lead_source: string;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

const partnerEnquirySchema = new Schema<IPartnerEnquiry>(
  {
    full_name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    mobile: { type: String, required: true, trim: true },
    country_code: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    organisation_name: { type: String, trim: true, default: "" },
    current_status: {
      type: String,
      enum: PARTNER_CURRENT_STATUS,
      required: true,
    },
    arn_number: { type: String, trim: true, default: "" },
    terms_accepted: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved"],
      default: "new",
      index: true,
    },
    lead_source: {
      type: String,
      default: "partner_with_us",
      index: true,
    },
    is_active: { type: Number, default: 1, index: true },
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

partnerEnquirySchema.plugin(capitalizePlugin, {
  except: [
    "email",
    "mobile",
    "country_code",
    "current_status",
    "terms_accepted",
    "status",
    "lead_source",
    "is_active",
    "created_at",
    "updated_at",
    "_id",
    "__v",
  ],
});

partnerEnquirySchema.pre<IPartnerEnquiry>("save", function (next) {
  this.updated_at = new Date();
  next();
});

export const PartnerEnquiry: Model<IPartnerEnquiry> =
  mongoose.models.PartnerEnquiry ||
  mongoose.model<IPartnerEnquiry>(
    "PartnerEnquiry",
    partnerEnquirySchema,
  );
