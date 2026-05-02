import type { Request, Response } from "express";
import fs from "fs";
import * as mfTopHoldingService from "../services/mfTopHoldingService";
import { importMfExcel } from "../services/mfImportService";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { handleControllerError } from "../utils/errorHandler";

const hasValidBody = (body: unknown) =>
  !!body && typeof body === "object" && !Array.isArray(body);

export const getTopHoldings = async (req: Request, res: Response) => {
  try {
    const response = await mfTopHoldingService.getTopHoldings(req.query);
    const data = response?.data ?? response;
    const extra =
      response && typeof response === "object"
        ? Object.fromEntries(
            Object.entries(response).filter(
              ([key]) => !["success", "message", "data"].includes(key),
            ),
          )
        : {};
    return sendSuccess(res, "Top holdings fetched successfully", data, 200, extra);
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to fetch top holdings", 500);
  }
};

export const getTopHoldingById = async (req: Request, res: Response) => {
  try {
    const data = await mfTopHoldingService.getTopHoldingById(req.params.id);
    return sendSuccess(res, "Top holding record fetched successfully", data);
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to fetch top holding record", 500);
  }
};

export const getTopHoldingHistory = async (req: Request, res: Response) => {
  try {
    const response = await mfTopHoldingService.getTopHoldingHistory(req.params.schemeId, req.query);
    const data = response?.data ?? response;
    const extra =
      response && typeof response === "object"
        ? Object.fromEntries(
            Object.entries(response).filter(
              ([key]) => !["success", "message", "data"].includes(key),
            ),
          )
        : {};
    return sendSuccess(res, "Top holding history fetched successfully", data, 200, extra);
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to fetch top holding history", 500);
  }
};

export const addTopHolding = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfTopHoldingService.createTopHolding(req.body);
    if ((data as any)?.noChanges) {
      return sendSuccess(res, "No changes detected. Existing snapshot kept.", data);
    }
    return sendSuccess(res, "Top holding snapshot created successfully", data, 201);
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to create top holding record", 400);
  }
};

export const updateTopHolding = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) {
      return sendError(res, "Request body is required", 400);
    }
    const data = await mfTopHoldingService.updateTopHolding(req.params.id, req.body);
    if ((data as any)?.noChanges) {
      return sendSuccess(res, "No changes detected. Existing snapshot kept.", data);
    }
    return sendSuccess(res, "Top holding revision created successfully", data, 201);
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to update top holding record", 400);
  }
};

export const deleteTopHolding = async (req: Request, res: Response) => {
  try {
    const data = await mfTopHoldingService.deleteTopHolding(req.params.id);
    return sendSuccess(res, "Top holding scheme marked inactive", data);
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to delete top holding record", 400);
  }
};

export const toggleTopHoldingStatus = async (req: Request, res: Response) => {
  try {
    const data = await mfTopHoldingService.toggleTopHoldingSchemeStatus(req.params.schemeId);
    return sendSuccess(
      res,
      `Top holding scheme is now ${data.is_active ? "active" : "inactive"}`,
      data,
    );
  } catch (error: any) {
    return handleControllerError(res, error, "Failed to toggle top holding status", 400);
  }
};

const cleanupUploadedFile = (filePath?: string) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Best effort cleanup.
  }
};

export const importTopHoldings = async (req: Request, res: Response) => {
  const uploadedFilePath = req.file?.path;
  try {
    if (!req.file?.path) {
      return sendError(res, "Excel file is required", 400);
    }

    const validateOnly = String(req.body?.validateOnly || "").trim() === "true";
    const report = await importMfExcel({
      filePath: req.file.path,
      entity: "top-holdings",
      validateOnly,
    });

    if (!validateOnly && report?.errorCount > 0) {
      return sendError(
        res,
        "Import blocked because validation failed. Fix the workbook and validate again.",
        400,
        report,
      );
    }

    return sendSuccess(
      res,
      validateOnly ? "Top holdings file validated successfully" : "Top holdings import completed",
      report,
    );
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to import top holdings", 400);
  } finally {
    cleanupUploadedFile(uploadedFilePath);
  }
};
