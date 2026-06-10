import type { Request, Response } from "express";
import * as mfFundService from "../services/mfFundService";
import { sendError, sendSuccess } from "../utils/apiResponse";

const hasValidBody = (body: unknown) =>
  !!body && typeof body === "object" && !Array.isArray(body);

export const getFunds = async (req: Request, res: Response) => {
  try {
    const response = await mfFundService.getFunds(req.query);
    const data = response?.data ?? response;
    const message =
      (response as { message?: string })?.message ||
      "Funds fetched successfully";
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
    return sendError(res, error.message || "Failed to fetch funds", 500);
  }
};

export const getPopularFunds = async (req: Request, res: Response) => {
  try {
    const response = await mfFundService.getPopularFunds(req.query);
    const data = response?.data ?? response;
    const message =
      (response as { message?: string })?.message ||
      "Popular funds fetched successfully";
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
    return sendError(res, error.message || "Failed to fetch popular funds", 500);
  }
};

export const getFundById = async (req: Request, res: Response) => {
  try {
    const data = await mfFundService.getFundById(req.params.id);
    return sendSuccess(res, "Fund fetched successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 500;
    return sendError(res, error.message || "Failed to fetch fund", code);
  }
};

export const addFund = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfFundService.createFund(req.body);
    return sendSuccess(res, "Fund created successfully", data, 201);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to create fund", 400);
  }
};

export const updateFund = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfFundService.updateFund(req.params.id, req.body);
    return sendSuccess(res, "Fund updated successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to update fund", code);
  }
};

export const toggleFundStatus = async (req: Request, res: Response) => {
  try {
    const data = await mfFundService.toggleFundStatus(req.params.id);
    return sendSuccess(
      res,
      `Fund is now ${data.is_active ? "active" : "inactive"}`,
      data,
    );
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to toggle fund status", code);
  }
};

export const deleteFund = async (req: Request, res: Response) => {
  try {
    const data = await mfFundService.deleteFund(req.params.id);
    return sendSuccess(res, "Fund deleted successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to delete fund", code);
  }
};
