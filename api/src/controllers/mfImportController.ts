import fs from "fs";
import type { Request, Response } from "express";
import {
  exportMfExcel,
  importMfExcel,
  type MfImportEntity,
} from "../services/mfImportService";
import { sendError, sendSuccess } from "../utils/apiResponse";

const VALID_ENTITIES: MfImportEntity[] = [
  "main-categories",
  "categories",
  "amcs",
  "funds",
  "nfo",
  "index-snapshots",
  "full-workbook",
];

const resolveEntity = (value: unknown): MfImportEntity => {
  const entity = String(value || "").trim() as MfImportEntity;
  if (!VALID_ENTITIES.includes(entity)) {
    throw new Error("Invalid import/export entity");
  }
  return entity;
};

const cleanupUploadedFile = (filePath?: string) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Best effort cleanup.
  }
};

export const importExcel = async (req: Request, res: Response) => {
  const uploadedFilePath = req.file?.path;
  try {
    if (!req.file?.path) {
      return sendError(res, "Excel file is required", 400);
    }

    const entity = resolveEntity(req.body?.entity);
    const validateOnly = String(req.body?.validateOnly || "").trim() === "true";

    const report = await importMfExcel({
      filePath: req.file.path,
      entity,
      validateOnly,
    });

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
    const exportFile = await exportMfExcel({ entity });

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
