// import mongoose from "mongoose";
// import UserSubscription from "../models/userSubscriptionModel";
// import User from "../models/userModel";
// import SubscriptionPlanModel from "../models/subscriptionPlan.model";
// import UserSubscriptionPayment from "../models/userSubscriptionPaymentModel";
// import { emailService } from "@/emails/emailService";
// import { addDurationToDate, getMidnight } from "@/utils/dateUtils";

// interface PaginationOptions {
//   page?: number;
//   limit?: number;
// }

// type DurationUnit = "day" | "month" | "year";

// export const userSubscriptionService = {
//   async createOrUpdateSubscription(
//     userId: string,
//     planId: string,
//     durationValue: number,
//     durationUnit: DurationUnit,
//     trialType?: "free_sample" | "premium_sample",
//     isUserPurchase: boolean = false,
//   ) {
//     if (
//       !mongoose.Types.ObjectId.isValid(userId) ||
//       !mongoose.Types.ObjectId.isValid(planId)
//     ) {
//       throw new Error("Invalid user ID or plan ID");
//     }

//     const now = new Date();
//     const todayMidnight = getMidnight(now);
//     const endDate = addDurationToDate(
//       todayMidnight,
//       durationValue,
//       durationUnit,
//     );

//     const userObjId = new mongoose.Types.ObjectId(userId);
//     const planObjId = new mongoose.Types.ObjectId(planId);

//     const plan = await SubscriptionPlanModel.findById(planObjId);
//     if (!plan) throw new Error("Subscription plan not found");

//     const isFreePlan = plan.name.toLowerCase() === "free";
//     const finalTrialType =
//       trialType || (isFreePlan ? "free_sample" : "premium_sample");
//     const planType = isFreePlan ? "Free" : "Premium";

//     const user = await User.findById(userObjId).select(
//       "firstname email created_at",
//     );
//     if (!user) throw new Error("User not found");

//     let subscription = await UserSubscription.findOne({
//       user_id: userObjId,
//       is_deleted: false,
//     });

//     const oldPlanType = subscription?.plan_type || "none";
//     let status: "active" = "active";
//     let paymentType: "new" | "upgrade" | "downgrade" = "new";

//     if (subscription) {
//       if (oldPlanType === "Free" && planType === "Premium") {
//         paymentType = "upgrade";
//       } else if (oldPlanType === "Premium" && planType === "Free") {
//         paymentType = "downgrade";
//       } else if (oldPlanType === planType) {
//         paymentType = "new";
//       }

//       subscription.plan_id = planObjId;
//       subscription.plan_type = planType;
//       subscription.trial_type = finalTrialType;
//       subscription.start_date = todayMidnight;
//       subscription.end_date = endDate;
//       subscription.status = status;
//       subscription.is_active = true;
//       subscription.updated_at = now;

//       if (isUserPurchase && planType === "Premium") {
//         subscription.is_promotional = false;
//         subscription.promotional_trial_used = true;
//         subscription.eligibility.purchase_required = false;
//       }

//       if (!isUserPurchase && planType === "Premium" && plan.price === 0) {
//         subscription.is_promotional = true;
//       }

//       subscription.history.push({
//         plan_type: `${oldPlanType}→${planType}`,
//         status: paymentType,
//         changed_at: now,
//         reason: isUserPurchase ? "user_purchase" : "system_update",
//       });

//       await subscription.save();
//     } else {
//       paymentType = "new";

//       subscription = await UserSubscription.create({
//         user_id: userObjId,
//         plan_id: planObjId,
//         plan_type: planType,
//         trial_type: finalTrialType,
//         start_date: todayMidnight,
//         end_date: endDate,
//         status: status,
//         is_active: true,
//         auto_renew: false,
//         promotional_trial_used: isUserPurchase && planType === "Premium",
//         is_promotional:
//           !isUserPurchase && planType === "Premium" && plan.price === 0,
//         eligibility: {
//           can_purchase_premium: true,
//           last_premium_expiry_date: null,
//           purchase_required: false,
//         },
//         history: [
//           {
//             plan_type: planType,
//             status: paymentType,
//             changed_at: now,
//             reason: isUserPurchase ? "user_purchase" : "initial_subscription",
//           },
//         ],
//         created_at: now,
//         updated_at: now,
//       });
//     }

//     const payment = await UserSubscriptionPayment.create({
//       user_id: userObjId,
//       plan_id: planObjId,
//       user_subscription_id: subscription._id,
//       amount: isFreePlan ? 0 : plan.price,
//       currency: "INR",
//       payment_method: isFreePlan
//         ? "free_plan"
//         : isUserPurchase
//           ? "manual"
//           : "system",
//       payment_status: "success",
//       type: paymentType,
//       payment_date: now,
//       metadata: {
//         is_user_purchase: isUserPurchase,
//         is_promotional: subscription.is_promotional,
//         plan_name: plan.name,
//         duration: `${durationValue} ${durationUnit}(s)`,
//       },
//     });

//     subscription.last_payment_id = payment._id;
//     await subscription.save();

//     if (user.email) {
//       try {
//         if (paymentType === "upgrade" && subscription.is_promotional) {
//           // Promotional trial email
//           await emailService.trialUpgraded(user.email, {
//             userName: user.firstname || "User",
//             endDate: endDate,
//             isPromotional: true,
//             features: ["Access to Premium content", "Ad-free experience"],
//           });
//         } else {
//           // Regular subscription email
//           await emailService.subscriptionActivated(user.email, {
//             userName: user.firstname || "User",
//             planName: plan.name,
//             startDate: todayMidnight, // Use todayMidnight, not 'now'
//             endDate: endDate,
//             planPrice: plan.price || 0,
//             status: paymentType, // "new", "upgrade", "downgrade"
//             isUserPurchase: isUserPurchase,
//             isPromotional: subscription.is_promotional,
//           });
//         }
//       } catch (emailError) {
//         console.error("Failed to send subscription email:", emailError);
//       }
//     }

