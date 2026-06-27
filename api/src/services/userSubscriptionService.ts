import mongoose from "mongoose";
import UserSubscription from "../models/userSubscriptionModel";
import User from "../models/userModel";
import SubscriptionPlanModel from "../models/subscriptionPlan.model";
import UserSubscriptionPayment, {
  type IUserSubscriptionPayment,
} from "../models/userSubscriptionPaymentModel";
import {
  addDurationToDate,
  getMidnight,
  isActiveByDay,
  isExpiredByDay,
} from "@/utils/dateUtils";
import {
  FREE_SUBSCRIPTION_FALLBACK_YEARS,
  PREMIUM_TRIAL_DAYS,
} from "@/config/subscription";

interface PaginationOptions {
  page?: number;
  limit?: number;
}

type DurationUnit = "day" | "month" | "year";
type TrialType = "free_sample" | "premium_sample";
type SubscriptionReason = "user_purchase" | "system_update" | "manual_assign";
type PaymentType = "new" | "upgrade" | "downgrade";
type PaymentMethod = "manual" | "free_plan" | "system";

interface PaymentOverrideOptions {
  amount?: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  metadata?: Record<string, unknown>;
}

interface SubscriptionMutationResult {
  subscription: any;
  payment: IUserSubscriptionPayment;
}

interface PurchaseEligibilityResult {
  canPurchase: boolean;
  message: string;
  code?: string;
}

const getActiveFreePlan = async () => {
  return SubscriptionPlanModel.findOne({
    plan_type: "Free",
    is_active: true,
    is_deleted: false,
  }).sort({ updated_at: -1, created_at: -1 });
};

const getActivePremiumPlan = async () => {
  return SubscriptionPlanModel.findOne({
    plan_type: "Premium",
    is_active: true,
    is_deleted: false,
  }).sort({ updated_at: -1, created_at: -1 });
};

const ensureEligibility = (subscription: any) => {
  subscription.eligibility = subscription.eligibility || {
    can_purchase_premium: true,
    last_premium_expiry_date: null,
    purchase_required: false,
  };
};

const getTrialTypeForPlan = (planType: "Free" | "Premium"): TrialType =>
  planType === "Free" ? "free_sample" : "premium_sample";

const getFreeSubscriptionEndDate = (startDate: Date) =>
  addDurationToDate(startDate, FREE_SUBSCRIPTION_FALLBACK_YEARS, "year");

const getPremiumTrialEndDate = (startDate: Date) =>
  addDurationToDate(startDate, PREMIUM_TRIAL_DAYS, "day");

const getPaymentType = (
  oldPlanType: string | undefined,
  newPlanType: "Free" | "Premium",
): PaymentType => {
  if (oldPlanType === "Free" && newPlanType === "Premium") return "upgrade";
  if (oldPlanType === "Premium" && newPlanType === "Free") return "downgrade";
  return "new";
};

const formatTransitionLabel = (oldPlanType: string, newPlanType: string) =>
  `${oldPlanType}->${newPlanType}`;

const resolvePaymentMethod = ({
  planType,
  isUserPurchase,
  override,
}: {
  planType: "Free" | "Premium";
  isUserPurchase: boolean;
  override?: PaymentMethod;
}): PaymentMethod => {
  if (override) return override;
  if (planType === "Free") return "free_plan";
  return isUserPurchase ? "manual" : "system";
};

const buildPlanSnapshot = (plan: any) => ({
  name: plan.name,
  price: plan.price,
  currency: plan.currency,
  duration: plan.duration,
  features: plan.features || [],
});

