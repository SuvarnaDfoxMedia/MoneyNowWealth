


// import mongoose from "mongoose";
// import UserSubscription from "../models/userSubscriptionModel";
// import User from "../models/userModel";
// import SubscriptionPlanModel from "../models/subscriptionPlan.model";

// /* ============================================================
//                         INTERFACES
//    ============================================================ */

// interface PaginationOptions {
//   page?: number;
//   limit?: number;
// }

// type DurationUnit = "day" | "month" | "year";

// /* ============================================================
//                         HELPER FUNCTION
//    ============================================================ */

// const addDurationToDate = (
//   date: Date,
//   value: number,
//   unit: DurationUnit
// ): Date => {
//   const newDate = new Date(date);
//   if (unit === "day") newDate.setDate(newDate.getDate() + value);
//   if (unit === "month") newDate.setMonth(newDate.getMonth() + value);
//   if (unit === "year") newDate.setFullYear(newDate.getFullYear() + value);
//   return newDate;
// };

// /* ============================================================
//                 USER SUBSCRIPTION SERVICE
//    ============================================================ */

// export const userSubscriptionService = {
//   /* ================= GET ALL SUBSCRIPTIONS (PAGINATION) ================= */
//   async getAll(
//     filter: Record<string, any> = {},
//     options: PaginationOptions = {}
//   ) {
//     const pageNum = Math.max(options.page || 1, 1);
//     const perPage = Math.max(options.limit || 10, 1);
//     const skip = (pageNum - 1) * perPage;

//     const searchQuery: any = {
//       ...(filter.search
//         ? {
//             $or: [
//               { firstname: { $regex: filter.search, $options: "i" } },
//               { lastname: { $regex: filter.search, $options: "i" } },
//               { email: { $regex: filter.search, $options: "i" } },
//             ],
//           }
//         : {}),
//     };

//     const total = await User.countDocuments(searchQuery);

//     const users = await User.find(searchQuery)
//       .skip(skip)
//       .limit(perPage)
//       .select("-password -resetPasswordToken -resetPasswordExpires")
//       .lean();

//     const subscriptions = await Promise.all(
//       users.map(async (user) => {
//         const subscription = await UserSubscription.findOne({
//           user_id: user._id,
//           ...(filter.plan_id ? { plan_id: filter.plan_id } : {}),
//           ...(filter.status ? { status: filter.status } : {}),
//           ...(filter.is_active !== undefined
//             ? { is_active: filter.is_active }
//             : {}),
//           ...(filter.is_deleted !== undefined
//             ? { is_deleted: filter.is_deleted }
//             : {}),
//         });

//         const finalSubscription = subscription
//           ? await subscription.populateFull()
//           : null;

//         return {
//           user,
//           subscription: finalSubscription,
//           status: finalSubscription?.status || "new",
//           trial_type: finalSubscription?.trial_type || null,
//         };
//       })
//     );

//     return {
//       success: true,
//       data: subscriptions,
//       total,
//       page: pageNum,
//       limit: perPage,
//       totalPages: Math.ceil(total / perPage),
//     };
//   },

//   /* ================= GET SUBSCRIPTION BY ID ================= */
//   async getById(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const subscription = await UserSubscription.findById(id);
//     return subscription ? subscription.populateFull() : null;
//   },

//   /* ================= CREATE OR UPDATE SUBSCRIPTION ================= */
//   async createOrUpdateSubscription(
//     userId: string,
//     planId: string,
//     durationValue: number,
//     durationUnit: DurationUnit,
//     trialType?: "free_sample" | "premium_sample",
//     status: "new" | "upgrade" | "downgrade" = "new" // ✅ added status
//   ) {
//     if (
//       !mongoose.Types.ObjectId.isValid(userId) ||
//       !mongoose.Types.ObjectId.isValid(planId)
//     ) {
//       return null;
//     }

//     const now = new Date();
//     const end = addDurationToDate(now, durationValue, durationUnit);
//     const finalTrialType = trialType || "free_sample";

//     let subscription = await UserSubscription.findOne({
//       user_id: userId,
//       plan_id: planId,
//       is_active: true,
//       is_deleted: false,
//     });

