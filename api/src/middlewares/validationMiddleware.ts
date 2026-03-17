import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { sendError } from "../utils/apiResponse";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, "Validation failed", 400, null, {
      errors: errors.array(),
    });
  }
  return next();
};