const createPaymentRecord = async ({
  userId,
  plan,
  subscription,
  paymentType,
  now,
  isUserPurchase,
  reason,
  overrides,
}: {
  userId: mongoose.Types.ObjectId;
  plan: any;
  subscription: any;
  paymentType: PaymentType;
  now: Date;
  isUserPurchase: boolean;
  reason: string;
  overrides?: PaymentOverrideOptions;
}) => {
  const amount =
    overrides?.amount ?? (plan.plan_type === "Free" ? 0 : Number(plan.price || 0));
  const currency = overrides?.currency || plan.currency || "INR";
  const paymentMethod = resolvePaymentMethod({
    planType: plan.plan_type,
    isUserPurchase,
    override: overrides?.paymentMethod,
  });

  return UserSubscriptionPayment.create({
    user_id: userId,
    plan_id: plan._id,
    user_subscription_id: subscription._id,
    start_date: subscription.start_date,
    end_date: subscription.end_date,
    amount,
    currency,
    payment_method: paymentMethod,
    payment_status: "success",
    type: paymentType,
    payment_date: now,
    plan_snapshot: buildPlanSnapshot(plan),
    metadata: {
      is_user_purchase: isUserPurchase,
      is_promotional: subscription.is_promotional,
      plan_name: plan.name,
      plan_type: plan.plan_type,
      duration: `${plan.duration?.value} ${plan.duration?.unit}(s)`,
      reason,
      ...(overrides?.metadata || {}),
    },
  });
};

const requireActiveFreePlan = async () => {
  const freePlan = await getActiveFreePlan();
  if (!freePlan) {
    throw new Error(
      "No active Free plan is configured. Please create and activate a Free subscription plan first.",
    );
  }
  return freePlan;
};

const downgradeExpiredPremiumSubscription = async (
  subscription: any,
  now: Date = new Date(),
) => {
  const todayMidnight = getMidnight(now);

  if (
    !subscription ||
    subscription.is_deleted ||
    !subscription.is_active ||
    subscription.status === "expired" ||
    subscription.plan_type !== "Premium" ||
    !isExpiredByDay(subscription.end_date, todayMidnight)
  ) {
    return subscription;
  }

  const freePlan = await requireActiveFreePlan();

  const premiumExpiredAt = new Date(subscription.end_date);
  const wasPromotional = subscription.is_promotional === true;
  const freeStartDate = getMidnight(now);
  const freeEndDate = getFreeSubscriptionEndDate(freeStartDate);

  subscription.plan_type = "Free";
  subscription.plan_id = freePlan._id;
  subscription.trial_type = "free_sample";
  subscription.start_date = freeStartDate;
  subscription.end_date = freeEndDate;
  subscription.status = "active";
  subscription.is_active = true;
  subscription.is_promotional = false;
  subscription.updated_at = now;

  ensureEligibility(subscription);
  subscription.eligibility.last_premium_expiry_date = premiumExpiredAt;
  subscription.eligibility.purchase_required = false;
  subscription.eligibility.can_purchase_premium = true;

  subscription.history = subscription.history || [];
  subscription.history.push({
    plan_type: formatTransitionLabel("Premium", "Free"),
    status: "downgrade",
    changed_at: now,
    reason: wasPromotional ? "promotional_expired" : "paid_premium_expired",
  });

  await subscription.save();

  const payment = await createPaymentRecord({
    userId: subscription.user_id,
    plan: freePlan,
    subscription,
    paymentType: "downgrade",
    now,
    isUserPurchase: false,
    reason: "automatic_downgrade_on_expiry",
    overrides: {
      amount: 0,
      paymentMethod: "system",
      metadata: {
        previous_plan: "Premium",
        new_plan: "Free",
        was_promotional: wasPromotional,
        premium_expired_at: premiumExpiredAt,
      },
    },
  });

  subscription.last_payment_id = payment._id;
  await subscription.save();

  return subscription;
};

const hasUsedPromotionalPremiumTrial = (subscription: any) =>
  Boolean(subscription?.promotional_trial_used);

const shouldAutoDowngradeExpiredPremium = (
  subscription: any,
  now: Date = new Date(),
) =>
  Boolean(
    subscription &&
      !subscription.is_deleted &&
      subscription.is_active &&
      subscription.status !== "expired" &&
      subscription.plan_type === "Premium" &&
      isExpiredByDay(subscription.end_date, getMidnight(now)),
  );

