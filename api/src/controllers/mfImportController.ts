import type { Request, Response } from "express";
import { importMfExcel } from "../services/mfImportService";
import { sendError, sendSuccess } from "../utils/apiResponse";

export const importExcel = async (req: Request, res: Response) => {
  try {
    const { filePath, dryRun } = req.body || {};
    if (!filePath || typeof filePath !== "string") {
      return sendError(res, "filePath is required", 400);
    }

    const report = await importMfExcel({
      filePath: filePath.trim(),
      dryRun: Boolean(dryRun),
    });

    return sendSuccess(
      res,
      dryRun ? "Dry-run import completed" : "Excel import completed",
      report,
    );
  } catch (error: any) {
    return sendError(res, error?.message || "Failed to import Excel data", 400);
  }
};
