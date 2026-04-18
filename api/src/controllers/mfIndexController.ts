import type { Request, Response } from "express";
import * as mfIndexService from "../services/mfIndexService";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { handleControllerError } from "../utils/errorHandler";

const hasValidBody = (body: unknown) =>
  !!body && typeof body === "object" && !Array.isArray(body);

export const getIndexSnapshots = async (req: Request, res: Response) => {
  try {
    const response = await mfIndexService.getIndexSnapshots(req.query);
    const data = response?.data ?? response;
    const message =
      (response as { message?: string })?.message ||
      "Index snapshots fetched successfully";
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
    return handleControllerError(res, error, "Failed to fetch index snapshots", 500);
  }
};

export const getIndexSnapshotById = async (req: Request, res: Response) => {
  try {
    const data = await mfIndexService.getIndexSnapshotById(req.params.id);
    return sendSuccess(res, "Index snapshot fetched successfully", data);
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to fetch index snapshot", 500);
  }
};

export const addIndexSnapshot = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfIndexService.createIndexSnapshot(req.body);
    return sendSuccess(res, "Index snapshot created successfully", data, 201);
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to create index snapshot", 400);
  }
};

export const updateIndexSnapshot = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfIndexService.updateIndexSnapshot(req.params.id, req.body);
    return sendSuccess(res, "Index snapshot updated successfully", data);
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to update index snapshot", 400);
  }
};

export const toggleIndexSnapshotStatus = async (req: Request, res: Response) => {
  try {
    const data = await mfIndexService.toggleIndexSnapshotStatus(req.params.id);
    return sendSuccess(
      res,
      `Index snapshot is now ${data.is_active ? "active" : "inactive"}`,
      data,
    );
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to toggle index snapshot status", 400);
  }
};

export const deleteIndexSnapshot = async (req: Request, res: Response) => {
  try {
    const data = await mfIndexService.deleteIndexSnapshot(req.params.id);
    return sendSuccess(res, "Index snapshot deleted successfully", data);
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to delete index snapshot", 400);
  }
};