//     return subscription.populateFull();
//   },

//   async assignFreePlan(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       throw new Error("Invalid user ID");
//     }

//     const freePlan = await SubscriptionPlanModel.findOne({
//       name: "Free",
//       is_active: true,
//       is_deleted: false,
//     });

//     if (!freePlan) throw new Error("Free plan not found!");

//     return this.createOrUpdateSubscription(
//       userId,
//       freePlan._id.toString(),
//       freePlan.duration.value,
//       freePlan.duration.unit as DurationUnit,
//       "free_sample",
//       false,
//     );
//   },

//   async getByUserId(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return null;
//     const userObjId = new mongoose.Types.ObjectId(userId);

//     const subscription = await UserSubscription.findOne({
//       user_id: userObjId,
//       is_deleted: false,
//       is_active: true,
//     });

//     return subscription ? subscription.populateFull() : null;
//   },

//   async getAnySubscriptionByUserId(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return null;
//     const userObjId = new mongoose.Types.ObjectId(userId);

//     const subscription = await UserSubscription.findOne({
//       user_id: userObjId,
//     });

//     return subscription ? subscription.populateFull() : null;
//   },

//   async checkPurchaseEligibility(userId: string, planId?: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return { canPurchase: true, message: "" };
//     }

//     const subscription = await this.getByUserId(userId);

//     if (subscription?.eligibility.purchase_required) {
//       return {
//         canPurchase: false,
//         message:
//           "Your Premium trial has expired. Please purchase a Premium subscription.",
//         code: "PURCHASE_REQUIRED",
//         expiredDate: subscription.eligibility.last_premium_expiry_date,
//       };
//     }

//     if (planId) {
//       const plan = await SubscriptionPlanModel.findById(planId);
//       if (plan && plan.name.toLowerCase() === "premium" && plan.price === 0) {
//         if (subscription?.promotional_trial_used) {
//           return {
//             canPurchase: false,
//             message:
//               "You've already used your promotional trial. Please purchase a Premium subscription.",
//             code: "TRIAL_ALREADY_USED",
//           };
//         }
//       }
//     }

//     return { canPurchase: true, message: "" };
//   },

//   async upgradeToPremium(userId: string, premiumPlanId: string) {
//     const premiumPlan = await SubscriptionPlanModel.findOne({
//       _id: premiumPlanId,
//       name: "Premium",
//       is_active: true,
//       is_deleted: false,
//     });

//     if (!premiumPlan) throw new Error("Premium plan not found");

//     return this.createOrUpdateSubscription(
//       userId,
//       premiumPlan._id.toString(),
//       premiumPlan.duration.value,
//       premiumPlan.duration.unit as DurationUnit,
//       "premium_sample",
//       true,
//     );
//   },

//   async downgradeToFree(userId: string) {
//     const freePlan = await SubscriptionPlanModel.findOne({
//       name: "Free",
//       is_active: true,
//       is_deleted: false,
//     });

//     if (!freePlan) throw new Error("Free plan not found");

//     return this.createOrUpdateSubscription(
//       userId,
//       freePlan._id.toString(),
//       freePlan.duration.value,
//       freePlan.duration.unit as DurationUnit,
//       "free_sample",
//       false,
//     );
//   },

//   async getPaymentHistory(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return [];
//     const userObjId = new mongoose.Types.ObjectId(userId);

//     const payments = await UserSubscriptionPayment.find({
//       user_id: userObjId,
//     })
//       .populate("plan_id", "name price duration")
//       .sort({ payment_date: -1 })
//       .lean();

//     return payments;
//   },

//   async getAll(
//     filter: Record<string, any> = {},
//     options: PaginationOptions = {},
//   ) {
//     const pageNum = Math.max(options.page || 1, 1);
//     const perPage = Math.max(options.limit || 10, 1);
//     const skip = (pageNum - 1) * perPage;

//     const searchQuery: any = filter.search
//       ? {
//           $or: [
//             { firstname: { $regex: filter.search, $options: "i" } },
//             { lastname: { $regex: filter.search, $options: "i" } },
//             { email: { $regex: filter.search, $options: "i" } },
//           ],
//         }
//       : {};

//     const total = await User.countDocuments(searchQuery);

//     const users = await User.find(searchQuery)
//       .skip(skip)
//       .limit(perPage)
//       .select("-password -resetPasswordToken -resetPasswordExpires")
//       .lean();

//     const subscriptions = await Promise.all(
//       users.map(async (user) => {
//         const subscription = await this.getByUserId(user._id.toString());
//         const paymentHistory = subscription
//           ? await this.getPaymentHistory(user._id.toString())
//           : [];

//         return {
//           user,
//           subscription,
//           paymentHistory,
//           currentStatus: subscription?.status || "none",
//           planType: subscription?.plan_type || "none",
//           isPromotional: subscription?.is_promotional || false,
//         };
//       }),
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

//   async getById(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;
//     const subscription = await UserSubscription.findById(id);
//     return subscription ? subscription.populateFull() : null;
//   },

//   async update(id: string, updateData: any) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;
//     updateData.updated_at = new Date();
//     const subscription = await UserSubscription.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true },
//     );
//     return subscription ? subscription.populateFull() : null;
//   },

//   async toggleActiveStatus(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;
//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;
//     subscription.is_active = !subscription.is_active;
//     subscription.updated_at = new Date();
//     return subscription.save();
//   },

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
// };

// import mongoose from "mongoose";
// import UserSubscription from "../models/userSubscriptionModel";
// import User from "../models/userModel";
// import SubscriptionPlanModel from "../models/subscriptionPlan.model";
// import UserSubscriptionPayment from "../models/userSubscriptionPaymentModel";
// import { emailService } from "@/emails/emailService";
// import { addDurationToDate, getMidnight } from "@/utils/dateUtils";

