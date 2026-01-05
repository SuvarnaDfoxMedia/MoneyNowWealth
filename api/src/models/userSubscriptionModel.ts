

import mongoose, { Document, Schema, Model, Types } from "mongoose";
import UserSubscriptionPayment from "../models/userSubscriptionPaymentModel"; // adjust path
import User from "./userModel"; // adjust path
import SubscriptionPlan from "./subscriptionPlan.model"; // adjust path

// ---------------------- INTERFACE ----------------------
export interface IUserSubscription extends Document {
  user_id: Types.ObjectId;
  plan_id: Types.ObjectId;
  plan_type: "Free" | "Premium";
  start_date: Date;
  end_date: Date;
  trial_type: "free_sample" | "premium_sample";
  status: "new" | "upgrade" | "downgrade";
  auto_renew: boolean;
  last_payment_id?: Types.ObjectId | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;

  // Virtuals
  isExpired: boolean;
  isActive: boolean;

  // Instance method
  populateFull(): Promise<IUserSubscription>;
}

export interface IUserSubscriptionModel extends Model<IUserSubscription> {
  extendSubscription(
    userId: Types.ObjectId,
    planId: Types.ObjectId,
    durationValue: number,
    durationUnit: "day" | "month" | "year"
  ): Promise<IUserSubscription>;

  createTrial(
    userId: Types.ObjectId,
    planId: Types.ObjectId,
    durationValue: number,
    durationUnit: "day" | "month" | "year",
    trialType: "free_sample" | "premium_sample",
    status?: "new" | "upgrade" | "downgrade"
  ): Promise<IUserSubscription>;

  getActiveSubscription(userId: Types.ObjectId): Promise<IUserSubscription | null>;
}

// ---------------------- SCHEMA ----------------------
const userSubscriptionSchema = new Schema<IUserSubscription>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan_id: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true, index: true },

    // Ensure plan_type and trial_type always populated
    plan_type: { type: String, enum: ["Free", "Premium"], required: true, default: "Free" },
    trial_type: { type: String, enum: ["free_sample", "premium_sample"], required: true, default: "free_sample" },

    start_date: { type: Date, required: true, default: Date.now },
    end_date: { type: Date, required: true },

    status: { type: String, enum: ["new", "upgrade", "downgrade"], default: "new", index: true },
    auto_renew: { type: Boolean, default: false },
    last_payment_id: { type: Schema.Types.ObjectId, ref: "UserSubscriptionPayment", default: null },
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

// ---------------------- VIRTUALS ----------------------
userSubscriptionSchema.virtual("isExpired").get(function (this: IUserSubscription) {
  return this.end_date < new Date();
});

userSubscriptionSchema.virtual("isActive").get(function (this: IUserSubscription) {
  return this.is_active && !this.is_deleted && this.end_date > new Date();
});

// ---------------------- INSTANCE METHODS ----------------------
userSubscriptionSchema.methods.populateFull = async function (this: IUserSubscription) {
  await this.populate([
    { path: "user_id", select: "firstname lastname email mobile" },
    { path: "plan_id" },
    { path: "last_payment_id" },
  ]);
  return this;
};

// ---------------------- HELPER ----------------------
const addDuration = (date: Date, value: number, unit: "day" | "month" | "year") => {
  const d = new Date(date);
  if (unit === "day") d.setDate(d.getDate() + value);
  if (unit === "month") d.setMonth(d.getMonth() + value);
  if (unit === "year") d.setFullYear(d.getFullYear() + value);
  return d;
};

// ---------------------- STATIC METHODS ----------------------
userSubscriptionSchema.statics.extendSubscription = async function (
  this: IUserSubscriptionModel,
  userId: Types.ObjectId,
  planId: Types.ObjectId,
  durationValue: number,
  durationUnit: "day" | "month" | "year"
) {
  const subscription = await this.findOne({
    user_id: userId,
    plan_id: planId,
    is_deleted: false,
    is_active: true,
  });

  if (!subscription) throw new Error("Active subscription not found");

  subscription.end_date = addDuration(subscription.end_date, durationValue, durationUnit);
  await subscription.save();

  return subscription;
};

userSubscriptionSchema.statics.createTrial = async function (
  this: IUserSubscriptionModel,
  userId: Types.ObjectId,
  planId: Types.ObjectId,
  durationValue: number,
  durationUnit: "day" | "month" | "year",
  trialType: "free_sample" | "premium_sample",
  status: "new" | "upgrade" | "downgrade" = "new"
) {
  const start = new Date();
  const endDate = addDuration(start, durationValue, durationUnit);

  // Deactivate previous active subscriptions
  await this.updateMany({ user_id: userId, is_active: true }, { is_active: false });

  const subscription = await this.create({
    user_id: userId,
    plan_id: planId,
    plan_type: trialType === "free_sample" ? "Free" : "Premium", // ensures plan_type
    trial_type: trialType, // ensures trial_type
    start_date: start,
    end_date: endDate,
    status,
    auto_renew: false,
    is_active: true,
  });

  return subscription.populateFull();
};

userSubscriptionSchema.statics.getActiveSubscription = async function (
  this: IUserSubscriptionModel,
  userId: Types.ObjectId
) {
  const subscription = await this.findOne({
    user_id: userId,
    is_deleted: false,
    is_active: true,
  }).sort({ end_date: -1 });

  if (!subscription) return null;
  return subscription.populateFull();
};

// ---------------------- INDEXES ----------------------
userSubscriptionSchema.index({ user_id: 1, status: 1, end_date: -1 });

// ---------------------- MODEL EXPORT ----------------------
const UserSubscription: IUserSubscriptionModel =
  (mongoose.models.UserSubscription as IUserSubscriptionModel) ||
  mongoose.model<IUserSubscription, IUserSubscriptionModel>(
    "UserSubscription",
    userSubscriptionSchema
  );

export default UserSubscription;
