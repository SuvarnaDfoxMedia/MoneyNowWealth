import express from "express";
import { adminProtect } from "./authMiddleware";
import type { AuthenticatedRequest } from "./authMiddleware";

export const roleFromUrl = (allowedRoles: string[]) => {
  return [
    adminProtect,
    (
      req: AuthenticatedRequest,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const roleInUrl = req.params.role;

      if (!allowedRoles.includes(roleInUrl)) {
        return res.status(403).json({
          success: false,
          message: "Invalid role in URL",
          data: null,
        });
      }

      if (!req.user || req.user.role !== roleInUrl) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Access denied: role mismatch",
            data: null,
          });
      }

      next();
    },
  ];
};