// interface PaginationOptions {
//   page?: number;
//   limit?: number;
// }

// type DurationUnit = "day" | "month" | "year";

// export const userSubscriptionService = {
//   async createOrUpdateSubscription(
//     userId: string,
//     planId: string,
//     durationValue: number,
//     durationUnit: DurationUnit,
//     trialType?: "free_sample" | "premium_sample",
//     isUserPurchase: boolean = false,
//     reason:
//       | "user_purchase"
//       | "system_update"
//       | "manual_assign" = "system_update",
//     isPromotional: boolean = false, //  NEW PARAM
//   ) {
//     if (
//       !mongoose.Types.ObjectId.isValid(userId) ||
//       !mongoose.Types.ObjectId.isValid(planId)
//     ) {
//       throw new Error("Invalid user ID or plan ID");
//     }

//     const now = new Date();
//     const todayMidnight = getMidnight(now);

//     const userObjId = new mongoose.Types.ObjectId(userId);
//     const planObjId = new mongoose.Types.ObjectId(planId);

//     const plan = await SubscriptionPlanModel.findById(planObjId);
//     if (!plan) throw new Error("Subscription plan not found");

//     //  Use plan_type not name
//     const planType: "Free" | "Premium" = plan.plan_type;

//     const startDate = todayMidnight;
//     const endDate = addDurationToDate(startDate, durationValue, durationUnit);

//     const finalTrialType =
//       trialType || (planType === "Free" ? "free_sample" : "premium_sample");

//     const user = await User.findById(userObjId).select(
//       "firstname email created_at",
//     );
//     if (!user) throw new Error("User not found");

//     let subscription = await UserSubscription.findOne({
//       user_id: userObjId,
//       is_deleted: false,
//     });

//     const oldPlanType = subscription?.plan_type || "none";
//     let paymentType: "new" | "upgrade" | "downgrade" = "new";

//     if (subscription) {
//       if (oldPlanType === "Free" && planType === "Premium")
//         paymentType = "upgrade";
//       else if (oldPlanType === "Premium" && planType === "Free")
//         paymentType = "downgrade";
//       else paymentType = "new";

//       subscription.eligibility = subscription.eligibility || {
//         can_purchase_premium: true,
//         last_premium_expiry_date: null,
//         purchase_required: false,
//       };

//       subscription.plan_id = planObjId;
//       subscription.plan_type = planType;
//       subscription.trial_type = finalTrialType;
//       subscription.start_date = startDate;
//       subscription.end_date = endDate;
//       subscription.status = "active";
//       subscription.is_active = true;
//       subscription.updated_at = now;

//       //  promotional logic
//       if (planType === "Premium") {
//         if (isUserPurchase) {
//           subscription.is_promotional = false;
//           subscription.eligibility.purchase_required = false;
//           subscription.eligibility.can_purchase_premium = true;
//         } else {
//           subscription.is_promotional = isPromotional;
//           if (isPromotional) {
//             subscription.promotional_trial_used = true;
//             subscription.eligibility.purchase_required = false;
//           }
//         }
//       }

//       if (planType === "Free") {
//         subscription.is_promotional = false;
//       }

//       subscription.history = subscription.history || [];
//       subscription.history.push({
//         plan_type: `${oldPlanType}→${planType}`,
//         status: paymentType,
//         changed_at: now,
//         reason,
//       });

//       await subscription.save();
//     } else {
//       subscription = await UserSubscription.create({
//         user_id: userObjId,
//         plan_id: planObjId,
//         plan_type: planType,
//         trial_type: finalTrialType,
//         start_date: startDate,
//         end_date: endDate,
//         status: "active",
//         is_active: true,
//         auto_renew: false,

//         promotional_trial_used: isPromotional && planType === "Premium",
//         is_promotional: isPromotional && planType === "Premium",

//         eligibility: {
//           can_purchase_premium: true,
//           last_premium_expiry_date: null,
//           purchase_required: false,
//         },

//         history: [
//           {
//             plan_type: planType,
//             status: "new",
//             changed_at: now,
//             reason: isUserPurchase ? "user_purchase" : "initial_subscription",
//           },
//         ],
//       });
//     }

//     //  Payment record must store subscription period for invoice correctness
//     const payment = await UserSubscriptionPayment.create({
//       user_id: userObjId,
//       plan_id: planObjId,
//       user_subscription_id: subscription._id,

//       start_date: startDate,
//       end_date: endDate,

//       amount: planType === "Free" ? 0 : plan.price,
//       currency: plan.currency || "INR",
//       payment_method:
//         planType === "Free"
//           ? "free_plan"
//           : isUserPurchase
//             ? "manual"
//             : "system",
//       payment_status: "success",
//       type: paymentType,
//       payment_date: now,
//       metadata: {
//         is_user_purchase: isUserPurchase,
//         is_promotional: subscription.is_promotional,
//         plan_name: plan.name,
//         plan_type: planType,
//         duration: `${durationValue} ${durationUnit}(s)`,
//         reason,
//       },
//     });

//     subscription.last_payment_id = payment._id;
//     await subscription.save();

//     // Email
//     if (user.email) {
//       try {
//         if (paymentType === "upgrade" && subscription.is_promotional) {
//           await emailService.trialUpgraded(user.email, {
//             userName: user.firstname || "User",
//             endDate,
//             isPromotional: true,
//             features: ["Access to Premium content", "Ad-free experience"],
//           });
//         } else {
//           await emailService.subscriptionActivated(user.email, {
//             userName: user.firstname || "User",
//             planName: plan.name,
//             startDate,
//             endDate,
//             planPrice: plan.price || 0,
//             status: paymentType,
//             isUserPurchase,
//             isPromotional: subscription.is_promotional,
//           });
//         }
//       } catch (emailError) {
//         console.error("Failed to send subscription email:", emailError);
//       }
//     }

