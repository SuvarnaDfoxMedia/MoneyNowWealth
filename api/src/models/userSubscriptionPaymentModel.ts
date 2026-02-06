// import mongoose, { Schema, Document, Model, Types } from "mongoose";

// /* --------------------------
//    INTERFACES
// ---------------------------- */
// export interface IUserSubscriptionPayment extends Document {
//   _id: Types.ObjectId;

//   user_id: Types.ObjectId;
//   plan_id: Types.ObjectId;
//   user_subscription_id: Types.ObjectId;

//   amount: number;
//   currency: string;

//   payment_method: "razorpay" | "stripe" | "manual" | "free_plan" | "system";

//   transaction_id?: string;
//   order_id?: string;

//   payment_status: "pending" | "success" | "failed" | "refunded";
//   payment_date: Date;

//   type: "new" | "renewal" | "upgrade" | "downgrade";

//   // Add metadata for state transition
//   metadata: {
//     previous_state?: string;
//     new_state?: string;
//     previous_plan?: string;
//     new_plan?: string;
//     note?: string;
//     gateway_response?: any;
//     invoice_url?: string;
//   };

//   created_at: Date;
//   updated_at: Date;
// }

// /* --------------------------
//    STATIC INTERFACE
// ---------------------------- */
// export interface IUserSubscriptionPaymentModel extends Model<IUserSubscriptionPayment> {
//   createStateTransitionPayment(data: {
//     user_id: Types.ObjectId;
//     plan_id: Types.ObjectId;
//     user_subscription_id: Types.ObjectId;
//     amount: number;
//     type: "new" | "upgrade" | "downgrade";
//     previous_state?: string;
//     new_state?: string;
//     previous_plan?: string;
//     new_plan?: string;
//   }): Promise<IUserSubscriptionPayment>;

//   getPaymentsByUser(
//     userId: Types.ObjectId | string,
//   ): Promise<IUserSubscriptionPayment[]>;
// }

// /* --------------------------
//    SCHEMA
// ---------------------------- */
// const userSubscriptionPaymentSchema = new Schema<
//   IUserSubscriptionPayment,
//   IUserSubscriptionPaymentModel
// >(
//   {
//     user_id: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     plan_id: {
//       type: Schema.Types.ObjectId,
//       ref: "SubscriptionPlan",
//       required: true,
//     },

//     user_subscription_id: {
//       type: Schema.Types.ObjectId,
//       ref: "UserSubscription",
//       required: true,
//       index: true,
//     },

//     amount: { type: Number, required: true },
//     currency: { type: String, default: "INR", required: true },

//     payment_method: {
//       type: String,
//       enum: ["razorpay", "stripe", "manual", "free_plan", "system"],
//       required: true,
//     },

//     transaction_id: {
//       type: String,
//       default: function (this: IUserSubscriptionPayment) {
//         return this.payment_method === "system" ||
//           this.payment_method === "free_plan"
//           ? `SYS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
//           : undefined;
//       },
//     },

//     order_id: {
//       type: String,
//       default: function (this: IUserSubscriptionPayment) {
//         return this.payment_method === "system" ||
//           this.payment_method === "free_plan"
//           ? `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
//           : undefined;
//       },
//     },

//     payment_status: {
//       type: String,
//       enum: ["pending", "success", "failed", "refunded"],
//       default: "success",
//       required: true,
//     },

//     payment_date: {
//       type: Date,
//       required: true,
//       default: Date.now,
//     },

//     type: {
//       type: String,
//       enum: ["new", "renewal", "upgrade", "downgrade"],
//       required: true,
//     },

//     metadata: {
//       type: Schema.Types.Mixed,
//       default: {},
//     },
//   },
//   {
//     timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
//   },
// );