//     if (subscription) {
//       subscription.end_date = end;
//       subscription.trial_type = finalTrialType;
//       subscription.status = status; // ✅ use passed status
//       await subscription.save();
//     } else {
//       subscription = await UserSubscription.create({
//         user_id: userId,
//         plan_id: planId,
//         start_date: now,
//         end_date: end,
//         status: status, // ✅ use passed status
//         trial_type: finalTrialType,
//         is_active: true,
//         auto_renew: false,
//       });
//     }

//     return subscription.populateFull();
//   },

//   /* ================= ASSIGN TRIAL ================= */
//   async assignTrial(userId: string, trialType: "free" | "premium") {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return null;

//     const planName = trialType === "free" ? "Free" : "Premium";
//     const plan = await SubscriptionPlanModel.findOne({
//       name: planName,
//       is_active: true,
//     });

//     if (!plan) throw new Error(`${planName} plan not found`);

//     const start = new Date();
//     const unit = (plan.duration?.unit || "day") as DurationUnit;
//     const end = addDurationToDate(start, plan.duration.value, unit);

//     const trial = await UserSubscription.create({
//       user_id: userId,
//       plan_id: plan._id,
//       start_date: start,
//       end_date: end,
//       status: "new",
//       trial_type:
//         trialType === "free" ? "free_sample" : "premium_sample",
//       is_active: true,
//       auto_renew: false,
//     });

//     return trial.populateFull();
//   },

//   /* ================= GET ACTIVE SUBSCRIPTION FOR USER ================= */
//   async getByUserId(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return null;

//     // Priority: upgrade → otherwise new/downgrade
//     let subscription = await UserSubscription.findOne({
//       user_id: userId,
//       status: "upgrade",
//       is_deleted: false,
//     }).sort({ end_date: -1 });

//     if (!subscription) {
//       subscription = await UserSubscription.findOne({
//         user_id: userId,
//         status: { $in: ["new", "downgrade"] },
//         is_deleted: false,
//       }).sort({ end_date: -1 });
//     }

//     return subscription ? subscription.populateFull() : null;
//   },

//   /* ================= EXTEND SUBSCRIPTION ================= */
//   async extendSubscriptionPeriod(
//     id: string,
//     durationValue: number,
//     durationUnit: DurationUnit
//   ) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;

//     const base =
//       subscription.end_date > new Date()
//         ? subscription.end_date
//         : new Date();

//     subscription.end_date = addDurationToDate(
//       base,
//       durationValue,
//       durationUnit
//     );
//     await subscription.save();

//     return subscription.populateFull();
//   },

//   /* ================= UPDATE SUBSCRIPTION ================= */
//   async update(id: string, updateData: any) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     updateData.updated_at = new Date();

//     const subscription = await UserSubscription.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true }
//     );

//     return subscription ? subscription.populateFull() : null;
//   },

//   /* ================= TOGGLE ACTIVE STATUS ================= */
//   async toggleActiveStatus(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;

//     subscription.is_active = !subscription.is_active;
//     subscription.updated_at = new Date();

//     return subscription.save();
//   },

//   /* ================= SOFT DELETE ================= */
//   async softDelete(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;

//     subscription.is_deleted = true;
//     subscription.is_active = false;
//     subscription.deleted_at = new Date();

//     await subscription.save();

//     return subscription.populateFull();
//   },

//   /* ================= RESTORE ================= */
//   async restore(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;

//     subscription.is_deleted = false;
//     subscription.is_active = true;
//     subscription.deleted_at = null;

//     await subscription.save();

//     return subscription.populateFull();
//   },

//   /* ================= EXPIRED SUBSCRIPTION HELPERS ================= */
//   async getExpiredFreeSubscriptions(now: Date) {
//     return UserSubscription.find({
//       trial_type: "free_sample",
//       end_date: { $lt: now },
//       is_deleted: false,
//     });
//   },

//   async getExpiredPremiumSubscriptions(now: Date) {
//     return UserSubscription.find({
//       trial_type: "premium_sample",
//       end_date: { $lt: now },
//       is_deleted: false,
//     });
//   },
// };




// import mongoose from "mongoose";
// import UserSubscription from "../models/userSubscriptionModel";
// import User from "../models/userModel";
// import SubscriptionPlanModel from "../models/subscriptionPlan.model";
// import UserSubscriptionPayment from "../models/userSubscriptionPaymentModel";

// /* ============================================================
//                         INTERFACES
//    ============================================================ */

