import type { Request, Response } from "express";
import * as mfNfoService from "../services/mfNfoService";
import { sendError, sendSuccess } from "../utils/apiResponse";

const hasValidBody = (body: unknown) =>
  !!body && typeof body === "object" && !Array.isArray(body);

export const getNfos = async (req: Request, res: Response) => {
  try {
    const response = await mfNfoService.getNfos(req.query);
    const data = response?.data ?? response;
    const message =
      (response as { message?: string })?.message ||
      "NFOs fetched successfully";
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
    return sendError(res, error.message || "Failed to fetch NFOs", 500);
  }
};

export const getNfoById = async (req: Request, res: Response) => {
  try {
    const data = await mfNfoService.getNfoById(req.params.id);
    return sendSuccess(res, "NFO fetched successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 500;
    return sendError(res, error.message || "Failed to fetch NFO", code);
  }
};

export const addNfo = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfNfoService.createNfo(req.body);
    return sendSuccess(res, "NFO created successfully", data, 201);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to create NFO", 400);
  }
};

export const updateNfo = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfNfoService.updateNfo(req.params.id, req.body);
    return sendSuccess(res, "NFO updated successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to update NFO", code);
  }
};

export const toggleNfoStatus = async (req: Request, res: Response) => {
  try {
    const data = await mfNfoService.toggleNfoStatus(req.params.id);
    return sendSuccess(
      res,
      `NFO is now ${data.is_active ? "active" : "inactive"}`,
      data,
    );
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to toggle NFO status", code);
  }
};

export const deleteNfo = async (req: Request, res: Response) => {
  try {
    const data = await mfNfoService.deleteNfo(req.params.id);
    return sendSuccess(res, "NFO deleted successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to delete NFO", code);
  }
};