export const userSubscriptionService = {
  async createOrUpdateSubscriptionWithPayment(
    userId: string,
    planId: string,
    durationValue: number,
    durationUnit: DurationUnit,
    trialType?: TrialType,
    isUserPurchase: boolean = false,
    reason: SubscriptionReason = "system_update",
    isPromotional: boolean = false,
    paymentOverrides?: PaymentOverrideOptions,
  ): Promise<SubscriptionMutationResult> {
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

    const planType: "Free" | "Premium" = plan.plan_type;
    const startDate = todayMidnight;
    const endDate =
      planType === "Free"
        ? getFreeSubscriptionEndDate(startDate)
        : addDurationToDate(startDate, durationValue, durationUnit);
    const finalTrialType = trialType || getTrialTypeForPlan(planType);

    const user = await User.findById(userObjId).select("firstname email created_at");
    if (!user) throw new Error("User not found");

    let subscription = await UserSubscription.findOne({
      user_id: userObjId,
      is_deleted: false,
    });

    if (
      isUserPurchase &&
      subscription &&
      subscription.is_active &&
      subscription.status !== "expired" &&
      isActiveByDay(subscription.end_date, now) &&
      subscription.plan_id?.toString() === planObjId.toString()
    ) {
      const existingPayment = subscription.last_payment_id
        ? await UserSubscriptionPayment.findById(subscription.last_payment_id)
        : null;

      return {
        subscription: await subscription.populateFull(),
        payment:
          existingPayment ||
          (await UserSubscriptionPayment.findOne({
            user_subscription_id: subscription._id,
          }).sort({ payment_date: -1 }))!,
      };
    }

    const oldPlanType = subscription?.plan_type || "none";
    const paymentType = getPaymentType(subscription?.plan_type, planType);

    if (subscription) {
      ensureEligibility(subscription);

      subscription.plan_id = planObjId;
      subscription.plan_type = planType;
      subscription.trial_type = finalTrialType;
      subscription.start_date = startDate;
      subscription.end_date = endDate;
      subscription.status = "active";
      subscription.is_active = true;
      subscription.updated_at = now;

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
        subscription.eligibility.purchase_required = false;
        subscription.eligibility.can_purchase_premium = true;
      }

      subscription.history = subscription.history || [];
      subscription.history.push({
        plan_type: formatTransitionLabel(oldPlanType, planType),
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

    const payment = await createPaymentRecord({
      userId: userObjId,
      plan,
      subscription,
      paymentType,
      now,
      isUserPurchase,
      reason,
      overrides: paymentOverrides,
    });

    subscription.last_payment_id = payment._id;
    await subscription.save();

    return {
      subscription: await subscription.populateFull(),
      payment,
    };
  },

  async createOrUpdateSubscription(
    userId: string,
    planId: string,
    durationValue: number,
    durationUnit: DurationUnit,
    trialType?: TrialType,
    isUserPurchase: boolean = false,
    reason: SubscriptionReason = "system_update",
    isPromotional: boolean = false,
    paymentOverrides?: PaymentOverrideOptions,
  ) {
    const { subscription } = await this.createOrUpdateSubscriptionWithPayment(
      userId,
      planId,
      durationValue,
      durationUnit,
      trialType,
      isUserPurchase,
      reason,
      isPromotional,
      paymentOverrides,
    );

    return subscription;
  },

  async assignFreePlan(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const freePlan = await requireActiveFreePlan();

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

  async applyExpiredPremiumDowngrade(subscriptionId: string, now = new Date()) {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      throw new Error("Invalid subscription ID");
    }

    const subscription = await UserSubscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    return downgradeExpiredPremiumSubscription(subscription, now);
  },

  async grantPromotionalPremiumTrial(subscriptionId: string, now = new Date()) {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      throw new Error("Invalid subscription ID");
    }

    const subscription = await UserSubscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (subscription.is_deleted || !subscription.is_active) {
      throw new Error("Subscription is not active");
    }

    if (subscription.plan_type !== "Free") {
      throw new Error("Only active Free subscriptions are eligible");
    }

    if (hasUsedPromotionalPremiumTrial(subscription)) {
      throw new Error("Premium trial is available only once per user");
    }

    const premiumPlan = await getActivePremiumPlan();
    if (!premiumPlan) {
      throw new Error("Premium plan not available");
    }

    const promoStartDate = getMidnight(now);
    const promoEndDate = getPremiumTrialEndDate(promoStartDate);

    ensureEligibility(subscription);
    subscription.plan_id = premiumPlan._id;
    subscription.plan_type = "Premium";
    subscription.trial_type = "premium_sample";
    subscription.is_promotional = true;
    subscription.promotional_trial_used = true;
    subscription.start_date = promoStartDate;
    subscription.end_date = promoEndDate;
    subscription.status = "active";
    subscription.is_active = true;
    subscription.updated_at = now;
    subscription.eligibility.purchase_required = false;
    subscription.eligibility.can_purchase_premium = true;

    subscription.history = subscription.history || [];
    subscription.history.push({
      plan_type: formatTransitionLabel("Free", "Premium"),
      status: "upgrade",
      changed_at: now,
      reason: "promotional_trial",
    });

    await subscription.save();

    const payment = await createPaymentRecord({
      userId: subscription.user_id,
      plan: premiumPlan,
      subscription,
      paymentType: "upgrade",
      now,
      isUserPurchase: false,
      reason: "promotional_trial",
      overrides: {
        amount: 0,
        paymentMethod: "system",
        metadata: {
          is_promotional: true,
        },
      },
    });

    subscription.last_payment_id = payment._id;
    await subscription.save();

    return subscription.populateFull();
  },

  async upgradeUserToPremiumTrial(userId: string, now = new Date()) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    let subscription = await UserSubscription.findOne({
      user_id: userObjId,
      is_deleted: false,
    });

    if (!subscription) {
      await this.assignFreePlan(userId);
      subscription = await UserSubscription.findOne({
        user_id: userObjId,
        is_deleted: false,
      });
    }

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (
      subscription.plan_type === "Premium" &&
      subscription.status !== "expired" &&
      subscription.is_active &&
      isActiveByDay(subscription.end_date, now)
    ) {
      return subscription.populateFull();
    }

    if (
      subscription.plan_type !== "Free" ||
      subscription.status === "expired" ||
      !subscription.is_active
    ) {
      await this.downgradeToFree(userId);
      subscription = await UserSubscription.findOne({
        user_id: userObjId,
        is_deleted: false,
      });
    }

    if (!subscription) {
      throw new Error("Free subscription not found");
    }

    if (hasUsedPromotionalPremiumTrial(subscription)) {
      throw new Error("Premium trial is available only once per user");
    }

    return this.grantPromotionalPremiumTrial(subscription._id.toString(), now);
  },

  async getByUserId(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    const userObjId = new mongoose.Types.ObjectId(userId);
    let subscription = await UserSubscription.findOne({
      user_id: userObjId,
      is_deleted: false,
      is_active: true,
    });

    if (shouldAutoDowngradeExpiredPremium(subscription)) {
      subscription = await downgradeExpiredPremiumSubscription(subscription);
    }

    return subscription ? subscription.populateFull() : null;
  },

  async checkPurchaseEligibility(
    userId: string,
    planId?: string,
  ): Promise<PurchaseEligibilityResult> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { canPurchase: true, message: "" };
    }

    const subscription = await this.getByUserId(userId);

    if (subscription?.eligibility.purchase_required) {
      return { canPurchase: true, message: "" };
    }

    if (planId) {
      await SubscriptionPlanModel.findById(planId);
    }

    return { canPurchase: true, message: "" };
  },

  async downgradeToFree(userId: string) {
    const freePlan = await requireActiveFreePlan();

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
    const requestedPage = Number(options.page ?? filter.page ?? 1);
    const requestedLimit = Number(options.limit ?? filter.limit ?? 10);
    const pageNum = Number.isFinite(requestedPage)
      ? Math.max(requestedPage, 1)
      : 1;
    const perPage = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 200)
      : 10;
    const skip = (pageNum - 1) * perPage;

    const subscriptionQuery: Record<string, any> = {
      is_deleted: false,
    };

    if (filter.search) {
      const matchingUsers = await User.find({
        $or: [
          { firstname: { $regex: filter.search, $options: "i" } },
          { lastname: { $regex: filter.search, $options: "i" } },
          { email: { $regex: filter.search, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      const userIds = matchingUsers.map((user) => user._id);

      if (!userIds.length) {
        return {
          success: true,
          data: [],
          total: 0,
          page: pageNum,
          limit: perPage,
          totalPages: 0,
        };
      }

      subscriptionQuery.user_id = { $in: userIds };
    }

    const allowedSortFields = new Set([
      "start_date",
      "end_date",
      "created_at",
      "updated_at",
      "status",
      "plan_type",
    ]);
    const sortField = allowedSortFields.has(filter.sortBy)
      ? filter.sortBy
      : "start_date";
    const sortDirection = filter.sortOrder === "asc" ? 1 : -1;

    const total = await UserSubscription.countDocuments(subscriptionQuery);

    const subscriptionDocs = await UserSubscription.find(subscriptionQuery)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(perPage);

    const hydratedSubscriptionDocs = await Promise.all(
      subscriptionDocs.map(async (subscriptionDoc) => {
        let normalizedSubscription = subscriptionDoc;

        if (shouldAutoDowngradeExpiredPremium(subscriptionDoc)) {
          normalizedSubscription = await downgradeExpiredPremiumSubscription(
            subscriptionDoc,
          );
        }

        return UserSubscription.findById(normalizedSubscription._id).populate([
          {
            path: "user_id",
            select:
              "title firstname lastname email countryCode mobile role profileImage created_at",
          },
          { path: "plan_id", select: "name" },
          { path: "last_payment_id" },
        ]);
      }),
    );

    const validHydratedSubscriptionDocs = hydratedSubscriptionDocs.filter(
      (subscription) => Boolean(subscription),
    ) as any[];

    const subscriptions = await Promise.all(
      validHydratedSubscriptionDocs.map(async (subscription) => {
        const user = subscription.user_id as any;
        const userId =
          user?._id?.toString?.() || subscription.user_id?.toString?.() || null;
        const paymentHistory = userId
          ? await this.getPaymentHistory(userId)
          : [];
        const lastPayment = subscription.last_payment_id as any;
        const latestHistoryEntry = Array.isArray(subscription.history)
          ? subscription.history[subscription.history.length - 1]
          : null;
        const currentStatus =
          lastPayment?.type ||
          latestHistoryEntry?.status ||
          subscription.status ||
          "none";

        return {
          user:
            user ||
            ({
              _id: userId || "unknown",
              title: "",
              firstname: "Unknown",
              lastname: "User",
              email: "",
              countryCode: "",
              mobile: "",
              role: "user",
              profileImage: "",
              created_at: subscription.created_at,
            } as any),
          subscription,
          paymentHistory,
          currentStatus,
          planType: subscription.plan_type || "none",
          isPromotional: subscription.is_promotional || false,
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

  hasExpiryReminderBeenSent(subscription: any, daysRemaining: number) {
    const reminderKey = `${getMidnight(subscription.end_date).toISOString()}:${daysRemaining}`;
    const history = Array.isArray(subscription?.expiry_reminder_history)
      ? subscription.expiry_reminder_history
      : [];

    return history.some((entry: any) => entry?.reminder_key === reminderKey);
  },

  async markExpiryReminderSent(subscriptionId: string, daysRemaining: number) {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      throw new Error("Invalid subscription ID");
    }

    const subscription = await UserSubscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const reminderKey = `${getMidnight(subscription.end_date).toISOString()}:${daysRemaining}`;
    subscription.expiry_reminder_history =
      subscription.expiry_reminder_history || [];

    if (
      subscription.expiry_reminder_history.some(
        (entry: any) => entry?.reminder_key === reminderKey,
      )
    ) {
      return subscription;
    }

    subscription.expiry_reminder_history.push({
      reminder_key: reminderKey,
      days_remaining: daysRemaining,
      cycle_end_date: getMidnight(subscription.end_date),
      sent_at: new Date(),
    });
    await subscription.save();

    return subscription;
  },
};
