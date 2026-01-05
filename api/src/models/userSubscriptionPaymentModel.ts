import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* --------------------------
   INTERFACES
---------------------------- */
export interface IUserSubscriptionPayment extends Document {
  _id: Types.ObjectId;   // <-- REQUIRED FIX for TS ObjectId typing

  user_id: Types.ObjectId;
  plan_id: Types.ObjectId;
  user_subscription_id: Types.ObjectId;

  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  order_id: string;

  payment_status: "pending" | "success" | "failed" | "refunded";
  payment_date: Date;

  type: "new" | "renewal" | "upgrade" | "downgrade";

  metadata: {
    gateway_response?: any;
    invoice_url?: string;
    note?: string;
  };

  created_at: Date;
  updated_at: Date;
}

/* --------------------------
   STATIC INTERFACE
---------------------------- */
export interface IUserSubscriptionPaymentModel
  extends Model<IUserSubscriptionPayment> {
  createPaymentForSubscription(
    data: Partial<IUserSubscriptionPayment>
  ): Promise<IUserSubscriptionPayment>;

  getPaymentsByUser(
    userId: Types.ObjectId | string
  ): Promise<IUserSubscriptionPayment[]>;
}

/* --------------------------
   SCHEMA
---------------------------- */
const userSubscriptionPaymentSchema = new Schema<
  IUserSubscriptionPayment,
  IUserSubscriptionPaymentModel
>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan_id: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    user_subscription_id: { type: Schema.Types.ObjectId, ref: "UserSubscription", required: true, index: true },

    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    payment_method: { type: String, required: true },
    transaction_id: { type: String, required: true },
    order_id: { type: String, required: true },

    payment_status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      required: true,
    },
    payment_date: { type: Date, required: true, default: Date.now },

    type: {
      type: String,
      enum: ["new", "renewal", "upgrade", "downgrade"],
      required: true,
    },

    metadata: { type: Object, default: {} },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

/* --------------------------
   STATIC METHODS
---------------------------- */
userSubscriptionPaymentSchema.statics.createPaymentForSubscription = async function (
  this: IUserSubscriptionPaymentModel,
  data: Partial<IUserSubscriptionPayment>
) {
  return this.create(data);
};

userSubscriptionPaymentSchema.statics.getPaymentsByUser = async function (
  this: IUserSubscriptionPaymentModel,
  userId: Types.ObjectId | string
) {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user ID");
  return this.find({ user_id: new mongoose.Types.ObjectId(userId) })
    .populate("user_subscription_id plan_id")
    .sort({ created_at: -1 });
};

/* --------------------------
   INDEXES
---------------------------- */
userSubscriptionPaymentSchema.index({ user_id: 1, user_subscription_id: 1, created_at: -1 });

/* --------------------------
   MODEL EXPORT
---------------------------- */
const UserSubscriptionPayment: IUserSubscriptionPaymentModel =
  (mongoose.models.UserSubscriptionPayment as IUserSubscriptionPaymentModel) ||
  mongoose.model<IUserSubscriptionPayment, IUserSubscriptionPaymentModel>(
    "UserSubscriptionPayment",
    userSubscriptionPaymentSchema
  );

export default UserSubscriptionPayment;