//     return subscription.populateFull();
//   },

//   async assignFreePlan(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId))
//       throw new Error("Invalid user ID");

//     const freePlan = await SubscriptionPlanModel.findOne({
//       plan_type: "Free",
//       is_active: true,
//       is_deleted: false,
//     });

//     if (!freePlan) throw new Error("Free plan not found!");

//     return this.createOrUpdateSubscription(
//       userId,
//       freePlan._id.toString(),
//       freePlan.duration.value,
//       freePlan.duration.unit as DurationUnit,
//       "free_sample",
//       false,
//       "system_update",
//       false,
//     );
//   },

//   async getByUserId(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return null;

//     const userObjId = new mongoose.Types.ObjectId(userId);

//     const subscription = await UserSubscription.findOne({
//       user_id: userObjId,
//       is_deleted: false,
//       is_active: true,
//     });

//     return subscription ? subscription.populateFull() : null;
//   },

//   async checkPurchaseEligibility(userId: string, planId?: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return { canPurchase: true, message: "" };
//     }

//     const subscription = await this.getByUserId(userId);

//     // If promo expired and purchase required => allow purchase
//     if (subscription?.eligibility.purchase_required) {
//       return { canPurchase: true, message: "" };
//     }

//     // Block only promotional trial if already used
//     if (planId) {
//       const plan = await SubscriptionPlanModel.findById(planId);

//       if (plan && plan.plan_type === "Premium") {
//         // If your frontend has a button for "Start free premium trial"
//         // then check this flag:
//         if (plan.price === 0 && subscription?.promotional_trial_used) {
//           return {
//             canPurchase: false,
//             message:
//               "You've already used your promotional trial. Please purchase a Premium subscription.",
//             code: "TRIAL_ALREADY_USED",
//           };
//         }
//       }
//     }

//     return { canPurchase: true, message: "" };
//   },

//   async downgradeToFree(userId: string) {
//     const freePlan = await SubscriptionPlanModel.findOne({
//       plan_type: "Free",
//       is_active: true,
//       is_deleted: false,
//     });

//     if (!freePlan) throw new Error("Free plan not found");

//     return this.createOrUpdateSubscription(
//       userId,
//       freePlan._id.toString(),
//       freePlan.duration.value,
//       freePlan.duration.unit as DurationUnit,
//       "free_sample",
//       false,
//       "system_update",
//       false,
//     );
//   },

//   async getPaymentHistory(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return [];

//     const userObjId = new mongoose.Types.ObjectId(userId);

//     return UserSubscriptionPayment.find({ user_id: userObjId })
//       .populate("plan_id", "name price duration plan_type")
//       .sort({ payment_date: -1 })
//       .lean();
//   },

//   async getAll(
//     filter: Record<string, any> = {},
//     options: PaginationOptions = {},
//   ) {
//     const pageNum = Math.max(options.page || 1, 1);
//     const perPage = Math.max(options.limit || 10, 1);
//     const skip = (pageNum - 1) * perPage;

//     const searchQuery: any = filter.search
//       ? {
//           $or: [
//             { firstname: { $regex: filter.search, $options: "i" } },
//             { lastname: { $regex: filter.search, $options: "i" } },
//             { email: { $regex: filter.search, $options: "i" } },
//           ],
//         }
//       : {};

//     const total = await User.countDocuments(searchQuery);

//     const users = await User.find(searchQuery)
//       .skip(skip)
//       .limit(perPage)
//       .select("-password -resetPasswordToken -resetPasswordExpires")
//       .lean();

//     const subscriptions = await Promise.all(
//       users.map(async (user) => {
//         const subscription = await this.getByUserId(user._id.toString());
//         const paymentHistory = subscription
//           ? await this.getPaymentHistory(user._id.toString())
//           : [];

//         return {
//           user,
//           subscription,
//           paymentHistory,
//           currentStatus: subscription?.status || "none",
//           planType: subscription?.plan_type || "none",
//           isPromotional: subscription?.is_promotional || false,
//         };
//       }),
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

//   async getById(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;
//     const subscription = await UserSubscription.findById(id);
//     return subscription ? subscription.populateFull() : null;
//   },

//   async update(id: string, updateData: any) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;
//     updateData.updated_at = new Date();
//     const subscription = await UserSubscription.findByIdAndUpdate(
//       id,
//       updateData,
//       {
//         new: true,
//       },
//     );
//     return subscription ? subscription.populateFull() : null;
//   },

//   async toggleActiveStatus(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;
//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;
//     subscription.is_active = !subscription.is_active;
//     subscription.updated_at = new Date();
//     return subscription.save();
//   },

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
// };

// import mongoose from "mongoose";
// import UserSubscription from "../models/userSubscriptionModel";
// import User from "../models/userModel";
// import SubscriptionPlanModel from "../models/subscriptionPlan.model";
// import UserSubscriptionPayment from "../models/userSubscriptionPaymentModel";
// import { emailService } from "@/emails/emailService";
// import { addDurationToDate, getMidnight } from "@/utils/dateUtils";

// interface PaginationOptions {
//   page?: number;
//   limit?: number;
// }

// type DurationUnit = "day" | "month" | "year";

// export const userSubscriptionService = {
//   async createOrUpdateSubscription(
//     userId: string,
//     planId: string,
//     durationValue: number,
//     durationUnit: DurationUnit,
//     trialType?: "free_sample" | "premium_sample",
//     isUserPurchase: boolean = false,
//     reason:
//       | "user_purchase"
//       | "system_update"
//       | "manual_assign" = "system_update",
//     isPromotional: boolean = false,
//   ) {
//     if (
//       !mongoose.Types.ObjectId.isValid(userId) ||
//       !mongoose.Types.ObjectId.isValid(planId)
//     ) {
//       throw new Error("Invalid user ID or plan ID");
//     }

