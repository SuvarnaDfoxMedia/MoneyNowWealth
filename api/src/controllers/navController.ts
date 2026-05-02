import fs from "fs";
import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import * as navService from "../services/navService";

const cleanupUploadedFile = (filePath?: string) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Best effort cleanup.
  }
};

export const uploadNav = async (req: Request, res: Response) => {
  const uploadedFilePath = req.file?.path;
  try {
    if (!req.file?.path) return sendError(res, "Excel/CSV file is required", 400);
    const validateOnly = String(req.body?.validateOnly || "").trim() === "true";
    const report = await navService.uploadNavWorkbook({
      filePath: req.file.path,
      fileName: req.file.originalname,
      validateOnly,
    });

    if (!report.success) {
      return sendError(
        res,
        "NAV upload rejected because validation failed",
        400,
        report,
      );
    }

    return sendSuccess(
      res,
      validateOnly ? "NAV file validated successfully" : "NAV upload completed",
      report,
      validateOnly ? 200 : 201,
    );
  } catch (error: unknown) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to upload NAV data",
      400,
    );
  } finally {
    cleanupUploadedFile(uploadedFilePath);
  }
};

export const getNavHistory = async (req: Request, res: Response) => {
  try {
    const data = await navService.getNavHistory(req.params.schemeId, req.query);
    return sendSuccess(res, "NAV history fetched successfully", data.data, 200, {
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      limit: data.limit,
    });
  } catch (error: unknown) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch NAV history",
      400,
    );
  }
};

export const getNavSchemes = async (req: Request, res: Response) => {
  try {
    const data = await navService.getNavSchemes(req.query);
    return sendSuccess(res, "NAV schemes fetched successfully", data.data, 200, {
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      limit: data.limit,
    });
  } catch (error: unknown) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch NAV schemes",
      400,
    );
  }
};

export const getLatestNav = async (req: Request, res: Response) => {
  try {
    const data = await navService.getLatestNav(req.params.schemeId);
    return sendSuccess(res, "Latest NAV fetched successfully", data);
  } catch (error: unknown) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch latest NAV",
      400,
    );
  }
};

export const getReturns = async (req: Request, res: Response) => {
  try {
    const data = await navService.getSchemeReturns(req.params.schemeId);
    return sendSuccess(res, "Returns fetched successfully", data);
  } catch (error: unknown) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch returns",
      400,
    );
  }
};

export const exportNav = async (_req: Request, res: Response) => {
  try {
    const buffer = await navService.exportNavWorkbook();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="nav-history-export.xlsx"`,
    );
    return res.status(200).send(buffer);
  } catch (error: unknown) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to export NAV data",
      400,
    );
  }
};
