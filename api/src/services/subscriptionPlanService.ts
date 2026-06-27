import mongoose from "mongoose";
import SubscriptionPlan, {
  type ISubscriptionPlan,
} from "../models/subscriptionPlan.model";

const allowedUnits = ["day", "month", "year"] as const; // Removed "minute" as it's not in your schema
type DurationUnit = (typeof allowedUnits)[number];

interface GetPlansParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  planType?: "Free" | "Premium";
  includeInactive?: boolean;
}

interface PaginationResult<T> {
  plans: T[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export const subscriptionPlanService = {
  /* =========================================================
     GET ALL (Pagination + Search + Sort + Filters)
  ========================================================= */
  getPlans: async ({
    page = 1,
    limit = 10,
    search = "",
    sortField = "created_at",
    sortOrder = "desc",
    planType,
    includeInactive = false,
  }: GetPlansParams): Promise<PaginationResult<ISubscriptionPlan>> => {
    const finalLimit = Math.min(Math.max(Number(limit) || 10, 1), 200);
    const skip = (page - 1) * finalLimit;

    // Base filter - only show non-deleted
    const filter: Record<string, any> = { is_deleted: false };

    // Add is_active filter unless includeInactive is true
    if (!includeInactive) {
      filter.is_active = true;
    }

    // Search filter
    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Plan type filter - uses the pre-find hook for backward compatibility
    if (planType) {
      filter.plan_type = planType;
    }

    // Sorting
    const sortQuery: Record<string, any> = {};
    const validSortFields = [
      "name",
      "price",
      "created_at",
      "updated_at",
      "plan_type",
    ];
    const safeSortField = validSortFields.includes(sortField)
      ? sortField
      : "created_at";
    sortQuery[safeSortField] = sortOrder === "desc" ? -1 : 1;

    const [plans, total] = await Promise.all([
      SubscriptionPlan.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(finalLimit)
        .lean(),
      SubscriptionPlan.countDocuments(filter),
    ]);

    return {
      plans,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / finalLimit),
    };
  },

  /* =========================================================
     GET BY ID
  ========================================================= */
  getById: async (id: string): Promise<ISubscriptionPlan | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return SubscriptionPlan.findOne({
      _id: id,
      is_deleted: false,
    }).lean();
  },

  /* =========================================================
     GET FREE PLAN (CRITICAL - Used in registration)
  ========================================================= */
  getFreePlan: async (): Promise<ISubscriptionPlan | null> => {
    return SubscriptionPlan.findOne({
      $or: [
        { plan_type: "Free", is_active: true, is_deleted: false },
        {
          plan_type: { $exists: false },
          name: /free/i,
          price: 0,
          is_active: true,
          is_deleted: false,
        },
      ],
    }).lean();
  },

  /* =========================================================
     GET PREMIUM PLAN
  ========================================================= */
  getPremiumPlan: async (): Promise<ISubscriptionPlan | null> => {
    return SubscriptionPlan.findOne({
      $or: [
        { plan_type: "Premium", is_active: true, is_deleted: false },
        {
          plan_type: { $exists: false },
          name: /premium/i,
          price: { $gt: 0 },
          is_active: true,
          is_deleted: false,
        },
      ],
    }).lean();
  },

  /* =========================================================
     CREATE
  ========================================================= */
  create: async (
    data: Partial<ISubscriptionPlan>,
  ): Promise<ISubscriptionPlan> => {
    if (!allowedUnits.includes(data.duration?.unit as DurationUnit)) {
      throw new Error(
        `Invalid duration unit. Allowed: ${allowedUnits.join(", ")}`,
      );
    }

    // Validate price based on plan type
    if (data.plan_type === "Free" && data.price && data.price > 0) {
      throw new Error("Free plans must have price 0");
    }

    // Auto-detect plan_type if not provided
    if (!data.plan_type) {
      if (data.name?.toLowerCase().includes("free")) {
        data.plan_type = "Free";
        data.price = 0; // Force price 0 for Free plans
      } else if (data.name?.toLowerCase().includes("premium")) {
        data.plan_type = "Premium";
      } else {
        data.plan_type = data.price === 0 ? "Free" : "Premium";
      }
    }

    const plan = new SubscriptionPlan({
      ...data,
      is_active: data?.is_active ?? true,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return plan.save();
  },

  /* =========================================================
     UPDATE
  ========================================================= */
  update: async (
    id: string,
    updateData: Partial<ISubscriptionPlan>,
  ): Promise<ISubscriptionPlan | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    if (
      updateData.duration?.unit &&
      !allowedUnits.includes(updateData.duration.unit as DurationUnit)
    ) {
      throw new Error(
        `Invalid duration unit. Allowed: ${allowedUnits.join(", ")}`,
      );
    }

    // Prevent changing Free plan price
    const existingPlan = await SubscriptionPlan.findById(id);
    if (existingPlan && existingPlan.plan_type === "Free") {
      if (updateData.price !== undefined && updateData.price > 0) {
        throw new Error("Cannot set price for Free plan");
      }
      updateData.price = 0;
    }

    updateData.updated_at = new Date();

    return SubscriptionPlan.findOneAndUpdate(
      { _id: id, is_deleted: false },
      updateData,
      { new: true, runValidators: true },
    );
  },

  /* =========================================================
     TOGGLE ACTIVE
  ========================================================= */
  toggleActive: async (id: string): Promise<ISubscriptionPlan | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const plan = await SubscriptionPlan.findOne({
      _id: id,
      is_deleted: false,
    });
    if (!plan) return null;

    plan.is_active = !plan.is_active;
    plan.updated_at = new Date();

    return plan.save();
  },

  /* =========================================================
     SOFT DELETE
  ========================================================= */
  softDelete: async (id: string): Promise<ISubscriptionPlan | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    // Don't allow deleting the only Free plan
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) return null;

    if (plan.plan_type === "Free" || plan.price === 0) {
      const freePlanCount = await SubscriptionPlan.countDocuments({
        $or: [
          { plan_type: "Free", is_active: true, is_deleted: false },
          {
            plan_type: { $exists: false },
            name: /free/i,
            price: 0,
            is_active: true,
            is_deleted: false,
          },
        ],
        _id: { $ne: id },
      });

      if (freePlanCount === 0) {
        throw new Error("Cannot delete the only active Free plan");
      }
    }

    plan.is_deleted = true;
    plan.is_active = false;
    plan.deleted_at = new Date();
    plan.updated_at = new Date();

    return plan.save();
  },

  /* =========================================================
     RESTORE SOFT-DELETED PLAN
  ========================================================= */
  restore: async (id: string): Promise<ISubscriptionPlan | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const plan = await SubscriptionPlan.findById(id);
    if (!plan) return null;

    plan.is_deleted = false;
    plan.is_active = true;
    plan.deleted_at = undefined;
    plan.updated_at = new Date();

    return plan.save();
  },
};
