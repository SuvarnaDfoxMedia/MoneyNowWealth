import type { Request, Response } from "express";
import * as mfCategoryService from "../services/mfCategoryService";
import { sendError, sendSuccess } from "../utils/apiResponse";

const hasValidBody = (body: unknown) =>
  !!body && typeof body === "object" && !Array.isArray(body);

export const getMainCategories = async (req: Request, res: Response) => {
  try {
    const response = await mfCategoryService.getMainCategories(req.query);
    const data = response?.data ?? response;
    const message =
      (response as { message?: string })?.message ||
      "Main categories fetched successfully";
    const extra =
      response && typeof response === "object"
        ? Object.fromEntries(
            Object.entries(response).filter(
              ([key]) => !["success", "message", "data"].includes(key),
            ),
          )
        : {};
    return sendSuccess(res, message, data, 200, extra);
  } catch (error: any) {
    return sendError(
      res,
      error.message || "Failed to fetch main categories",
      500,
    );
  }
};

export const getMainCategoryById = async (req: Request, res: Response) => {
  try {
    const data = await mfCategoryService.getMainCategoryById(req.params.id);
    return sendSuccess(res, "Main category fetched successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 500;
    return sendError(res, error.message || "Failed to fetch main category", code);
  }
};

export const addMainCategory = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfCategoryService.createMainCategory(req.body);
    return sendSuccess(res, "Main category created successfully", data, 201);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to create main category", 400);
  }
};

export const updateMainCategory = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfCategoryService.updateMainCategory(req.params.id, req.body);
    return sendSuccess(res, "Main category updated successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to update main category", code);
  }
};

export const toggleMainCategoryStatus = async (req: Request, res: Response) => {
  try {
    const data = await mfCategoryService.toggleMainCategoryStatus(req.params.id);
    return sendSuccess(
      res,
      `Main category is now ${data.is_active ? "active" : "inactive"}`,
      data,
    );
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to toggle status", code);
  }
};

export const deleteMainCategory = async (req: Request, res: Response) => {
  try {
    const data = await mfCategoryService.deleteMainCategory(req.params.id);
    return sendSuccess(res, "Main category deleted successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(
      res,
      error.message || "Failed to delete main category",
      code,
    );
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const response = await mfCategoryService.getCategories(req.query);
    const data = response?.data ?? response;
    const message =
      (response as { message?: string })?.message || "Categories fetched successfully";
    const extra =
      response && typeof response === "object"
        ? Object.fromEntries(
            Object.entries(response).filter(
              ([key]) => !["success", "message", "data"].includes(key),
            ),
          )
        : {};
    return sendSuccess(res, message, data, 200, extra);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to fetch categories", 500);
  }
};

export const getCategoryByIdentifier = async (req: Request, res: Response) => {
  try {
    const data = await mfCategoryService.getCategoryByIdentifier(req.params.identifier);
    return sendSuccess(res, "Category fetched successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 500;
    return sendError(res, error.message || "Failed to fetch category", code);
  }
};

export const addCategory = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfCategoryService.createCategory(req.body);
    return sendSuccess(res, "Category created successfully", data, 201);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to create category", 400);
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfCategoryService.updateCategory(req.params.id, req.body);
    return sendSuccess(res, "Category updated successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to update category", code);
  }
};

export const toggleCategoryStatus = async (req: Request, res: Response) => {
  try {
    const data = await mfCategoryService.toggleCategoryStatus(req.params.id);
    return sendSuccess(
      res,
      `Category is now ${data.is_active ? "active" : "inactive"}`,
      data,
    );
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(
      res,
      error.message || "Failed to toggle category status",
      code,
    );
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const data = await mfCategoryService.deleteCategory(req.params.id);
    return sendSuccess(res, "Category deleted successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to delete category", code);
  }
};