// /* --------------------------
//    STATIC METHODS
// ---------------------------- */
// userSubscriptionPaymentSchema.statics.createStateTransitionPayment =
//   async function (
//     this: IUserSubscriptionPaymentModel,
//     data: {
//       user_id: Types.ObjectId;
//       plan_id: Types.ObjectId;
//       user_subscription_id: Types.ObjectId;
//       amount: number;
//       type: "new" | "upgrade" | "downgrade";
//       previous_state?: string;
//       new_state?: string;
//       previous_plan?: string;
//       new_plan?: string;
//     },
//   ) {
//     const paymentData: Partial<IUserSubscriptionPayment> = {
//       user_id: data.user_id,
//       plan_id: data.plan_id,
//       user_subscription_id: data.user_subscription_id,
//       amount: data.amount,
//       currency: "INR",
//       payment_method: data.amount === 0 ? "free_plan" : "system",
//       payment_status: "success",
//       payment_date: new Date(),
//       type: data.type,
//       metadata: {
//         previous_state: data.previous_state,
//         new_state: data.new_state,
//         previous_plan: data.previous_plan,
//         new_plan: data.new_plan,
//         note: `Subscription ${data.type} transition`,
//       },
//     };

//     return this.create(paymentData);
//   };

// userSubscriptionPaymentSchema.statics.getPaymentsByUser = async function (
//   this: IUserSubscriptionPaymentModel,
//   userId: Types.ObjectId | string,
// ) {
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     throw new Error("Invalid user ID");
//   }

//   return this.find({ user_id: new mongoose.Types.ObjectId(userId) })
//     .populate("plan_id", "name price duration")
//     .populate("user_subscription_id", "status plan_type end_date")
//     .sort({ created_at: -1 });
// };

// /* --------------------------
//    INDEXES
// ---------------------------- */
// userSubscriptionPaymentSchema.index({ user_id: 1, created_at: -1 });
// userSubscriptionPaymentSchema.index({
//   user_subscription_id: 1,
//   created_at: -1,
// });

// /* --------------------------
//    MODEL EXPORT
// ---------------------------- */
// const UserSubscriptionPayment: IUserSubscriptionPaymentModel =
//   (mongoose.models.UserSubscriptionPayment as IUserSubscriptionPaymentModel) ||
//   mongoose.model<IUserSubscriptionPayment, IUserSubscriptionPaymentModel>(
//     "UserSubscriptionPayment",
//     userSubscriptionPaymentSchema,
//   );

// export default UserSubscriptionPayment;

import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* --------------------------
   INTERFACES
---------------------------- */
export interface IUserSubscriptionPayment extends Document {
  _id: Types.ObjectId;

  user_id: Types.ObjectId;
  plan_id: Types.ObjectId;
  user_subscription_id: Types.ObjectId;

  amount: number;
  currency: string;

  payment_method: "razorpay" | "stripe" | "manual" | "free_plan" | "system";

  transaction_id?: string;
  order_id?: string;

  payment_status: "pending" | "success" | "failed" | "refunded";
  payment_date: Date;

  type: "new" | "renewal" | "upgrade" | "downgrade";

  //  IMPORTANT: Store subscription period for invoice correctness
  start_date: Date;
  end_date: Date;

  //  Optional but recommended: snapshot of plan at time of payment
  plan_snapshot?: {
    name?: string;
    duration?: number; // days
    price?: number;
    currency?: string;
  };

  metadata: {
    previous_state?: string;
    new_state?: string;
    previous_plan?: string;
    new_plan?: string;
    note?: string;
    gateway_response?: any;
    invoice_url?: string;
  };

  created_at: Date;
  updated_at: Date;
}

/* --------------------------
   STATIC INTERFACE
---------------------------- */
export interface IUserSubscriptionPaymentModel extends Model<IUserSubscriptionPayment> {
  createStateTransitionPayment(data: {
    user_id: Types.ObjectId;
    plan_id: Types.ObjectId;
    user_subscription_id: Types.ObjectId;

    amount: number;
    currency?: string;

    type: "new" | "upgrade" | "downgrade" | "renewal";

    //  Store exact subscription period for invoice
    start_date: Date;
    end_date: Date;

    // Optional snapshots
    plan_snapshot?: {
      name?: string;
      duration?: number;
      price?: number;
      currency?: string;
    };

    previous_state?: string;
    new_state?: string;
    previous_plan?: string;
    new_plan?: string;

    payment_method?: "razorpay" | "stripe" | "manual" | "free_plan" | "system";
    gateway_response?: any;
    invoice_url?: string;
  }): Promise<IUserSubscriptionPayment>;

