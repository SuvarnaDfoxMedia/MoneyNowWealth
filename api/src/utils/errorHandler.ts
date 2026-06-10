import { Response } from "express";
import { sendError } from "./apiResponse";

export const handleControllerError = (res: Response, error: any, defaultMessage: string = "An error occurred", defaultStatus: number = 400) => {
  const message = error?.message || defaultMessage;
  const isNotFound = String(message).toLowerCase().includes("not found");
  const code = isNotFound ? 404 : defaultStatus;
  return sendError(res, message, code);
};
