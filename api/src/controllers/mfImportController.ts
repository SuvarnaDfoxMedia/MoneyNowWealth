import fs from "fs";
import type { Request, Response } from "express";
import {
  importMfExcel,
  exportMfExcel,
} from "../services/mfImportService";
import { ExportMode, MfImportEntity } from "../types/mfImportDto";
import { sendError, sendSuccess } from "../utils/apiResponse";

const VALID_ENTITIES: MfImportEntity[] = [
  "main-categories",
  "categories",
  "amcs",
  "funds",
  "benchmarks",
  "benchmark-returns",
  "nfo",
  "index-snapshots",
  "top-holdings",
  "full-workbook",
];

const resolveEntity = (value: unknown): MfImportEntity => {
  const entity = String(value || "").trim() as MfImportEntity;
  if (!VALID_ENTITIES.includes(entity)) {
    throw new Error("Invalid import/export entity");
  }
  return entity;
};

const resolveExportMode = (value: unknown): ExportMode => {
  const mode = String(value || "data").trim().toLowerCase();
  if (mode === "data" || mode === "template") {
    return mode;
  }
  throw new Error("Invalid export mode");
};

import { cleanupUploadedFile } from "../utils/fileUtils";

export const importExcel = async (req: Request, res: Response) => {
  const uploadedFilePath = req.file?.path;
  try {
    if (!req.file?.path) {
      return sendError(res, "Excel file is required", 400);
    }

    const entity = resolveEntity(req.body?.entity);
    const validateOnly = String(req.body?.validateOnly || "").trim() === "true";
    const forceManualTopHoldings = String(req.body?.forceManual || "").trim() === "true";

    const report = await importMfExcel({
      filePath: req.file.path,
      entity,
      validateOnly,
      forceManualTopHoldings,
      logSource: "manual_import",
      fileName: req.file.originalname || "",
      triggeredBy: (req as any).user?.id?.toString() || "",
    });

    if (!validateOnly && (report?.errorCount || report?.errors?.length || 0) > 0) {
      return sendError(
        res,
        "Import blocked because validation failed. Fix the workbook and validate again.",
        400,
        report,
      );
    }

    return sendSuccess(
      res,
      validateOnly ? "File validated successfully" : "Excel import completed",
      report,
    );
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to import Excel data", 400);
  } finally {
    cleanupUploadedFile(uploadedFilePath);
  }
};

export const exportExcel = async (req: Request, res: Response) => {
  try {
    const entity = resolveEntity(req.query?.entity);
    const mode = resolveExportMode(req.query?.mode);
    const exportFile = await exportMfExcel({
      entity: entity as any,
      mode,
    });

    res.setHeader("Content-Type", exportFile.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exportFile.fileName}"`,
    );
    return res.status(200).send(exportFile.buffer);
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to export Excel data", 400);
  }
};
