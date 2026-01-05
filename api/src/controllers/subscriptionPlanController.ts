import express from "express";
import SubscriptionPlan from "../models/subscriptionPlan.model";
import { subscriptionPlanService } from "../services/subscriptionPlanService";

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

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error in getSubscriptionPlans:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch subscription plans",
    });
  }
};

/* ---------------------------------------------------
   GET: By ID
--------------------------------------------------- */
export const getSubscriptionPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionPlanService.getById(id);
    if (!plan)
      return res.status(404).json({ success: false, message: "Subscription plan not found" });

    res.json({ success: true, plan });
  } catch (error: any) {
    console.error("Get subscription plan by ID error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/* ---------------------------------------------------
   POST: Create Subscription Plan
--------------------------------------------------- */
export const addSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { name, description, price, currency, duration, features, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!description || price == null || !duration?.value || !duration?.unit) {
      return res.status(400).json({ success: false, message: "Description, price, and duration are required" });
    }

    const allowedUnits = ["day", "month", "year"];
    if (!allowedUnits.includes(duration.unit)) {
      return res.status(400).json({ success: false, message: `Invalid duration unit. Allowed units: ${allowedUnits.join(", ")}`, field: "duration.unit" });
    }

    const existingPlan = await SubscriptionPlan.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      is_deleted: { $ne: true },
    });
    if (existingPlan) {
      return res.status(400).json({ success: false, message: "A subscription plan with this name already exists", field: "name" });
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
    res.status(201).json({ success: true, plan });
  } catch (error: any) {
    console.error("Add subscription plan error:", error);
    if (error?.code === 11000) {
      const dupKey = error.keyValue ? Object.keys(error.keyValue)[0] : "field";
      return res.status(400).json({ success: false, message: `${dupKey} already exists`, field: dupKey });
    }
    res.status(500).json({ success: false, message: error.message || "Server error" });
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
      return res.status(400).json({ success: false, message: "Name cannot be empty" });
    }

    if (updateData.duration?.unit) {
      const allowedUnits = ["day", "month", "year"];
      if (!allowedUnits.includes(updateData.duration.unit)) {
        return res.status(400).json({ success: false, message: `Invalid duration unit. Allowed units: ${allowedUnits.join(", ")}`, field: "duration.unit" });
      }
    }

    if (updateData.name) {
      const existingPlan = await SubscriptionPlan.findOne({
        _id: { $ne: id },
        name: { $regex: `^${updateData.name}$`, $options: "i" },
        is_deleted: { $ne: true },
      });
      if (existingPlan) {
        return res.status(400).json({ success: false, message: "A subscription plan with this name already exists", field: "name" });
      }
    }

    const plan = await subscriptionPlanService.update(id, updateData);
    if (!plan) return res.status(404).json({ success: false, message: "Subscription plan not found" });

    res.json({ success: true, plan });
  } catch (error: any) {
    console.error("Update subscription plan error:", error);
    if (error?.code === 11000) {
      const dupKey = error.keyValue ? Object.keys(error.keyValue)[0] : "field";
      return res.status(400).json({ success: false, message: `${dupKey} already exists`, field: dupKey });
    }
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/* ---------------------------------------------------
   PATCH: Activate / Deactivate
--------------------------------------------------- */
export const toggleSubscriptionPlanStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionPlanService.toggleActive(id);

    if (!plan) return res.status(404).json({ success: false, message: "Subscription plan not found" });

    res.json({
      success: true,
      message: plan.is_active
        ? "Subscription plan activated successfully"
        : "Subscription plan deactivated successfully",
      plan,
    });
  } catch (error: any) {
    console.error("Toggle subscription plan status error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/* ---------------------------------------------------
   DELETE: Soft Delete
--------------------------------------------------- */
export const deleteSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionPlanService.softDelete(id);

    if (!plan) return res.status(404).json({ success: false, message: "Subscription plan not found" });

    res.json({
      success: true,
      message: "Subscription plan deleted successfully (soft delete)",
      plan,
    });
  } catch (error: any) {
    console.error("Delete subscription plan error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/* ---------------------------------------------------
   PATCH: Restore Soft Deleted Plan
--------------------------------------------------- */
export const restoreSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionPlanService.restore(id);

    if (!plan) return res.status(404).json({ success: false, message: "Subscription plan not found" });

    res.json({
      success: true,
      message: "Subscription plan restored successfully",
      plan,
    });
  } catch (error: any) {
    console.error("Restore subscription plan error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
