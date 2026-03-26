

import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/userModel";

dotenv.config();

export interface AuthenticatedRequest extends express.Request {
  user?: { id: string; role?: string };
}

type AuthApp = "admin" | "public";
type AuthTokenPayload = { id: string; role?: string; app?: AuthApp };

const getCookieToken = (
  req: AuthenticatedRequest,
  cookieName: "admin_token" | "user_token" | "token",
) => req.cookies?.[cookieName] as string | undefined;

const getTokenCandidates = (
  req: AuthenticatedRequest,
  options?: {
    expectedApp?: AuthApp;
    allowLegacyToken?: boolean;
  },
) => {
  const includeLegacy = options?.allowLegacyToken !== false;

  if (options?.expectedApp === "admin") {
    const scoped = [
      { token: getCookieToken(req, "admin_token"), cookie: "admin_token" },
    ];
    return includeLegacy
      ? [...scoped, { token: getCookieToken(req, "token"), cookie: "token" }]
      : scoped;
  }

  if (options?.expectedApp === "public") {
    const scoped = [
      { token: getCookieToken(req, "user_token"), cookie: "user_token" },
    ];
    return includeLegacy
      ? [...scoped, { token: getCookieToken(req, "token"), cookie: "token" }]
      : scoped;
  }

  const generic: Array<{ token?: string; cookie: string }> = [
    { token: getCookieToken(req, "admin_token"), cookie: "admin_token" },
    { token: getCookieToken(req, "user_token"), cookie: "user_token" },
  ];

  return includeLegacy
    ? [...generic, { token: getCookieToken(req, "token"), cookie: "token" }]
    : generic;
};

const verifyAndAttachUser = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
  options?: {
    expectedApp?: AuthApp;
    allowedRoles?: Array<"admin" | "editor" | "user">;
    allowLegacyToken?: boolean;
  },
) => {
  try {
    const jwtKey = process.env.JWT_KEY;
    if (!jwtKey) {
      throw new Error("JWT_KEY not defined in environment");
    }

    const tokensInOrder = getTokenCandidates(req, {
      expectedApp: options?.expectedApp,
      allowLegacyToken: options?.allowLegacyToken,
    });

    const tokenSource = tokensInOrder.find((item) => !!item.token);
    const token = tokenSource?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
        data: null,
      });
    }

    const decoded = jwt.verify(token, jwtKey) as AuthTokenPayload;
    const existingUser = await User.findOne({
      _id: decoded.id,
      is_deleted: false,
    }).select("role");

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, account unavailable",
        data: null,
      });
    }

    if (options?.expectedApp) {
      const tokenApp = decoded.app;
      const isLegacyTokenWithoutApp = !tokenApp && tokenSource?.cookie === "token";

      if (!isLegacyTokenWithoutApp && tokenApp !== options.expectedApp) {
        return res.status(403).json({
          success: false,
          message: "Access denied: invalid token scope",
          data: null,
        });
      }
    }

    if (options?.allowedRoles?.length) {
      const role = existingUser.role as "admin" | "editor" | "user";
      if (!options.allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied: insufficient role",
          data: null,
        });
      }
    }

    req.user = { id: decoded.id, role: existingUser.role };
    return next();
  } catch (error: any) {
    console.error("Auth error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid",
      data: null,
    });
  }
};

export const protect = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  return verifyAndAttachUser(req, res, next, { allowLegacyToken: true });
};

export const adminProtect = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  return verifyAndAttachUser(req, res, next, {
    expectedApp: "admin",
    allowedRoles: ["admin", "editor"],
    allowLegacyToken: false,
  });
};

export const userProtect = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  return verifyAndAttachUser(req, res, next, {
    expectedApp: "public",
    allowedRoles: ["user"],
    allowLegacyToken: false,
  });
};

export const authorizeRoles = (...roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
        data: null,
      });
    }

    if (!roles.includes(req.user.role!)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Access denied: insufficient role",
          data: null,
        });
    }

    next();
  };
};
