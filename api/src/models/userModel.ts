// import mongoose, { Document, Schema, Model } from "mongoose";

// export type IUser = Document & {
//   title: "Mr" | "Mrs";          // Title
//   firstname: string;
//   lastname: string;
//   email: string;
//   password?: string;            // optional, hidden by default
//   mobile: string;               // full number including country code as string
//   role: "user" | "editor" | "admin";
//   isTermsAccepted: boolean;
//   is_deleted: boolean;          // Soft delete flag
//   address?: string;             // optional address
//   profileImage?: string;        // optional profile image
//   created_at: Date;
//   updated_at: Date;
// };

// const userSchema: Schema<IUser> = new Schema(
//   {
//     title: { type: String, enum: ["Mr", "Mrs"], required: true },
//     firstname: { type: String, required: true, trim: true },
//     lastname: { type: String, required: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, select: false }, // hidden in queries by default
//     mobile: { type: String, required: true, trim: true }, // full number including country code
//     role: { type: String, enum: ["user", "editor", "admin"], default: "user" },
//     isTermsAccepted: { type: Boolean, required: true },
//     is_deleted: { type: Boolean, default: false }, // soft delete
//     address: { type: String, default: "" },
//     profileImage: { type: String, default: "" },
//   },
//   {
//     timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
//     versionKey: false,
//   }
// );

// // Index for faster mobile lookups
// userSchema.index({ mobile: 1 });

// const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

// export default User;



// import mongoose, { Document, Schema, Model } from "mongoose";

// export type IUser = Document & {
//   title: "Mr" | "Mrs";
//   firstname: string;
//   lastname: string;
//   email: string;
//   password?: string;
//   mobile: string;
//   role: "user" | "editor" | "admin";
//   isTermsAccepted: boolean;
//   is_deleted: boolean;
//   address?: string;
//   profileImage?: string;

//   // 🔥 Added fields for password reset
//   resetPasswordToken?: string | null;
//   resetPasswordExpires?: Date | null;

//   created_at: Date;
//   updated_at: Date;
// };

// const userSchema: Schema<IUser> = new Schema(
//   {
//     title: { type: String, enum: ["Mr", "Mrs"], required: true },
//     firstname: { type: String, required: true, trim: true },
//     lastname: { type: String, required: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, select: false },
//     mobile: { type: String, required: true, trim: true },
//     role: { type: String, enum: ["user", "editor", "admin"], default: "user" },
//     isTermsAccepted: { type: Boolean, required: true },
//     is_deleted: { type: Boolean, default: false },
//     address: { type: String, default: "" },
//     profileImage: { type: String, default: "" },

//     //  Added missing schema fields
//     resetPasswordToken: { type: String, default: null },
//     resetPasswordExpires: { type: Date, default: null },
//   },
//   {
//     timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
//     versionKey: false,
//   }
// );

// // Index for faster mobile lookups
// userSchema.index({ mobile: 1 });

// const User: Model<IUser> =
//   mongoose.models.User || mongoose.model<IUser>("User", userSchema);

// export default User;


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
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
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
  }
);


userSchema.index({ mobile: 1 });
userSchema.index({ countryCode: 1, mobile: 1 }, { unique: true }); 


const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