//     const now = new Date();
//     const todayMidnight = getMidnight(now);

//     const userObjId = new mongoose.Types.ObjectId(userId);
//     const planObjId = new mongoose.Types.ObjectId(planId);

//     const plan = await SubscriptionPlanModel.findById(planObjId);
//     if (!plan) throw new Error("Subscription plan not found");

//     // Get plan_type - this will always exist now
//     const planType: "Free" | "Premium" = plan.plan_type;

//     const startDate = todayMidnight;
//     const endDate = addDurationToDate(startDate, durationValue, durationUnit);

//     const finalTrialType =
//       trialType || (planType === "Free" ? "free_sample" : "premium_sample");

//     const user = await User.findById(userObjId).select(
//       "firstname email created_at",
//     );
//     if (!user) throw new Error("User not found");

//     let subscription = await UserSubscription.findOne({
//       user_id: userObjId,
//       is_deleted: false,
//     });

//     const oldPlanType = subscription?.plan_type || "none";
//     let paymentType: "new" | "upgrade" | "downgrade" = "new";

//     if (subscription) {
//       if (oldPlanType === "Free" && planType === "Premium")
//         paymentType = "upgrade";
//       else if (oldPlanType === "Premium" && planType === "Free")
//         paymentType = "downgrade";
//       else paymentType = "new";

//       subscription.eligibility = subscription.eligibility || {
//         can_purchase_premium: true,
//         last_premium_expiry_date: null,
//         purchase_required: false,
//       };

//       subscription.plan_id = planObjId;
//       subscription.plan_type = planType;
//       subscription.trial_type = finalTrialType;
//       subscription.start_date = startDate;
//       subscription.end_date = endDate;
//       subscription.status = "active";
//       subscription.is_active = true;
//       subscription.updated_at = now;

//       // promotional logic
//       if (planType === "Premium") {
//         if (isUserPurchase) {
//           subscription.is_promotional = false;
//           subscription.eligibility.purchase_required = false;
//           subscription.eligibility.can_purchase_premium = true;
//         } else {
//           subscription.is_promotional = isPromotional;
//           if (isPromotional) {
//             subscription.promotional_trial_used = true;
//             subscription.eligibility.purchase_required = false;
//           }
//         }
//       }

//       if (planType === "Free") {
//         subscription.is_promotional = false;
//       }

//       subscription.history = subscription.history || [];
//       subscription.history.push({
//         plan_type: `${oldPlanType}→${planType}`,
//         status: paymentType,
//         changed_at: now,
//         reason,
//       });

//       await subscription.save();
//     } else {
//       subscription = await UserSubscription.create({
//         user_id: userObjId,
//         plan_id: planObjId,
//         plan_type: planType,
//         trial_type: finalTrialType,
//         start_date: startDate,
//         end_date: endDate,
//         status: "active",
//         is_active: true,
//         auto_renew: false,

//         promotional_trial_used: isPromotional && planType === "Premium",
//         is_promotional: isPromotional && planType === "Premium",

//         eligibility: {
//           can_purchase_premium: true,
//           last_premium_expiry_date: null,
//           purchase_required: false,
//         },

//         history: [
//           {
//             plan_type: planType,
//             status: "new",
//             changed_at: now,
//             reason: isUserPurchase ? "user_purchase" : "initial_subscription",
//           },
//         ],
//       });
//     }

//     // Payment record
//     const payment = await UserSubscriptionPayment.create({
//       user_id: userObjId,
//       plan_id: planObjId,
//       user_subscription_id: subscription._id,

//       start_date: startDate,
//       end_date: endDate,

//       amount: planType === "Free" ? 0 : plan.price,
//       currency: plan.currency || "INR",
//       payment_method:
//         planType === "Free"
//           ? "free_plan"
//           : isUserPurchase
//             ? "manual"
//             : "system",
//       payment_status: "success",
//       type: paymentType,
//       payment_date: now,
//       metadata: {
//         is_user_purchase: isUserPurchase,
//         is_promotional: subscription.is_promotional,
//         plan_name: plan.name,
//         plan_type: planType,
//         duration: `${durationValue} ${durationUnit}(s)`,
//         reason,
//       },
//     });

//     subscription.last_payment_id = payment._id;
//     await subscription.save();

//     // Email
//     if (user.email) {
//       try {
//         if (paymentType === "upgrade" && subscription.is_promotional) {
//           await emailService.trialUpgraded(user.email, {
//             userName: user.firstname || "User",
//             endDate,
//             isPromotional: true,
//             features: ["Access to Premium content", "Ad-free experience"],
//           });
//         } else {
//           await emailService.subscriptionActivated(user.email, {
//             userName: user.firstname || "User",
//             planName: plan.name,
//             startDate,
//             endDate,
//             planPrice: plan.price || 0,
//             status: paymentType,
//             isUserPurchase,
//             isPromotional: subscription.is_promotional,
//           });
//         }
//       } catch (emailError) {
//         console.error("Failed to send subscription email:", emailError);
//       }
//     }

//     return subscription.populateFull();
//   },

//   async assignFreePlan(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId))
//       throw new Error("Invalid user ID");

//     // FIXED: Get Free plan with proper query
//     const freePlan = await SubscriptionPlanModel.findOne({
//       plan_type: "Free",
//       is_active: true,
//       is_deleted: false,
//     });

//     // If no Free plan exists, create one
//     if (!freePlan) {
//       console.warn("No Free plan found, creating one...");

//       // Create a default Free plan
//       const defaultFreePlan = {
//         name: "Free Plan",
//         plan_type: "Free" as const,
//         description: "Basic free subscription with limited features",
//         price: 0,
//         currency: "INR",
//         duration: {
//           value: 30,
//           unit: "day" as const,
//         },
//         is_promotional_plan: false,
//         features: ["Basic Access", "Limited Storage", "Standard Support"],
//         is_active: true,
//         is_deleted: false,
//       };

