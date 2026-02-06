// import { Schema, model, type Document } from "mongoose";

// export interface INewsletter extends Document {
//   name: string;
//   email: string;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
//   is_deleted?: boolean;
// }

// const NewsletterSchema = new Schema<INewsletter>(
//   {
//     name: { type: String, required: true, trim: true },

//     // Email: required, unique, lowercase
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },

//     is_deleted: { type: Boolean, default: false },
//     deleted_at: { type: Date, default: null },
//   },
//   {
//     timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
//   },
// );

// NewsletterSchema.index({ email: 1 }, { unique: true });

// export const Newsletter = model<INewsletter>("Newsletter", NewsletterSchema);

import { Schema, model, type Document } from "mongoose";
import { capitalizePlugin } from "../plugins/capitalize.plugin";

export interface INewsletter extends Document {
  name: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
  is_deleted?: boolean;
}

const NewsletterSchema = new Schema<INewsletter>(
  {
    name: { type: String, required: true, trim: true },

    // Email: required, unique, lowercase
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

/* -------------------------
   Capitalization Plugin
------------------------- */
NewsletterSchema.plugin(capitalizePlugin, {
  except: [
    // Email field (should stay lowercase)
    "email",

    // Boolean field
    "is_deleted",

    // Date fields
    "deleted_at",
    "created_at",
    "updated_at",

    // MongoDB internal fields
    "_id",
    "__v",
  ],
});

NewsletterSchema.index({ email: 1 }, { unique: true });

export const Newsletter = model<INewsletter>("Newsletter", NewsletterSchema);
