

import express from "express";
import { protect } from "./authMiddleware";
import type { AuthenticatedRequest } from "./authMiddleware";

export const roleFromUrl = (allowedRoles: string[]) => {
  return [
    protect,
    (
      req: AuthenticatedRequest,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const roleInUrl = req.params.role;

      if (!allowedRoles.includes(roleInUrl)) {
        return res.status(403).json({ message: "Invalid role in URL" });
      }

      if (!req.user || req.user.role !== roleInUrl) {
        return res.status(403).json({ message: "Access denied: role mismatch" });
      }

      next();
    },
  ];
};