//       try {
//         const createdPlan = await SubscriptionPlanModel.create(defaultFreePlan);
//         console.log("✅ Created default Free plan:", createdPlan._id);

//         return this.createOrUpdateSubscription(
//           userId,
//           createdPlan._id.toString(),
//           createdPlan.duration.value,
//           createdPlan.duration.unit as DurationUnit,
//           "free_sample",
//           false,
//           "system_update",
//           false,
//         );
//       } catch (error: any) {
//         console.error("Failed to create Free plan:", error);
//         throw new Error(
//           `Free plan not found and creation failed: ${error.message}`,
//         );
//       }
//     }

//     return this.createOrUpdateSubscription(
//       userId,
//       freePlan._id.toString(),
//       freePlan.duration.value,
//       freePlan.duration.unit as DurationUnit,
//       "free_sample",
//       false,
//       "system_update",
//       false,
//     );
//   },

//   async getByUserId(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return null;

//     const userObjId = new mongoose.Types.ObjectId(userId);

//     const subscription = await UserSubscription.findOne({
//       user_id: userObjId,
//       is_deleted: false,
//       is_active: true,
//     });

//     return subscription ? subscription.populateFull() : null;
//   },

//   async checkPurchaseEligibility(userId: string, planId?: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return { canPurchase: true, message: "" };
//     }

//     const subscription = await this.getByUserId(userId);

//     // If promo expired and purchase required => allow purchase
//     if (subscription?.eligibility.purchase_required) {
//       return { canPurchase: true, message: "" };
//     }

//     // Block only promotional trial if already used
//     if (planId) {
//       const plan = await SubscriptionPlanModel.findById(planId);

//       if (plan && plan.plan_type === "Premium") {
//         // If your frontend has a button for "Start free premium trial"
//         // then check this flag:
//         if (plan.price === 0 && subscription?.promotional_trial_used) {
//           return {
//             canPurchase: false,
//             message:
//               "You've already used your promotional trial. Please purchase a Premium subscription.",
//             code: "TRIAL_ALREADY_USED",
//           };
//         }
//       }
//     }

//     return { canPurchase: true, message: "" };
//   },

//   async downgradeToFree(userId: string) {
//     const freePlan = await SubscriptionPlanModel.findOne({
//       plan_type: "Free",
//       is_active: true,
//       is_deleted: false,
//     });

//     if (!freePlan) throw new Error("Free plan not found");

//     return this.createOrUpdateSubscription(
//       userId,
//       freePlan._id.toString(),
//       freePlan.duration.value,
//       freePlan.duration.unit as DurationUnit,
//       "free_sample",
//       false,
//       "system_update",
//       false,
//     );
//   },

//   async getPaymentHistory(userId: string) {
//     if (!mongoose.Types.ObjectId.isValid(userId)) return [];

//     const userObjId = new mongoose.Types.ObjectId(userId);

//     return UserSubscriptionPayment.find({ user_id: userObjId })
//       .populate("plan_id", "name price duration plan_type")
//       .sort({ payment_date: -1 })
//       .lean();
//   },

//   async getAll(
//     filter: Record<string, any> = {},
//     options: PaginationOptions = {},
//   ) {
//     const pageNum = Math.max(options.page || 1, 1);
//     const perPage = Math.max(options.limit || 10, 1);
//     const skip = (pageNum - 1) * perPage;

//     const searchQuery: any = filter.search
//       ? {
//           $or: [
//             { firstname: { $regex: filter.search, $options: "i" } },
//             { lastname: { $regex: filter.search, $options: "i" } },
//             { email: { $regex: filter.search, $options: "i" } },
//           ],
//         }
//       : {};

//     const total = await User.countDocuments(searchQuery);

//     const users = await User.find(searchQuery)
//       .skip(skip)
//       .limit(perPage)
//       .select("-password -resetPasswordToken -resetPasswordExpires")
//       .lean();

//     const subscriptions = await Promise.all(
//       users.map(async (user) => {
//         const subscription = await this.getByUserId(user._id.toString());
//         const paymentHistory = subscription
//           ? await this.getPaymentHistory(user._id.toString())
//           : [];

//         return {
//           user,
//           subscription,
//           paymentHistory,
//           currentStatus: subscription?.status || "none",
//           planType: subscription?.plan_type || "none",
//           isPromotional: subscription?.is_promotional || false,
//         };
//       }),
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

//   async getById(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;
//     const subscription = await UserSubscription.findById(id);
//     return subscription ? subscription.populateFull() : null;
//   },

//   async update(id: string, updateData: any) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;
//     updateData.updated_at = new Date();
//     const subscription = await UserSubscription.findByIdAndUpdate(
//       id,
//       updateData,
//       {
//         new: true,
//       },
//     );
//     return subscription ? subscription.populateFull() : null;
//   },

//   async toggleActiveStatus(id: string) {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;
//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) return null;
//     subscription.is_active = !subscription.is_active;
//     subscription.updated_at = new Date();
//     return subscription.save();
//   },

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
// };

import mongoose from "mongoose";
import UserSubscription from "../models/userSubscriptionModel";
import User from "../models/userModel";
import SubscriptionPlanModel from "../models/subscriptionPlan.model";
import UserSubscriptionPayment from "../models/userSubscriptionPaymentModel";
import { getResponseEmailService } from "./getResponseEmailService";
import { addDurationToDate, getMidnight } from "@/utils/dateUtils";

interface PaginationOptions {
  page?: number;
  limit?: number;
}

type DurationUnit = "day" | "month" | "year";

