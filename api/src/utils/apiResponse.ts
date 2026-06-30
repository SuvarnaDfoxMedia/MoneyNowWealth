import type { Response } from "express";

type ExtraFields = Record<string, unknown>;

export const sendSuccess = (
  res: Response,
  message: string,
  data: unknown = null,
  statusCode = 200,
  extra: ExtraFields = {},
) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...extra,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  data: unknown = null,
  extra: ExtraFields = {},
) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res.status(statusCode).json({
    success: false,
    message,
    data,
    ...extra,
  });
};
