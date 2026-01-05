import { Schema, model, type Document } from "mongoose";

export interface INewsletter extends Document {
  name: string;
  email: string;
  created_at?: Date;
  deleted_at?: Date | null;
  is_deleted?: boolean;
}

const NewsletterSchema = new Schema<INewsletter>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Newsletter = model<INewsletter>("Newsletter", NewsletterSchema);