// interface PaginationOptions {
//   page?: number;
//   limit?: number;
// }

// type DurationUnit = "day" | "month" | "year";

// /* ============================================================
//                         HELPER FUNCTIONS
//    ============================================================ */

// const addDurationToDate = (
//   date: Date,
//   value: number,
//   unit: DurationUnit
// ): Date => {
//   const newDate = new Date(date);
//   if (unit === "day") newDate.setDate(newDate.getDate() + value);
//   if (unit === "month") newDate.setMonth(newDate.getMonth() + value);
//   if (unit === "year") newDate.setFullYear(newDate.getFullYear() + value);
//   return newDate;
// };

// /* ============================================================
//                 USER SUBSCRIPTION SERVICE
//    ============================================================ */

// export const userSubscriptionService = {
//   /* ================= GET ALL SUBSCRIPTIONS (PAGINATION) ================= */
//   async getAll(
//     filter: Record<string, any> = {},
//     options: PaginationOptions = {}
//   ) {
//     const pageNum = Math.max(options.page || 1, 1);
//     const perPage = Math.max(options.limit || 10, 1);
//     const skip = (pageNum - 1) * perPage;

//     const searchQuery: any = {
//       ...(filter.search
//         ? {
//             $or: [
//               { firstname: { $regex: filter.search, $options: "i" } },
//               { lastname: { $regex: filter.search, $options: "i" } },
//               { email: { $regex: filter.search, $options: "i" } },
//             ],
//           }
//         : {}),
//     };

//     const total = await User.countDocuments(searchQuery);

//     const users = await User.find(searchQuery)
//       .skip(skip)
//       .limit(perPage)
//       .select("-password -resetPasswordToken -resetPasswordExpires")
//       .lean();

//     const subscriptions = await Promise.all(
//       users.map(async (user) => {
//         const subscription = await UserSubscription.findOne({
//           user_id: user._id,
//           ...(filter.plan_id ? { plan_id: filter.plan_id } : {}),
//           ...(filter.status ? { status: filter.status } : {}),
//           ...(filter.is_active !== undefined
//             ? { is_active: filter.is_active }
//             : {}),
//           ...(filter.is_deleted !== undefined
//             ? { is_deleted: filter.is_deleted }
//             : {}),
//         });

//         const finalSubscription = subscription
//           ? await subscription.populateFull()
//           : null;

//         return {
//           user,
//           subscription: finalSubscription,
//           status: finalSubscription?.status || "new",
//           trial_type: finalSubscription?.trial_type || null,
//         };
//       })
//     );

//     return {
//       success: true,
//       data: subscriptions,
//       total,
//       page: pageNum,
//       limit: perPage,
//       totalPages: Math.ceil(total / perPage),
//     };
//   },

//   /* ================= GET SUBSCRIPTION BY ID ================= */
//   async getById(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const subscription = await UserSubscription.findById(id);
//     return subscription ? subscription.populateFull() : null;
//   },

//   /* ================= CREATE OR UPDATE SUBSCRIPTION ================= */
//   async createOrUpdateSubscription(
//     userId: string,
//     planId: string,
//     durationValue: number,
//     durationUnit: DurationUnit,
//     trialType?: "free_sample" | "premium_sample",
//     status: "new" | "upgrade" | "downgrade" = "new"
//   ) {
//     if (
//       !mongoose.Types.ObjectId.isValid(userId) ||
//       !mongoose.Types.ObjectId.isValid(planId)
//     ) {
//       return null;
//     }

//     const now = new Date();
//     const end = addDurationToDate(now, durationValue, durationUnit);
//     const finalTrialType = trialType || "free_sample";

//     // Find existing active subscription for user
//     let subscription = await UserSubscription.findOne({
//       user_id: userId,
//       is_active: true,
//       is_deleted: false,
//     });

//     if (subscription) {
//       // Update existing subscription
//       subscription.plan_id = planId;
//       subscription.end_date = end;
//       subscription.trial_type = finalTrialType;
//       subscription.status = status;
//       await subscription.save();
//     } else {
//       // Create new subscription
//       subscription = await UserSubscription.create({
//         user_id: userId,
//         plan_id: planId,
//         start_date: now,
//         end_date: end,
//         status,
//         trial_type: finalTrialType,
//         is_active: true,
//         auto_renew: false,
//       });
//     }

