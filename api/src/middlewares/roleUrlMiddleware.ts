// import express from "express";
// import { protect } from "../middlewares/authMiddleware";
// import type { AuthenticatedRequest } from "../middlewares/authMiddleware"; // only type import

// export const roleFromUrl = (allowedRoles: string[]) => {
//   return [
//     protect, // authentication middleware
//     (
//       req: AuthenticatedRequest,
//       res: express.Response,
//       next: express.NextFunction
//     ) => {
//       const roleInUrl = req.params.role;

//       // Check if role in URL is allowed
//       if (!allowedRoles.includes(roleInUrl)) {
//         return res.status(403).json({ message: "Invalid role in URL" });
//       }

//       // Check if authenticated user role matches role in URL
//       if (!req.user || req.user.role !== roleInUrl) {
//         return res.status(403).json({ message: "Access denied: role mismatch" });
//       }

//       next();
//     },
//   ];
// };


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
