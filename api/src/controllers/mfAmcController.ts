import type { Request, Response } from "express";
import * as mfAmcService from "../services/mfAmcService";
import { sendError, sendSuccess } from "../utils/apiResponse";

const hasValidBody = (body: unknown) =>
  !!body && typeof body === "object" && !Array.isArray(body);

export const getAmcs = async (req: Request, res: Response) => {
  try {
    const response = await mfAmcService.getAmcs(req.query);
    const data = response?.data ?? response;
    const message =
      (response as { message?: string })?.message ||
      "AMCs fetched successfully";
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
    return sendError(res, error.message || "Failed to fetch AMCs", 500);
  }
};

export const getAmcById = async (req: Request, res: Response) => {
  try {
    const data = await mfAmcService.getAmcById(req.params.id);
    return sendSuccess(res, "AMC fetched successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 500;
    return sendError(res, error.message || "Failed to fetch AMC", code);
  }
};

export const addAmc = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfAmcService.createAmc(req.body);
    return sendSuccess(res, "AMC created successfully", data, 201);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to create AMC", 400);
  }
};

export const updateAmc = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfAmcService.updateAmc(req.params.id, req.body);
    return sendSuccess(res, "AMC updated successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to update AMC", code);
  }
};

export const toggleAmcStatus = async (req: Request, res: Response) => {
  try {
    const data = await mfAmcService.toggleAmcStatus(req.params.id);
    return sendSuccess(
      res,
      `AMC is now ${data.is_active ? "active" : "inactive"}`,
      data,
    );
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to toggle AMC status", code);
  }
};

export const deleteAmc = async (req: Request, res: Response) => {
  try {
    const data = await mfAmcService.deleteAmc(req.params.id);
    return sendSuccess(res, "AMC deleted successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to delete AMC", code);
  }
};