  getPaymentsByUser(
    userId: Types.ObjectId | string,
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
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    plan_id: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    user_subscription_id: {
      type: Schema.Types.ObjectId,
      ref: "UserSubscription",
      required: true,
      index: true,
    },

    amount: { type: Number, required: true },
    currency: { type: String, default: "INR", required: true },

    payment_method: {
      type: String,
      enum: ["razorpay", "stripe", "manual", "free_plan", "system"],
      required: true,
    },

    transaction_id: {
      type: String,
      default: function (this: IUserSubscriptionPayment) {
        return this.payment_method === "system" ||
          this.payment_method === "free_plan"
          ? `SYS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          : undefined;
      },
    },

    order_id: {
      type: String,
      default: function (this: IUserSubscriptionPayment) {
        return this.payment_method === "system" ||
          this.payment_method === "free_plan"
          ? `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          : undefined;
      },
    },

    payment_status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "success",
      required: true,
    },

    payment_date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    type: {
      type: String,
      enum: ["new", "renewal", "upgrade", "downgrade"],
      required: true,
    },

    //  NEW FIELDS (Fix invoice wrong dates)
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },

    //  Optional snapshot for stable invoices
    plan_snapshot: {
      type: Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

/* --------------------------
   STATIC METHODS
---------------------------- */
userSubscriptionPaymentSchema.statics.createStateTransitionPayment =
  async function (
    this: IUserSubscriptionPaymentModel,
    data: {
      user_id: Types.ObjectId;
      plan_id: Types.ObjectId;
      user_subscription_id: Types.ObjectId;

      amount: number;
      currency?: string;

      type: "new" | "upgrade" | "downgrade" | "renewal";

      start_date: Date;
      end_date: Date;

      plan_snapshot?: {
        name?: string;
        duration?: number;
        price?: number;
        currency?: string;
      };

      previous_state?: string;
      new_state?: string;
      previous_plan?: string;
      new_plan?: string;

      payment_method?:
        | "razorpay"
        | "stripe"
        | "manual"
        | "free_plan"
        | "system";
      gateway_response?: any;
      invoice_url?: string;
    },
  ) {
    const currency = data.currency || "INR";

    const paymentData: Partial<IUserSubscriptionPayment> = {
      user_id: data.user_id,
      plan_id: data.plan_id,
      user_subscription_id: data.user_subscription_id,

      amount: data.amount,
      currency,

      payment_method:
        data.payment_method || (data.amount === 0 ? "free_plan" : "system"),

      payment_status: "success",
      payment_date: new Date(),

      type: data.type,

      //  store exact subscription period for invoice
      start_date: data.start_date,
      end_date: data.end_date,

      plan_snapshot: data.plan_snapshot || {},

      metadata: {
        previous_state: data.previous_state,
        new_state: data.new_state,
        previous_plan: data.previous_plan,
        new_plan: data.new_plan,
        gateway_response: data.gateway_response,
        invoice_url: data.invoice_url,
        note: `Subscription ${data.type} transition`,
      },
    };

    return this.create(paymentData);
  };

userSubscriptionPaymentSchema.statics.getPaymentsByUser = async function (
  this: IUserSubscriptionPaymentModel,
  userId: Types.ObjectId | string,
) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  return this.find({ user_id: new mongoose.Types.ObjectId(userId) })
    .populate("plan_id", "name price duration")
    .populate("user_subscription_id", "status plan_type end_date")
    .sort({ created_at: -1 });
};

/* --------------------------
   INDEXES
---------------------------- */
userSubscriptionPaymentSchema.index({ user_id: 1, created_at: -1 });
userSubscriptionPaymentSchema.index({
  user_subscription_id: 1,
  created_at: -1,
});

/* --------------------------
   MODEL EXPORT
---------------------------- */
const UserSubscriptionPayment: IUserSubscriptionPaymentModel =
  (mongoose.models.UserSubscriptionPayment as IUserSubscriptionPaymentModel) ||
  mongoose.model<IUserSubscriptionPayment, IUserSubscriptionPaymentModel>(
    "UserSubscriptionPayment",
    userSubscriptionPaymentSchema,
  );

export default UserSubscriptionPayment;
