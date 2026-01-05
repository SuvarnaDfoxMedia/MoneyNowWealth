



import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

export interface AuthenticatedRequest extends express.Request {
  user?: { id: string; role?: string };
}



export const protect = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const jwtKey = process.env.JWT_KEY;
    if (!jwtKey) {
      throw new Error("JWT_KEY not defined in environment");
    }

    const decoded = jwt.verify(token, jwtKey) as { id: string; role?: string };
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

// Role-based access
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roles.includes(req.user.role!)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }

    next();
  };
};
