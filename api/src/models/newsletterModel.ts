import { Schema, model, type Document } from "mongoose";
import { capitalizePlugin } from "../plugins/capitalize.plugin";

export interface INewsletter extends Document {
  name: string | null;
  email: string;
  is_terms_accepted: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
  is_deleted?: boolean;
}

const NewsletterSchema = new Schema<INewsletter>(
  {
    // Name: optional for now (default null)
    name: {
      type: String,
      default: null,
      trim: true,
    },

    // Email: required, unique, lowercase
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Terms Acceptance
    is_terms_accepted: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Soft delete fields
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

/* -------------------------
   Capitalization Plugin
------------------------- */
NewsletterSchema.plugin(capitalizePlugin, {
  except: [
    // Email must remain lowercase
    "email",

    // Boolean fields
    "is_terms_accepted",
    "is_deleted",

    // Date fields
    "deleted_at",
    "created_at",
    "updated_at",

    // Mongo internal
    "_id",
    "__v",
  ],
});

// Unique email index
NewsletterSchema.index({ email: 1 }, { unique: true });

export const Newsletter = model<INewsletter>("Newsletter", NewsletterSchema);