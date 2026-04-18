import type { Request, Response } from "express";
import { getMfDiscoverData, getMfFiltersData, getMfHomeData } from "../services/mfDiscoveryService";
import { sendError, sendSuccess } from "../utils/apiResponse";

export const getMfHome = async (req: Request, res: Response) => {
  try {
    const response = await getMfHomeData(req.query);
    const data = response?.data ?? response;
    const message =
      (response as { message?: string })?.message ||
      "MF home data fetched successfully";
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
    return sendError(res, error?.message || "Failed to fetch MF home data", 500);
  }
};

export const getMfFilters = async (req: Request, res: Response) => {
  try {
    const response = await getMfFiltersData(req.query);
    const data = response?.data ?? response;
    const message =
      (response as { message?: string })?.message ||
      "MF filters fetched successfully";
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
    return sendError(res, error?.message || "Failed to fetch MF filters", 500);
  }
};

export const getMfDiscover = async (req: Request, res: Response) => {
  try {
    const response = await getMfDiscoverData(req.query);
    const data = response?.data ?? response;
    const message =
      (response as { message?: string })?.message ||
      "MF discover data fetched successfully";
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
    return sendError(res, error?.message || "Failed to fetch MF discover data", 500);
  }
};
