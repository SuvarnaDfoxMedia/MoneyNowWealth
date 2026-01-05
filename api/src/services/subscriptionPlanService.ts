// import mongoose from "mongoose";
// import SubscriptionPlan, { type ISubscriptionPlan } from "../models/subscriptionPlan.model";

// const allowedUnits = ["minute", "day", "month", "year"] as const;
// type DurationUnit = typeof allowedUnits[number];

// interface GetPlansParams {
//   page?: number;
//   limit?: number;
//   search?: string;
//   sortField?: string;
//   sortOrder?: "asc" | "desc";
//   includeInactive?: boolean;
// }

// interface PaginationResult<T> {
//   plans: T[];
//   total: number;
//   currentPage: number;
//   totalPages: number;
// }

// export const subscriptionPlanService = {
//   /* =========================================================
//      GET ALL (Pagination + Search + Sort + Filters)
//   ========================================================= */
//   getPlans: async ({
//     page = 1,
//     limit = 10,
//     search = "",
//     sortField = "created_at",
//     sortOrder = "desc",
//     includeInactive = true,
//   }: GetPlansParams): Promise<PaginationResult<ISubscriptionPlan>> => {
//     const skip = (page - 1) * limit;

//     const filter: Record<string, any> = { is_deleted: { $ne: true } };
//     if (!includeInactive) filter.is_active = true;

//     if (search.trim()) {
//       filter.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     const sortQuery: Record<string, any> = {};
//     sortQuery[sortField] = sortOrder === "desc" ? -1 : 1;

//     const [plans, total] = await Promise.all([
//       SubscriptionPlan.find(filter)
//         .sort(sortQuery)
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       SubscriptionPlan.countDocuments(filter),
//     ]);

//     return {
//       plans,
//       total,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//     };
//   },

//   /* =========================================================
//      GET BY ID
//   ========================================================= */
//   getById: async (id: string): Promise<ISubscriptionPlan | null> => {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     return SubscriptionPlan.findOne({ _id: id, is_deleted: { $ne: true } }).lean();
//   },

//   /* =========================================================
//      CREATE
//   ========================================================= */
//   create: async (data: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan> => {
//     if (!allowedUnits.includes(data.duration?.unit as DurationUnit)) {
//       throw new Error(`Invalid duration unit. Allowed: ${allowedUnits.join(", ")}`);
//     }

//     const plan = new SubscriptionPlan({
//       ...data,
//       is_active: data?.is_active ?? true,
//       is_deleted: false,
//       created_at: new Date(),
//       updated_at: new Date(),
//     });

//     return plan.save();
//   },

//   /* =========================================================
//      UPDATE
//   ========================================================= */
//   update: async (id: string, updateData: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan | null> => {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     if (updateData.duration?.unit && !allowedUnits.includes(updateData.duration.unit as DurationUnit)) {
//       throw new Error(`Invalid duration unit. Allowed: ${allowedUnits.join(", ")}`);
//     }

//     updateData.updated_at = new Date();

//     return SubscriptionPlan.findOneAndUpdate(
//       { _id: id, is_deleted: { $ne: true } },
//       updateData,
//       { new: true }
//     );
//   },

//   /* =========================================================
//      TOGGLE ACTIVE
//   ========================================================= */
//   toggleActive: async (id: string): Promise<ISubscriptionPlan | null> => {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const plan = await SubscriptionPlan.findOne({ _id: id, is_deleted: { $ne: true } });
//     if (!plan) return null;

//     plan.is_active = !plan.is_active;
//     plan.updated_at = new Date();

//     return plan.save();
//   },

//   /* =========================================================
//      SOFT DELETE
//   ========================================================= */
//   softDelete: async (id: string): Promise<ISubscriptionPlan | null> => {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const plan = await SubscriptionPlan.findOne({ _id: id, is_deleted: { $ne: true } });
//     if (!plan) return null;

//     plan.is_deleted = true;
//     plan.is_active = false;
//     plan.deleted_at = new Date();
//     plan.updated_at = new Date();

//     return plan.save();
//   },

//   /* =========================================================
//      RESTORE SOFT-DELETED PLAN
//   ========================================================= */
//   restore: async (id: string): Promise<ISubscriptionPlan | null> => {
//     if (!mongoose.Types.ObjectId.isValid(id)) return null;

//     const plan = await SubscriptionPlan.findById(id);
//     if (!plan) return null;

//     plan.is_deleted = false;
//     plan.is_active = true;
//     plan.deleted_at = undefined;
//     plan.updated_at = new Date();

//     return plan.save();
//   },
// };


import mongoose from "mongoose";
import SubscriptionPlan, { type ISubscriptionPlan } from "../models/subscriptionPlan.model";

const allowedUnits = ["minute", "day", "month", "year"] as const;
type DurationUnit = typeof allowedUnits[number];

interface GetPlansParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
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
  }: GetPlansParams): Promise<PaginationResult<ISubscriptionPlan>> => {
    const skip = (page - 1) * limit;

    // Only hide soft-deleted plans
    const filter: Record<string, any> = { is_deleted: { $ne: true } };

    // Search filter
    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Sorting
    const sortQuery: Record<string, any> = {};
    sortQuery[sortField] = sortOrder === "desc" ? -1 : 1;

    const [plans, total] = await Promise.all([
      SubscriptionPlan.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),

      SubscriptionPlan.countDocuments(filter),
    ]);

    return {
      plans,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /* =========================================================
     GET BY ID
  ========================================================= */
  getById: async (id: string): Promise<ISubscriptionPlan | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return SubscriptionPlan.findOne({ _id: id, is_deleted: { $ne: true } }).lean();
  },

  /* =========================================================
     CREATE
  ========================================================= */
  create: async (data: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan> => {
    if (!allowedUnits.includes(data.duration?.unit as DurationUnit)) {
      throw new Error(`Invalid duration unit. Allowed: ${allowedUnits.join(", ")}`);
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
  update: async (id: string, updateData: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    if (updateData.duration?.unit && !allowedUnits.includes(updateData.duration.unit as DurationUnit)) {
      throw new Error(`Invalid duration unit. Allowed: ${allowedUnits.join(", ")}`);
    }

    updateData.updated_at = new Date();

    return SubscriptionPlan.findOneAndUpdate(
      { _id: id, is_deleted: { $ne: true } },
      updateData,
      { new: true }
    );
  },

  /* =========================================================
     TOGGLE ACTIVE
  ========================================================= */
  toggleActive: async (id: string): Promise<ISubscriptionPlan | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const plan = await SubscriptionPlan.findOne({ _id: id, is_deleted: { $ne: true } });
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

    const plan = await SubscriptionPlan.findOne({ _id: id, is_deleted: { $ne: true } });
    if (!plan) return null;

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