//     // Track payment
//     const plan = await SubscriptionPlanModel.findById(planId);
//     if (plan) {
//       const payment = await UserSubscriptionPayment.create({
//         user_id: userId,
//         plan_id: planId,
//         user_subscription_id: subscription._id,
//         amount: finalTrialType === "free_sample" ? 0 : plan.price,
//         currency: "INR",
//         payment_method: "system",
//         transaction_id: `${status.toUpperCase()}-${Date.now()}`,
//         order_id: `${status.toUpperCase()}-${Date.now()}`,
//         payment_status: "success",
//         payment_date: new Date(),
//         type: status,
//       });

//       subscription.last_payment_id = payment._id;
//       await subscription.save();
//     }

//     return subscription.populateFull();
//   },

//   /* ================= ASSIGN TRIAL ================= */
//   async assignTrial(userId: string, trialType: "free" | "premium") {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return null;

//     const planName = trialType === "free" ? "Free" : "Premium";
//     const plan = await SubscriptionPlanModel.findOne({
//       name: planName,
//       is_active: true,
//     });

//     if (!plan) throw new Error(`${planName} plan not found`);

//     const start = new Date();
//     const unit = (plan.duration?.unit || "day") as DurationUnit;
//     const end = addDurationToDate(start, plan.duration.value, unit);

//     const trial = await UserSubscription.create({
//       user_id: userId,
//       plan_id: plan._id,
//       start_date: start,
//       end_date: end,
//       status: "new",
//       trial_type: trialType === "free" ? "free_sample" : "premium_sample",
//       is_active: true,
//       auto_renew: false,
//     });

//     return trial.populateFull();
//   },

//   /* ================= GET ACTIVE SUBSCRIPTION FOR USER ================= */
//   async getByUserId(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return null;

//     // Priority: upgrade > new/downgrade
//     let subscription = await UserSubscription.findOne({
//       user_id: userId,
//       status: "upgrade",
//       is_deleted: false,
//     }).sort({ end_date: -1 });

//     if (!subscription) {
//       subscription = await UserSubscription.findOne({
//         user_id,
//         status: { $in: ["new", "downgrade"] },
//         is_deleted: false,
//       }).sort({ end_date: -1 });
//     }

//     return subscription ? subscription.populateFull() : null;
//   },

//   /* ================= EXTEND SUBSCRIPTION PERIOD ================= */
//   async extendSubscriptionPeriod(
//     id: string,
//     durationValue: number,
//     durationUnit: DurationUnit
//   ) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;

//     const base =
//       subscription.end_date > new Date()
//         ? subscription.end_date
//         : new Date();

//     subscription.end_date = addDurationToDate(base, durationValue, durationUnit);
//     await subscription.save();

//     return subscription.populateFull();
//   },

//   /* ================= UPDATE SUBSCRIPTION ================= */
//   async update(id: string, updateData: any) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     updateData.updated_at = new Date();

//     const subscription = await UserSubscription.findByIdAndUpdate(id, updateData, {
//       new: true,
//     });

//     return subscription ? subscription.populateFull() : null;
//   },

//   /* ================= TOGGLE ACTIVE STATUS ================= */
//   async toggleActiveStatus(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;

//     subscription.is_active = !subscription.is_active;
//     subscription.updated_at = new Date();

//     return subscription.save();
//   },

//   /* ================= SOFT DELETE ================= */
//   async softDelete(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;

//     subscription.is_deleted = true;
//     subscription.is_active = false;
//     subscription.deleted_at = new Date();

//     await subscription.save();
//     return subscription.populateFull();
//   },

//   /* ================= RESTORE ================= */
//   async restore(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;

//     subscription.is_deleted = false;
//     subscription.is_active = true;
//     subscription.deleted_at = null;

//     await subscription.save();
//     return subscription.populateFull();
//   },

//   /* ================= EXPIRED SUBSCRIPTION HELPERS ================= */
//   async getExpiredFreeSubscriptions(now: Date) {
//     return UserSubscription.find({
//       trial_type: "free_sample",
//       end_date: { $lt: now },
//       is_deleted: false,
//     });
//   },

//   async getExpiredPremiumSubscriptions(now: Date) {
//     return UserSubscription.find({
//       trial_type: "premium_sample",
//       end_date: { $lt: now },
//       is_deleted: false,
//     });
//   },
// };


