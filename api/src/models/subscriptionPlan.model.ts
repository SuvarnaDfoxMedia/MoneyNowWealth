import mongoose, { Schema, Document, Model, Types } from "mongoose";

// ---------------------- Interface ----------------------
export interface ISubscriptionPlan extends Document {
  _id: Types.ObjectId;   // <-- IMPORTANT: Fix for TypeScript ObjectId typing

  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: {
    value: number;
    unit: "day" | "month" | "year";
  };
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
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    duration: {
      value: { type: Number, required: true },
      unit: { type: String, enum: ["day", "month", "year"], required: true },
    },

    features: { type: [String], default: [] },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------------- Index ----------------------
SubscriptionPlanSchema.index({ name: 1, is_active: 1 });

// ---------------------- Virtuals ----------------------
SubscriptionPlanSchema.virtual("isActive").get(function (this: ISubscriptionPlan) {
  return this.is_active && !this.is_deleted;
});

// ---------------------- Model ----------------------
const SubscriptionPlan: Model<ISubscriptionPlan> = mongoose.model<ISubscriptionPlan>(
  "SubscriptionPlan",
  SubscriptionPlanSchema
);

export default SubscriptionPlan;
