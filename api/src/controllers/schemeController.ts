import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import * as schemeService from "../services/schemeService";

export const getSchemes = async (req: Request, res: Response) => {
  try {
    const data = await schemeService.getSchemes(req.query);
    return sendSuccess(res, "Schemes fetched successfully", data.data, 200, {
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      limit: data.limit,
    });
  } catch (error: unknown) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch schemes",
      500,
    );
  }
};

export const getSchemeById = async (req: Request, res: Response) => {
  try {
    const data = await schemeService.getSchemeById(req.params.id);
    return sendSuccess(res, "Scheme fetched successfully", data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch scheme";
    return sendError(res, message, message.includes("not found") ? 404 : 400);
  }
};
