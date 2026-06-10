import express from "express";
import SubscriptionPlan from "../models/subscriptionPlan.model";
import { subscriptionPlanService } from "../services/subscriptionPlanService";
import { sendError, sendSuccess } from "../utils/apiResponse";

type Request = express.Request;
type Response = express.Response;

/* ---------------------------------------------------
   GET: All Subscription Plans (with filters & pagination)
--------------------------------------------------- */
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      sortField = "name",
      sortOrder = "asc",
      includeInactive,
    } = req.query;

    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const perPage = Math.max(parseInt(limit as string) || 10, 1);

    const result = await subscriptionPlanService.getPlans({
      page: pageNum,
      limit: perPage,
      search: search as string,
      sortField: sortField as string,
      sortOrder: sortOrder === "asc" ? "asc" : "desc",
      includeInactive: includeInactive === "true",
    });

    return sendSuccess(
      res,
      "Subscription plans fetched successfully",
      result,
      200,
      { ...result },
    );
  } catch (error: any) {
    console.error("Error in getSubscriptionPlans:", error);
    return sendError(
      res,
      error.message || "Failed to fetch subscription plans",
      500,
    );
  }
};

/* ---------------------------------------------------
   GET: By ID
--------------------------------------------------- */
export const getSubscriptionPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionPlanService.getById(id);
    if (!plan) {
      return sendError(res, "Subscription plan not found", 404);
    }

    return sendSuccess(res, "Subscription plan fetched successfully", plan, 200, {
      plan,
    });
  } catch (error: any) {
    console.error("Get subscription plan by ID error:", error);
    return sendError(res, error.message || "Server error", 500);
  }
};

/* ---------------------------------------------------
   POST: Create Subscription Plan
--------------------------------------------------- */
export const addSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      currency,
      duration,
      features,
      is_active,
    } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, "Name is required", 400);
    }
    if (!description || price == null || !duration?.value || !duration?.unit) {
      return sendError(
        res,
        "Description, price, and duration are required",
        400,
      );
    }

    const allowedUnits = ["day", "month", "year"];
    if (!allowedUnits.includes(duration.unit)) {
      return sendError(
        res,
        `Invalid duration unit. Allowed units: ${allowedUnits.join(", ")}`,
        400,
        null,
        { field: "duration.unit" },
      );
    }

    const existingPlan = await SubscriptionPlan.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      is_deleted: { $ne: true },
    });
    if (existingPlan) {
      return sendError(
        res,
        "A subscription plan with this name already exists",
        400,
        null,
        { field: "name" },
      );
    }

    const planData = {
      name: name.trim(),
      description,
      price,
      currency: currency || "INR",
      duration,
      features: Array.isArray(features) ? features : [],
      is_active: is_active !== undefined ? is_active : true,
    };

    const plan = await subscriptionPlanService.create(planData);
    return sendSuccess(res, "Subscription plan created successfully", plan, 201, {
      plan,
    });
  } catch (error: any) {
    console.error("Add subscription plan error:", error);
    if (error?.code === 11000) {
      const dupKey = error.keyValue ? Object.keys(error.keyValue)[0] : "field";
      return sendError(res, `${dupKey} already exists`, 400, null, {
        field: dupKey,
      });
    }
    return sendError(res, error.message || "Server error", 500);
  }
};

/* ---------------------------------------------------
   PUT: Update Subscription Plan
--------------------------------------------------- */
export const updateSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.name && !updateData.name.trim()) {
      return sendError(res, "Name cannot be empty", 400);
    }

    if (updateData.duration?.unit) {
      const allowedUnits = ["day", "month", "year"];
      if (!allowedUnits.includes(updateData.duration.unit)) {
        return sendError(
          res,
          `Invalid duration unit. Allowed units: ${allowedUnits.join(", ")}`,
          400,
          null,
          { field: "duration.unit" },
        );
      }
    }

    if (updateData.name) {
      const existingPlan = await SubscriptionPlan.findOne({
        _id: { $ne: id },
        name: { $regex: `^${updateData.name}$`, $options: "i" },
        is_deleted: { $ne: true },
      });
      if (existingPlan) {
        return sendError(
          res,
          "A subscription plan with this name already exists",
          400,
          null,
          { field: "name" },
        );
      }
    }

    const plan = await subscriptionPlanService.update(id, updateData);
    if (!plan) {
      return sendError(res, "Subscription plan not found", 404);
    }

    return sendSuccess(res, "Subscription plan updated successfully", plan, 200, {
      plan,
    });
  } catch (error: any) {
    console.error("Update subscription plan error:", error);
    if (error?.code === 11000) {
      const dupKey = error.keyValue ? Object.keys(error.keyValue)[0] : "field";
      return sendError(res, `${dupKey} already exists`, 400, null, {
        field: dupKey,
      });
    }
    return sendError(res, error.message || "Server error", 500);
  }
};

/* ---------------------------------------------------
   PATCH: Activate / Deactivate
--------------------------------------------------- */
export const toggleSubscriptionPlanStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionPlanService.toggleActive(id);

    if (!plan) {
      return sendError(res, "Subscription plan not found", 404);
    }

    return sendSuccess(
      res,
      plan.is_active
        ? "Subscription plan activated successfully"
        : "Subscription plan deactivated successfully",
      plan,
      200,
      { plan },
    );
  } catch (error: any) {
    console.error("Toggle subscription plan status error:", error);
    return sendError(res, error.message || "Server error", 500);
  }
};

/* ---------------------------------------------------
   DELETE: Soft Delete
--------------------------------------------------- */
export const deleteSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionPlanService.softDelete(id);

    if (!plan) {
      return sendError(res, "Subscription plan not found", 404);
    }

    return sendSuccess(
      res,
      "Subscription plan deleted successfully (soft delete)",
      plan,
      200,
      { plan },
    );
  } catch (error: any) {
    console.error("Delete subscription plan error:", error);
    return sendError(res, error.message || "Server error", 500);
  }
};

/* ---------------------------------------------------
   PATCH: Restore Soft Deleted Plan
--------------------------------------------------- */
export const restoreSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionPlanService.restore(id);

    if (!plan) {
      return sendError(res, "Subscription plan not found", 404);
    }

    return sendSuccess(
      res,
      "Subscription plan restored successfully",
      plan,
      200,
      { plan },
    );
  } catch (error: any) {
    console.error("Restore subscription plan error:", error);
    return sendError(res, error.message || "Server error", 500);
  }
};
