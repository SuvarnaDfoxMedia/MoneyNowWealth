

// // ---------------------- Capitalization Plugin - COMPLETE except list ----------------------
// SubscriptionPlanSchema.plugin(capitalizePlugin, {
//   except: [
//     // Currency field
//     "currency",

//     // Nested enum field
//     "duration.unit",

//     // Number fields
//     "price",
//     "duration.value",

//     // Boolean fields
//     "is_promotional_plan",
//     "is_active",
//     "is_deleted",

//     // Date fields
//     "deleted_at",
//     "created_at",
//     "updated_at",

import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { capitalizePlugin } from "../plugins/capitalize.plugin";

// ---------------------- Interface ----------------------
export interface ISubscriptionPlan extends Document {
  _id: Types.ObjectId;
  name: string;
  plan_type: "Free" | "Premium";
  description?: string;
  price: number;
  currency: string;
  duration: {
    value: number;
    unit: "day" | "month" | "year";
  };
  is_promotional_plan: boolean;
  features: string[];
  is_active: boolean;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;

  // Virtuals
  isActive?: boolean;
}

// ---------------------- Schema ----------------------
const SubscriptionPlanSchema: Schema<ISubscriptionPlan> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    plan_type: {
      type: String,
      enum: ["Free", "Premium"],
      required: true,
      index: true,
    },

    description: { type: String, trim: true },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    duration: {
      value: {
        type: Number,
        required: true,
        min: 1,
      },
      unit: {
        type: String,
        enum: ["day", "month", "year"],
        required: true,
        default: "day",
      },
    },

    is_promotional_plan: {
      type: Boolean,
      default: false,
    },

    features: {
      type: [String],
      default: [],
    },

    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ---------------------- Capitalization Plugin ----------------------
// SubscriptionPlanSchema.plugin(capitalizePlugin, {
//   except: [
//     "currency",
//     "plan_type",
//     "duration.unit",
//     "price",
//     "duration.value",
//     "is_promotional_plan",
//     "is_active",
//     "is_deleted",
//     "deleted_at",
//     "created_at",
//     "updated_at",
//     "_id",
//     "__v",
//   ],
//   descriptionFields: ["description"],
// });

// ---------------------- Indexes ----------------------
SubscriptionPlanSchema.index({ name: 1, is_active: 1 });
SubscriptionPlanSchema.index({ plan_type: 1, is_active: 1 });
SubscriptionPlanSchema.index({ is_promotional_plan: 1, is_active: 1 });
SubscriptionPlanSchema.index({ is_deleted: 1 });

// ---------------------- Virtuals ----------------------
SubscriptionPlanSchema.virtual("isActive").get(function (
  this: ISubscriptionPlan,
) {
  return this.is_active && !this.is_deleted;
});

// ---------------------- Model ----------------------
const SubscriptionPlan: Model<ISubscriptionPlan> =
  mongoose.models.SubscriptionPlan ||
  mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);

export default SubscriptionPlan;