import mongoose from "mongoose";
import UserSubscription from "../models/userSubscriptionModel";
import User from "../models/userModel";
import SubscriptionPlanModel from "../models/subscriptionPlan.model";
import UserSubscriptionPayment from "../models/userSubscriptionPaymentModel";

/* ============================================================
                        INTERFACES
============================================================ */
interface PaginationOptions {
  page?: number;
  limit?: number;
}

type DurationUnit = "day" | "month" | "year";

/* ============================================================
                        HELPER FUNCTIONS
============================================================ */
const addDurationToDate = (
  date: Date,
  value: number,
  unit: DurationUnit
): Date => {
  const newDate = new Date(date);
  if (unit === "day") newDate.setDate(newDate.getDate() + value);
  if (unit === "month") newDate.setMonth(newDate.getMonth() + value);
  if (unit === "year") newDate.setFullYear(newDate.getFullYear() + value);
  return newDate;
};

/* ============================================================
                USER SUBSCRIPTION SERVICE
============================================================ */
export const userSubscriptionService = {
  /* ================= GET ALL SUBSCRIPTIONS (PAGINATION) ================= */
  async getAll(
    filter: Record<string, any> = {},
    options: PaginationOptions = {}
  ) {
    const pageNum = Math.max(options.page || 1, 1);
    const perPage = Math.max(options.limit || 10, 1);
    const skip = (pageNum - 1) * perPage;

    const searchQuery: any = {
      ...(filter.search
        ? {
            $or: [
              { firstname: { $regex: filter.search, $options: "i" } },
              { lastname: { $regex: filter.search, $options: "i" } },
              { email: { $regex: filter.search, $options: "i" } },
            ],
          }
        : {}),
    };

    const total = await User.countDocuments(searchQuery);

    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(perPage)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean();

    const subscriptions = await Promise.all(
      users.map(async (user) => {
        // cast _id to string for ObjectId
        const userId = new mongoose.Types.ObjectId(user._id as string);

        const subscription = await UserSubscription.findOne({
          user_id: userId,
          ...(filter.plan_id
            ? { plan_id: new mongoose.Types.ObjectId(filter.plan_id as string) }
            : {}),
          ...(filter.status ? { status: filter.status } : {}),
          ...(filter.is_active !== undefined ? { is_active: filter.is_active } : {}),
          ...(filter.is_deleted !== undefined ? { is_deleted: filter.is_deleted } : {}),
        });

        const finalSubscription = subscription ? await subscription.populateFull() : null;

        return {
          user,
          subscription: finalSubscription,
          status: finalSubscription?.status || "new",
          trial_type: finalSubscription?.trial_type || null,
        };
      })
    );

    return {
      success: true,
      data: subscriptions,
      total,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    };
  },

  /* ================= GET SUBSCRIPTION BY ID ================= */
  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const subscription = await UserSubscription.findById(id);
    return subscription ? subscription.populateFull() : null;
  },

  /* ================= CREATE OR UPDATE SUBSCRIPTION ================= */
  async createOrUpdateSubscription(
    userId: string,
    planId: string,
    durationValue: number,
    durationUnit: DurationUnit,
    trialType?: "free_sample" | "premium_sample",
    status: "new" | "upgrade" | "downgrade" = "new"
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(planId)
    ) {
      return null;
    }

    const now = new Date();
    const end = addDurationToDate(now, durationValue, durationUnit);
    const finalTrialType = trialType || "free_sample";

    const userObjId = new mongoose.Types.ObjectId(userId);
    const planObjId = new mongoose.Types.ObjectId(planId);

    // Find existing active subscription for user
    let subscription = await UserSubscription.findOne({
      user_id: userObjId,
      is_active: true,
      is_deleted: false,
    });

    if (subscription) {
      subscription.plan_id = planObjId;
      subscription.end_date = end;
      subscription.trial_type = finalTrialType;
      subscription.status = status;
      await subscription.save();
    } else {
      subscription = await UserSubscription.create({
        user_id: userObjId,
        plan_id: planObjId,
        start_date: now,
        end_date: end,
        status,
        trial_type: finalTrialType,
        is_active: true,
        auto_renew: false,
      });
    }

    // Track payment
    const plan = await SubscriptionPlanModel.findById(planObjId);
    if (plan) {
      const payment = await UserSubscriptionPayment.create({
        user_id: userObjId,
        plan_id: planObjId,
        user_subscription_id: subscription._id,
        amount: finalTrialType === "free_sample" ? 0 : plan.price,
        currency: "INR",
        payment_method: "system",
        transaction_id: `${status.toUpperCase()}-${Date.now()}`,
        order_id: `${status.toUpperCase()}-${Date.now()}`,
        payment_status: "success",
        type: status,
        payment_date: new Date(),
      });

      subscription.last_payment_id = payment._id;
      await subscription.save();
    }

    return subscription.populateFull();
  },

  /* ================= ASSIGN TRIAL ================= */
  async assignTrial(userId: string, trialType: "free" | "premium") {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    const planName = trialType === "free" ? "Free" : "Premium";
    const plan = await SubscriptionPlanModel.findOne({
      name: planName,
      is_active: true,
    });

    if (!plan) throw new Error(`${planName} plan not found`);

    const start = new Date();
    const unit = (plan.duration?.unit || "day") as DurationUnit;
    const end = addDurationToDate(start, plan.duration.value, unit);

    const trial = await UserSubscription.create({
      user_id: new mongoose.Types.ObjectId(userId),
      plan_id: plan._id,
      start_date: start,
      end_date: end,
      status: "new",
      trial_type: trialType === "free" ? "free_sample" : "premium_sample",
      is_active: true,
      auto_renew: false,
    });

    return trial.populateFull();
  },

  /* ================= GET ACTIVE SUBSCRIPTION FOR USER ================= */
  async getByUserId(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    const userObjId = new mongoose.Types.ObjectId(userId);

    let subscription = await UserSubscription.findOne({
      user_id: userObjId,
      status: "upgrade",
      is_deleted: false,
    }).sort({ end_date: -1 });

    if (!subscription) {
      subscription = await UserSubscription.findOne({
        user_id: userObjId,
        status: { $in: ["new", "downgrade"] },
        is_deleted: false,
      }).sort({ end_date: -1 });
    }

    return subscription ? subscription.populateFull() : null;
  },

  /* ================= EXTEND SUBSCRIPTION PERIOD ================= */
  async extendSubscriptionPeriod(
    id: string,
    durationValue: number,
    durationUnit: DurationUnit
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const subscription = await UserSubscription.findById(id);
    if (!subscription) return null;

    const base =
      subscription.end_date > new Date() ? subscription.end_date : new Date();

    subscription.end_date = addDurationToDate(base, durationValue, durationUnit);
    await subscription.save();

    return subscription.populateFull();
  },

  /* ================= UPDATE SUBSCRIPTION ================= */
  async update(id: string, updateData: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    updateData.updated_at = new Date();

    const subscription = await UserSubscription.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return subscription ? subscription.populateFull() : null;
  },

  /* ================= TOGGLE ACTIVE STATUS ================= */
  async toggleActiveStatus(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const subscription = await UserSubscription.findById(id);
    if (!subscription) return null;

    subscription.is_active = !subscription.is_active;
    subscription.updated_at = new Date();

    return subscription.save();
  },

  /* ================= SOFT DELETE ================= */
  async softDelete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const subscription = await UserSubscription.findById(id);
    if (!subscription) return null;

    subscription.is_deleted = true;
    subscription.is_active = false;
    subscription.deleted_at = new Date();

    await subscription.save();
    return subscription.populateFull();
  },

  /* ================= RESTORE ================= */
  async restore(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const subscription = await UserSubscription.findById(id);
    if (!subscription) return null;

    subscription.is_deleted = false;
    subscription.is_active = true;
    subscription.deleted_at = null;

    await subscription.save();
    return subscription.populateFull();
  },

  /* ================= EXPIRED SUBSCRIPTION HELPERS ================= */
  async getExpiredFreeSubscriptions(now: Date) {
    return UserSubscription.find({
      trial_type: "free_sample",
      end_date: { $lt: now },
      is_deleted: false,
    });
  },

  async getExpiredPremiumSubscriptions(now: Date) {
    return UserSubscription.find({
      trial_type: "premium_sample",
      end_date: { $lt: now },
      is_deleted: false,
    });
  },
};
