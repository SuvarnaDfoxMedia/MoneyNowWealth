

// /* ===============================
//    Virtuals
//    =============================== */
// userSubscriptionSchema.virtual("isExpired").get(function () {
//   return this.end_date < new Date();
// });

//   this.history.push({
//     plan_type: `${oldPlanType}→${newPlanType}`,
//     status:
//       oldPlanType === "Free" && newPlanType === "Premium"
//         ? "upgrade"
//         : "downgrade",
//     changed_at: new Date(),
//     reason,
//   });

import mongoose, { Document, Schema, Model, Types } from "mongoose";

/* ===============================
   Interface: User Subscription
   =============================== */
export interface IUserSubscription extends Document {
  user_id: Types.ObjectId;
  plan_id: Types.ObjectId;
  plan_type: "Free" | "Premium";
  start_date: Date;
  end_date: Date;
  trial_type: "free_sample" | "premium_sample";
  status: "active" | "expired";
  auto_renew: boolean;
  last_payment_id?: Types.ObjectId | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;

  promotional_trial_used: boolean;
  is_promotional: boolean;

  eligibility: {
    can_purchase_premium: boolean;
    last_premium_expiry_date?: Date | null;
    purchase_required: boolean;
  };

  history: Array<{
    plan_type: string;
    status: string;
    changed_at: Date;
    reason: string;
  }>;

  isExpired: boolean;
  isActive: boolean;
  daysRemaining: number;

  populateFull(): Promise<IUserSubscription>;
  canAccessPremiumContent(): boolean;
  requiresPurchase(): boolean;

  updateToPlan(data: {
    newPlanType: "Free" | "Premium";
    newPlanId: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    reason: string;
    isPromotional?: boolean;
    purchaseRequired?: boolean;
  }): Promise<IUserSubscription>;
}

export interface IUserSubscriptionModel extends Model<IUserSubscription> {
  getActiveSubscription(
    userId: Types.ObjectId,
  ): Promise<IUserSubscription | null>;
  getUserSubscription(
    userId: Types.ObjectId,
  ): Promise<IUserSubscription | null>;
  canGetPremiumTrial(userId: Types.ObjectId): Promise<boolean>;
  getExpiredPremium(userId: Types.ObjectId): Promise<IUserSubscription | null>;
}

/* ===============================
   Schema
   =============================== */
const userSubscriptionSchema = new Schema<IUserSubscription>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },

    plan_id: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    plan_type: {
      type: String,
      enum: ["Free", "Premium"],
      required: true,
      default: "Free",
    },

    trial_type: {
      type: String,
      enum: ["free_sample", "premium_sample"],
      required: true,
      default: "free_sample",
    },

    start_date: { type: Date, required: true, default: Date.now },
    end_date: { type: Date, required: true },

    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
      index: true,
    },

    auto_renew: { type: Boolean, default: false },

    last_payment_id: {
      type: Schema.Types.ObjectId,
      ref: "UserSubscriptionPayment",
      default: null,
    },

    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },

    promotional_trial_used: { type: Boolean, default: false },
    is_promotional: { type: Boolean, default: false },

    eligibility: {
      can_purchase_premium: { type: Boolean, default: true },
      last_premium_expiry_date: { type: Date, default: null },
      purchase_required: { type: Boolean, default: false },
    },

    history: [
      {
        plan_type: { type: String, required: true },
        status: { type: String, required: true },
        changed_at: { type: Date, default: Date.now },
        reason: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ===============================
   Virtuals
   =============================== */
userSubscriptionSchema.virtual("isExpired").get(function () {
  return this.end_date < new Date();
});

userSubscriptionSchema.virtual("isActive").get(function () {
  return this.is_active && !this.is_deleted && this.end_date > new Date();
});

userSubscriptionSchema.virtual("daysRemaining").get(function () {
  const now = new Date();
  const end = new Date(this.end_date);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/* ===============================
   Instance methods
   =============================== */
userSubscriptionSchema.methods.populateFull = async function () {
  await this.populate([
    { path: "user_id", select: "firstname lastname email mobile created_at" },
    { path: "plan_id" },
    { path: "last_payment_id" },
  ]);
  return this;
};

userSubscriptionSchema.methods.canAccessPremiumContent = function () {
  if (!this.is_active || this.is_deleted) return false;
  return this.plan_type === "Premium" && this.end_date > new Date();
};

userSubscriptionSchema.methods.requiresPurchase = function () {
  return this.eligibility?.purchase_required || false;
};

userSubscriptionSchema.methods.updateToPlan = async function (data: {
  newPlanType: "Free" | "Premium";
  newPlanId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  isPromotional?: boolean;
  purchaseRequired?: boolean;
}) {
  const oldPlanType = this.plan_type;

  this.plan_type = data.newPlanType;
  this.plan_id = data.newPlanId;

  this.start_date = data.startDate;
  this.end_date = data.endDate;

  this.trial_type =
    data.newPlanType === "Free" ? "free_sample" : "premium_sample";

  this.status = "active";
  this.is_active = true;
  this.is_deleted = false;
  this.deleted_at = null;

  this.eligibility = this.eligibility || {
    can_purchase_premium: true,
    last_premium_expiry_date: null,
    purchase_required: false,
  };

  this.is_promotional = !!data.isPromotional;

  if (typeof data.purchaseRequired === "boolean") {
    this.eligibility.purchase_required = data.purchaseRequired;
  }

  this.updated_at = new Date();

  this.history = this.history || [];
  this.history.push({
    plan_type: `${oldPlanType}→${data.newPlanType}`,
    status:
      oldPlanType === "Free" && data.newPlanType === "Premium"
        ? "upgrade"
        : "downgrade",
    changed_at: new Date(),
    reason: data.reason,
  });

  await this.save();
  return this;
};

/* ===============================
   Static methods
   =============================== */
userSubscriptionSchema.statics.canGetPremiumTrial = async function (
  userId: Types.ObjectId,
) {
  const subscription = await this.findOne({
    user_id: userId,
    is_deleted: false,
  });

  if (!subscription) return true;
  return !subscription.promotional_trial_used;
};

userSubscriptionSchema.statics.getExpiredPremium = async function (
  userId: Types.ObjectId,
) {
  return this.findOne({
    user_id: userId,
    plan_type: "Premium",
    status: "expired",
    is_deleted: false,
  });
};

userSubscriptionSchema.statics.getUserSubscription = async function (
  userId: Types.ObjectId,
) {
  const subscription = await this.findOne({
    user_id: userId,
    is_deleted: false,
  });

  if (!subscription) return null;
  return subscription.populateFull();
};

userSubscriptionSchema.statics.getActiveSubscription = async function (
  userId: Types.ObjectId,
) {
  const subscription = await this.findOne({
    user_id: userId,
    is_deleted: false,
    is_active: true,
  });

  if (!subscription) return null;
  return subscription.populateFull();
};

/* ===============================
   Indexes
   =============================== */
userSubscriptionSchema.index({ user_id: 1 }, { unique: true });
userSubscriptionSchema.index({ status: 1, end_date: -1 });
userSubscriptionSchema.index({ promotional_trial_used: 1 });
userSubscriptionSchema.index({ is_promotional: 1 });
userSubscriptionSchema.index({ "eligibility.purchase_required": 1 });

/* ===============================
   Export model
   =============================== */
const UserSubscription: IUserSubscriptionModel =
  (mongoose.models.UserSubscription as IUserSubscriptionModel) ||
  mongoose.model<IUserSubscription, IUserSubscriptionModel>(
    "UserSubscription",
    userSubscriptionSchema,
  );

export default UserSubscription;