export const userSubscriptionService = {
  async createOrUpdateSubscription(
    userId: string,
    planId: string,
    durationValue: number,
    durationUnit: DurationUnit,
    trialType?: "free_sample" | "premium_sample",
    isUserPurchase: boolean = false,
    reason:
      | "user_purchase"
      | "system_update"
      | "manual_assign" = "system_update",
    isPromotional: boolean = false,
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(planId)
    ) {
      throw new Error("Invalid user ID or plan ID");
    }

    const now = new Date();
    const todayMidnight = getMidnight(now);

    const userObjId = new mongoose.Types.ObjectId(userId);
    const planObjId = new mongoose.Types.ObjectId(planId);

    const plan = await SubscriptionPlanModel.findById(planObjId);
    if (!plan) throw new Error("Subscription plan not found");

    // Get plan_type - this will always exist now
    const planType: "Free" | "Premium" = plan.plan_type;

    const startDate = todayMidnight;
    const endDate = addDurationToDate(startDate, durationValue, durationUnit);

    const finalTrialType =
      trialType || (planType === "Free" ? "free_sample" : "premium_sample");

    const user = await User.findById(userObjId).select(
      "firstname email created_at",
    );
    if (!user) throw new Error("User not found");

    let subscription = await UserSubscription.findOne({
      user_id: userObjId,
      is_deleted: false,
    });

    // Idempotency guard for repeated user purchase calls:
    // if same plan is already active and valid, reuse current subscription.
    if (
      isUserPurchase &&
      subscription &&
      subscription.is_active &&
      subscription.end_date > now &&
      subscription.plan_id?.toString() === planObjId.toString()
    ) {
      return subscription.populateFull();
    }

    const oldPlanType = subscription?.plan_type || "none";
    let paymentType: "new" | "upgrade" | "downgrade" = "new";

    if (subscription) {
      if (oldPlanType === "Free" && planType === "Premium")
        paymentType = "upgrade";
      else if (oldPlanType === "Premium" && planType === "Free")
        paymentType = "downgrade";
      else paymentType = "new";

      subscription.eligibility = subscription.eligibility || {
        can_purchase_premium: true,
        last_premium_expiry_date: null,
        purchase_required: false,
      };

      subscription.plan_id = planObjId;
      subscription.plan_type = planType;
      subscription.trial_type = finalTrialType;
      subscription.start_date = startDate;
      subscription.end_date = endDate;
      subscription.status = "active";
      subscription.is_active = true;
      subscription.updated_at = now;

      // promotional logic
      if (planType === "Premium") {
        if (isUserPurchase) {
          subscription.is_promotional = false;
          subscription.eligibility.purchase_required = false;
          subscription.eligibility.can_purchase_premium = true;
        } else {
          subscription.is_promotional = isPromotional;
          if (isPromotional) {
            subscription.promotional_trial_used = true;
            subscription.eligibility.purchase_required = false;
          }
        }
      }

      if (planType === "Free") {
        subscription.is_promotional = false;
      }

      subscription.history = subscription.history || [];
      subscription.history.push({
        plan_type: `${oldPlanType}→${planType}`,
        status: paymentType,
        changed_at: now,
        reason,
      });

      await subscription.save();
    } else {
      subscription = await UserSubscription.create({
        user_id: userObjId,
        plan_id: planObjId,
        plan_type: planType,
        trial_type: finalTrialType,
        start_date: startDate,
        end_date: endDate,
        status: "active",
        is_active: true,
        auto_renew: false,

        promotional_trial_used: isPromotional && planType === "Premium",
        is_promotional: isPromotional && planType === "Premium",

        eligibility: {
          can_purchase_premium: true,
          last_premium_expiry_date: null,
          purchase_required: false,
        },

        history: [
          {
            plan_type: planType,
            status: "new",
            changed_at: now,
            reason: isUserPurchase ? "user_purchase" : "initial_subscription",
          },
        ],
      });
    }

    // Payment record
    const payment = await UserSubscriptionPayment.create({
      user_id: userObjId,
      plan_id: planObjId,
      user_subscription_id: subscription._id,

      start_date: startDate,
      end_date: endDate,

      amount: planType === "Free" ? 0 : plan.price,
      currency: plan.currency || "INR",
      payment_method:
        planType === "Free"
          ? "free_plan"
          : isUserPurchase
            ? "manual"
            : "system",
      payment_status: "success",
      type: paymentType,
      payment_date: now,
      metadata: {
        is_user_purchase: isUserPurchase,
        is_promotional: subscription.is_promotional,
        plan_name: plan.name,
        plan_type: planType,
        duration: `${durationValue} ${durationUnit}(s)`,
        reason,
      },
    });

    subscription.last_payment_id = payment._id;
    await subscription.save();

    // Email - with 5 minute delay for subscription activation
    if (user.email) {
      try {
        if (paymentType === "upgrade" && subscription.is_promotional) {
          // Trial upgraded email - send immediately
          /* OLD SMTP IMPLEMENTATION (COMMENTED)
          await emailService.trialUpgraded(user.email, {
            userName: user.firstname || "User",
            endDate,
            isPromotional: true,
            features: ["Access to Premium content", "Ad-free experience"],
          });
          */
          await getResponseEmailService.sendTrialUpgraded(user.email, {
            userName: user.firstname || "User",
            endDate,
            isPromotional: true,
            features: ["Access to Premium content", "Ad-free experience"],
          });
        } else {
          // Subscription activation email - send after 5 minutes
          setTimeout(
            async () => {
              try {
                /* OLD SMTP IMPLEMENTATION (COMMENTED)
                await emailService.subscriptionActivated(user.email!, {
                  userName: user.firstname || "User",
                  planName: plan.name,
                  startDate,
                  endDate,
                  planPrice: plan.price || 0,
                  status: paymentType,
                  isUserPurchase,
                  isPromotional: subscription.is_promotional,
                });
                */
                await getResponseEmailService.sendSubscriptionActivated(
                  user.email!,
                  {
                    userName: user.firstname || "User",
                    planName: plan.name,
                    startDate,
                    endDate,
                    planPrice: plan.price || 0,
                    status: paymentType,
                    isUserPurchase,
                    isPromotional: subscription.is_promotional,
                  },
                );
                console.log(
                  ` Delayed subscription email sent to: ${user.email}`,
                );
              } catch (emailError) {
                console.error(
                  "Failed to send delayed subscription email:",
                  emailError,
                );
              }
            },
            5 * 60 * 1000,
          ); // 5 minutes in milliseconds
        }
      } catch (emailError) {
        console.error(
          "Failed to send immediate subscription email:",
          emailError,
        );
      }
    }

    return subscription.populateFull();
  },

  async assignFreePlan(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new Error("Invalid user ID");

    // FIXED: Get Free plan with proper query
    const freePlan = await SubscriptionPlanModel.findOne({
      plan_type: "Free",
      is_active: true,
      is_deleted: false,
    });

    // If no Free plan exists, create one
    if (!freePlan) {
      console.warn("No Free plan found, creating one...");

      // Create a default Free plan
      const defaultFreePlan = {
        name: "Free Plan",
        plan_type: "Free" as const,
        description: "Basic free subscription with limited features",
        price: 0,
        currency: "INR",
        duration: {
          value: 30,
          unit: "day" as const,
        },
        is_promotional_plan: false,
        features: ["Basic Access", "Limited Storage", "Standard Support"],
        is_active: true,
        is_deleted: false,
      };

      try {
        const createdPlan = await SubscriptionPlanModel.create(defaultFreePlan);
        console.log("✅ Created default Free plan:", createdPlan._id);

        return this.createOrUpdateSubscription(
          userId,
          createdPlan._id.toString(),
          createdPlan.duration.value,
          createdPlan.duration.unit as DurationUnit,
          "free_sample",
          false,
          "system_update",
          false,
        );
      } catch (error: any) {
        console.error("Failed to create Free plan:", error);
        throw new Error(
          `Free plan not found and creation failed: ${error.message}`,
        );
      }
    }

    return this.createOrUpdateSubscription(
      userId,
      freePlan._id.toString(),
      freePlan.duration.value,
      freePlan.duration.unit as DurationUnit,
      "free_sample",
      false,
      "system_update",
      false,
    );
  },

  async getByUserId(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    const userObjId = new mongoose.Types.ObjectId(userId);

    const subscription = await UserSubscription.findOne({
      user_id: userObjId,
      is_deleted: false,
      is_active: true,
    });

    return subscription ? subscription.populateFull() : null;
  },

  async checkPurchaseEligibility(userId: string, planId?: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { canPurchase: true, message: "" };
    }

    const subscription = await this.getByUserId(userId);

    // If promo expired and purchase required => allow purchase
    if (subscription?.eligibility.purchase_required) {
      return { canPurchase: true, message: "" };
    }

    // Block only promotional trial if already used
    if (planId) {
      const plan = await SubscriptionPlanModel.findById(planId);

      if (plan && plan.plan_type === "Premium") {
        // If your frontend has a button for "Start free premium trial"
        // then check this flag:
        if (plan.price === 0 && subscription?.promotional_trial_used) {
          return {
            canPurchase: false,
            message:
              "You've already used your promotional trial. Please purchase a Premium subscription.",
            code: "TRIAL_ALREADY_USED",
          };
        }
      }
    }

    return { canPurchase: true, message: "" };
  },

  async downgradeToFree(userId: string) {
    const freePlan = await SubscriptionPlanModel.findOne({
      plan_type: "Free",
      is_active: true,
      is_deleted: false,
    });

    if (!freePlan) throw new Error("Free plan not found");

    return this.createOrUpdateSubscription(
      userId,
      freePlan._id.toString(),
      freePlan.duration.value,
      freePlan.duration.unit as DurationUnit,
      "free_sample",
      false,
      "system_update",
      false,
    );
  },

  async getPaymentHistory(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];

    const userObjId = new mongoose.Types.ObjectId(userId);

    return UserSubscriptionPayment.find({ user_id: userObjId })
      .populate("plan_id", "name price duration plan_type")
      .sort({ payment_date: -1 })
      .lean();
  },

  async getAll(
    filter: Record<string, any> = {},
    options: PaginationOptions = {},
  ) {
    const pageNum = Math.max(options.page || 1, 1);
    const perPage = Math.max(options.limit || 10, 1);
    const skip = (pageNum - 1) * perPage;

    const searchQuery: any = filter.search
      ? {
          $or: [
            { firstname: { $regex: filter.search, $options: "i" } },
            { lastname: { $regex: filter.search, $options: "i" } },
            { email: { $regex: filter.search, $options: "i" } },
          ],
        }
      : {};

    const total = await User.countDocuments(searchQuery);

    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(perPage)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean();

    const subscriptions = await Promise.all(
      users.map(async (user) => {
        const subscription = await this.getByUserId(user._id.toString());
        const paymentHistory = subscription
          ? await this.getPaymentHistory(user._id.toString())
          : [];

        return {
          user,
          subscription,
          paymentHistory,
          currentStatus: subscription?.status || "none",
          planType: subscription?.plan_type || "none",
          isPromotional: subscription?.is_promotional || false,
        };
      }),
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

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const subscription = await UserSubscription.findById(id);
    return subscription ? subscription.populateFull() : null;
  },

  async update(id: string, updateData: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    updateData.updated_at = new Date();
    const subscription = await UserSubscription.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
      },
    );
    return subscription ? subscription.populateFull() : null;
  },

  async toggleActiveStatus(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const subscription = await UserSubscription.findById(id);
    if (!subscription) return null;
    subscription.is_active = !subscription.is_active;
    subscription.updated_at = new Date();
    return subscription.save();
  },

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
};
