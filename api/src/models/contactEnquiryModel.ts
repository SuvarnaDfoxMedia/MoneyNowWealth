

// /* -------------------------
//    Model
// ------------------------- */
// export const ContactEnquiry: Model<IContactEnquiry> =
//   mongoose.models.ContactEnquiry ||
//   mongoose.model<IContactEnquiry>("ContactEnquiry", contactEnquirySchema);

import mongoose, { Document, Schema, Model } from "mongoose";
import { capitalizePlugin } from "../plugins/capitalize.plugin";

/* -------------------------
   Interface
------------------------- */
export interface IContactEnquiry extends Document {
  first_name: string;
  last_name?: string;
  email: string;
  mobile: string; // national number only
  country_code: string; // e.g., +91
  city?: string;
  subject:
    | "Investment Inquiry"
    | "Support"
    | "Partner"
    | "Partnership"
    | "Feedback"
    | "Others";
  message: string;
  terms_accepted: boolean;
  status: "new" | "in-progress" | "resolved";
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

/* -------------------------
   Schema
------------------------- */
const contactEnquirySchema = new Schema<IContactEnquiry>(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, trim: true, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    country_code: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: "" },
    subject: {
      type: String,
      enum: [
        "Investment Inquiry",
        "Support",
        "Partner",
        "Partnership",
        "Feedback",
        "Others",
      ],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    terms_accepted: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved"],
      default: "new",
    },
    is_active: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

/* -------------------------
   Capitalization Plugin
------------------------- */
contactEnquirySchema.plugin(capitalizePlugin, {
  except: [
    // Contact info fields (should stay as-is)
    "email",
    "mobile",
    "country_code",
    "city",

    "subject",
    "status",

    // Boolean field
    "terms_accepted",

    // Number field
    "is_active",

    // Date fields
    "created_at",
    "updated_at",

    // MongoDB internal fields
    "_id",
    "__v",
  ],
  descriptionFields: ["message"],
});

/* -------------------------
   Pre-save Hook
------------------------- */
contactEnquirySchema.pre<IContactEnquiry>("save", function (next) {
  this.updated_at = new Date();
  next();
});

/* -------------------------
   Model
------------------------- */
export const ContactEnquiry: Model<IContactEnquiry> =
  mongoose.models.ContactEnquiry ||
  mongoose.model<IContactEnquiry>("ContactEnquiry", contactEnquirySchema);
