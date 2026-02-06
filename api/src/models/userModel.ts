import mongoose, { Document, Schema, Model } from "mongoose";

export type IUser = Document & {
  title: "Mr" | "Mrs";
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  countryCode: string;
  mobile: string;
  role: "user" | "editor" | "admin";
  isTermsAccepted: boolean;
  is_deleted: boolean;
  address?: string;
  profileImage?: string;

  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;

  created_at: Date;
  updated_at: Date;
};

const userSchema: Schema<IUser> = new Schema(
  {
    title: { type: String, enum: ["Mr", "Mrs"], required: true },
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },

    countryCode: { type: String, required: true, trim: true },

    mobile: { type: String, required: true, trim: true },

    role: { type: String, enum: ["user", "editor", "admin"], default: "user" },
    isTermsAccepted: { type: Boolean, required: true },
    is_deleted: { type: Boolean, default: false },
    address: { type: String, default: "" },
    profileImage: { type: String, default: "" },

    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

userSchema.index({ mobile: 1 });
userSchema.index({ countryCode: 1, mobile: 1 }, { unique: true });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
