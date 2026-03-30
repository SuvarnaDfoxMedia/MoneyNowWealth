import type { Request, Response } from "express";
import {
  getAmcDeleteImpact,
  getCategoryDeleteImpact,
  getMainCategoryDeleteImpact,
} from "../services/mfDeleteImpactService";
import { sendError, sendSuccess } from "../utils/apiResponse";

const errorStatus = (message: string) =>
  message.includes("not found") ? 404 : 400;

export const getMainCategoryDeleteImpactSummary = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await getMainCategoryDeleteImpact(req.params.id);
    return sendSuccess(
      res,
      "Main category delete impact fetched successfully",
      data,
    );
  } catch (error: any) {
    return sendError(
      res,
      error.message || "Failed to fetch main category delete impact",
      errorStatus(String(error.message || "")),
    );
  }
};

export const getCategoryDeleteImpactSummary = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await getCategoryDeleteImpact(req.params.id);
    return sendSuccess(res, "Category delete impact fetched successfully", data);
  } catch (error: any) {
    return sendError(
      res,
      error.message || "Failed to fetch category delete impact",
      errorStatus(String(error.message || "")),
    );
  }
};

export const getAmcDeleteImpactSummary = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await getAmcDeleteImpact(req.params.id);
    return sendSuccess(res, "AMC delete impact fetched successfully", data);
  } catch (error: any) {
    return sendError(
      res,
      error.message || "Failed to fetch AMC delete impact",
      errorStatus(String(error.message || "")),
    );
  }
};
