import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import type { Request, Response } from "express";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import User, { IUser } from "../models/userModel";
import { userSubscriptionService } from "@/services/userSubscriptionService";
import { emailService } from "@/emails/emailService";
import { syncLeadToGetResponse } from "../services/getresponseService";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { capitalizeWords, splitFullName } from "../utils/nameUtils";
import { recaptchaService } from "../services/recaptchaService";

import { OAuth2Client } from "google-auth-library";

dotenv.config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_EXPIRES = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_SALT_ROUNDS = 10;

type AuthApp = "admin" | "public";
type RecaptchaProtectedAction = "signup" | "login";

const RECAPTCHA_THRESHOLDS: Record<RecaptchaProtectedAction, number> = {
  signup: 0.6,
  login: 0.5,
};

const generateToken = (userId: string, role: string, app: AuthApp) =>
  jwt.sign({ id: userId, role, app }, process.env.JWT_KEY!, {
    expiresIn: "7d",
  });

const getAuthAppFromRole = (role: string): AuthApp =>
  role === "admin" || role === "editor" ? "admin" : "public";

const getCookieNameByApp = (app: AuthApp) =>
  app === "admin" ? "admin_token" : "user_token";

const setAuthCookies = (
  res: Response,
  token: string,
  app: AuthApp,
  includeLegacyToken = false,
) => {
  const baseCookieOptions = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: JWT_EXPIRES,
  };

  res.cookie(getCookieNameByApp(app), token, baseCookieOptions);

  if (includeLegacyToken) {
    res.cookie("token", token, baseCookieOptions);
  }
};

const clearAuthCookie = (res: Response, cookieName: string) => {
  res.cookie(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    expires: new Date(0),
  });
};

const clearAllAuthCookies = (res: Response) => {
  clearAuthCookie(res, "token");
  clearAuthCookie(res, "admin_token");
  clearAuthCookie(res, "user_token");
};

const buildUserResponse = (user: IUser) => ({
  id: user._id,
  firstname: user.firstname,
  lastname: user.lastname,
  email: user.email,
  role: user.role,
  phone: user.mobile,
  address: user.address,
  profileImage: user.profileImage
    ? `/uploads/profiles/${user.profileImage}`
    : null,
});

const findActiveUserByEmail = async (email: string) => {
  const user: IUser | null = await User.findOne({
    email,
    is_deleted: false,
  }).select("+password");

  if (!user) {
    const deletedUser = await User.findOne({ email, is_deleted: true }).select(
      "_id",
    );
    if (deletedUser) {
      return { user: null, error: "Account is deactivated" as const };
    }
    return { user: null, error: "Invalid credentials" as const };
  }

  return { user, error: null };
};

const loginWithScope = async (
  req: Request,
  res: Response,
  options: {
    mode: "admin" | "public" | "auto";
    includeLegacyToken?: boolean;
    recaptchaAction?: RecaptchaProtectedAction;
  },
) => {
  let { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, "Email and password are required", 400);
  }

  email = email.trim().toLowerCase();

  if (options.recaptchaAction) {
    const recaptchaResult = await recaptchaService.verify({
      token: req.body?.recaptcha_token,
      expectedAction: options.recaptchaAction,
      minScore: RECAPTCHA_THRESHOLDS[options.recaptchaAction],
      remoteIp: req.ip,
    });

    if (!recaptchaResult.ok) {
      return sendError(
        res,
        recaptchaResult.message,
        recaptchaResult.statusCode,
        null,
        { recaptcha: recaptchaResult.details ?? null },
      );
    }
  }

  const { user, error } = await findActiveUserByEmail(email);
  if (!user)
    return sendError(
      res,
      error || "Invalid credentials",
      error === "Account is deactivated" ? 401 : 400,
    );
  if (!user.password) return sendError(res, "Invalid credentials", 400);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return sendError(res, "Invalid credentials", 400);

  if (options.mode === "admin" && !["admin", "editor"].includes(user.role)) {
    return sendError(res, "Admin login allowed only for admin/editor", 403);
  }

  if (options.mode === "public" && user.role !== "user") {
    return sendError(res, "User login allowed only for user role", 403);
  }

  const app: AuthApp =
    options.mode === "auto" ? getAuthAppFromRole(user.role) : options.mode;

  const token = generateToken(user._id.toString(), user.role, app);
  setAuthCookies(res, token, app, options.includeLegacyToken === true);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user: buildUserResponse(user),
    token,
  });
};

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

const handleUserDuplicateKeyError = (error: any, res: Response): boolean => {
  if (error?.code !== 11000) return false;

  const keyPattern = error?.keyPattern || {};
  const keyValue = error?.keyValue || {};

  if (keyPattern.email || keyValue.email) {
    sendError(res, "Email already registered", 400);
    return true;
  }

  if (
    keyPattern.mobile ||
    keyValue.mobile ||
    keyPattern.countryCode ||
    keyValue.countryCode
  ) {
    sendError(res, "Phone number already registered", 400);
    return true;
  }

  if (keyPattern.googleId || keyValue.googleId) {
    sendError(res, "Google account is already linked with another user", 400);
    return true;
  }

  sendError(res, "Duplicate value already exists", 400);
  return true;
};

const resolveGoogleTitle = (
  payload: Record<string, unknown>,
): "Mr" | "Mrs" | undefined => {
  const genderValue = String(payload.gender || payload["title"] || "")
    .trim()
    .toLowerCase();

  if (!genderValue) return undefined;
  if (genderValue === "female" || genderValue === "mrs" || genderValue === "ms")
    return "Mrs";
  if (genderValue === "male" || genderValue === "mr") return "Mr";
  return undefined;
};

const generateSystemHashedPassword = async (): Promise<string> => {
  const rawPassword = crypto.randomBytes(16).toString("hex");
  return bcrypt.hash(rawPassword, BCRYPT_SALT_ROUNDS);
};

const sanitizeUserForResponse = (user: any) => {
  const userObj =
    typeof user?.toObject === "function" ? user.toObject() : { ...user };
  if ("password" in userObj) delete userObj.password;
  return userObj;
};

const syncUserLeadToGetResponse = async (data: {
  email: string;
  firstname?: string;
  lastname?: string;
  mobile?: string;
  countryCode?: string;
}) => {
  const name = [data.firstname, data.lastname].filter(Boolean).join(" ").trim();
  const mobile = [data.countryCode, data.mobile].filter(Boolean).join("").trim();

  await syncLeadToGetResponse({
    email: data.email,
    name: name || undefined,
    mobile: mobile || undefined,
    source: "register",
  });
};

const normalizeCountryDialCode = (countryCode: unknown): string => {
  const rawCountryCode = String(countryCode ?? "").trim().replace(/\s+/g, "");
  if (!rawCountryCode) return "+91";

  return rawCountryCode.startsWith("+")
    ? rawCountryCode
    : `+${rawCountryCode.replace(/^\+/, "")}`;
};

const normalizeAndParsePhoneNumber = (
  mobile: unknown,
  countryCode: unknown,
) => {
  const rawMobile = String(mobile ?? "").trim().replace(/\s+/g, "");
  if (!rawMobile) return null;

  const normalizedCountryCode = normalizeCountryDialCode(countryCode);
  const candidates = rawMobile.startsWith("+")
    ? [rawMobile]
    : [rawMobile, `${normalizedCountryCode}${rawMobile}`];

  for (const candidate of candidates) {
    const phoneNumber = parsePhoneNumberFromString(candidate);
    if (phoneNumber?.isValid()) {
      return {
        mobile: phoneNumber.nationalNumber.toString(),
        countryCode: `+${phoneNumber.countryCallingCode}`,
      };
    }
  }

  return null;
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      title,
      firstname,
      fullname,
      lastname,
      email,
      password,
      mobile,
      countryCode,
      termsAccepted,
      recaptcha_token,
    } = req.body;

    const incomingName = String(fullname ?? firstname ?? "").trim();
    const incomingLastName = String(lastname ?? "").trim();
    const normalizedTitle =
      title && ["Mr", "Mrs"].includes(title)
        ? (title as "Mr" | "Mrs")
        : undefined;

    if (!incomingName || !email || !password || !mobile) {
      return sendError(
        res,
        "Firstname, email, password and mobile are required",
        400,
      );
    }

    if (termsAccepted !== true) {
      return sendError(res, "Please accept the terms", 400);
    }

    const recaptchaResult = await recaptchaService.verify({
      token: recaptcha_token,
      expectedAction: "signup",
      minScore: RECAPTCHA_THRESHOLDS.signup,
      remoteIp: req.ip,
    });

    if (!recaptchaResult.ok) {
      return sendError(
        res,
        recaptchaResult.message,
        recaptchaResult.statusCode,
        null,
        { recaptcha: recaptchaResult.details ?? null },
      );
    }

    const emailTrim = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      return sendError(res, "Invalid email format", 400);
    }

    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,128}$/.test(password)) {
      return sendError(
        res,
        "Password must be 8+ chars, include 1 uppercase, 1 number & 1 special character",
        400,
      );
    }

    const existingUser = await User.findOne({ email: emailTrim });
    if (existingUser) {
      return sendError(res, "Email already registered", 400);
    }

    const normalizedName = incomingName.replace(/\s+/g, " ").trim();
    let parsedNames = splitFullName(normalizedName);
    if (incomingLastName) {
      parsedNames = {
        firstname: capitalizeWords(normalizedName),
        lastname: capitalizeWords(incomingLastName),
      };
    }

    if (!parsedNames.firstname) {
      return sendError(res, "Valid firstname is required", 400);
    }

    const normalizedPhone = normalizeAndParsePhoneNumber(mobile, countryCode);
    if (!normalizedPhone) {
      return sendError(res, "Invalid phone number", 400);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const newUser: IUser = await User.create({
      ...(normalizedTitle ? { title: normalizedTitle } : {}),
      firstname: parsedNames.firstname,
      lastname: parsedNames.lastname || "",
      email: emailTrim,
      password: hashedPassword,
      countryCode: normalizedPhone.countryCode,
      mobile: normalizedPhone.mobile,
      provider: "local",
      role: "user",
      isTermsAccepted: termsAccepted,
    });

    // Assign Free plan using service
    const subscription = await userSubscriptionService.assignFreePlan(
      newUser._id.toString(),
    );

    // Send welcome email
    try {
      await emailService.sendWelcome(newUser.email, {
        userName: newUser.firstname || "User",
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail registration if email fails
    }

    try {
      await syncUserLeadToGetResponse({
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        mobile: newUser.mobile,
        countryCode: newUser.countryCode,
      });
    } catch (syncError: any) {
      console.error("Registration GetResponse sync failed:", syncError.message);
    }

    const token = generateToken(newUser._id.toString(), newUser.role, "public");

    setAuthCookies(res, token, "public", false);

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Free plan assigned.",
      user: {
        id: newUser._id,
        title: newUser.title,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        countryCode: newUser.countryCode,
        mobile: newUser.mobile,
        role: newUser.role,
      },
      subscription,
      token,
    });
  } catch (error: any) {
    if (handleUserDuplicateKeyError(error, res)) return;
    console.error("Registration error:", error);
    return sendError(
      res,
      error?.message === "Missing RECAPTCHA_SECRET_KEY"
        ? "Captcha is not configured on the server"
        : "Server error during registration",
      500,
    );
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendError(res, "Google token missing", 400);
    }

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return sendError(res, "Invalid Google token", 400);
    }

    const email = payload.email.toLowerCase();
    const incomingGoogleId = payload.sub;
    const googleTitle = resolveGoogleTitle(
      payload as unknown as Record<string, unknown>,
    );

    // Prefer existing account already linked to this Google identity
    const userByGoogleId = await User.findOne({
      googleId: incomingGoogleId,
    }).select("+password");
    if (userByGoogleId) {
      if (userByGoogleId.role !== "user") {
        return sendError(
          res,
          "Google login allowed only for user accounts",
          403,
        );
      }
      if (userByGoogleId.is_deleted) {
        return sendError(res, "Account is deactivated", 401);
      }

      if (!userByGoogleId.password) {
        userByGoogleId.password = await generateSystemHashedPassword();
        await userByGoogleId.save();
      }

      const jwtToken = generateToken(
        userByGoogleId._id.toString(),
        userByGoogleId.role,
        "public",
      );
      const safeUser = await User.findById(userByGoogleId._id);

      setAuthCookies(res, jwtToken, "public", false);

      return res.status(200).json({
        success: true,
        message: "Google login successful",
        user: safeUser || sanitizeUserForResponse(userByGoogleId),
      });
    }

    // Check if user exists by email
    let user = await User.findOne({ email }).select("+password");
    if (user?.is_deleted) {
      return sendError(res, "Account is deactivated", 401);
    }
    if (user && user.role !== "user") {
      return sendError(res, "Google login allowed only for user accounts", 403);
    }

    if (!user) {
      const generatedHashedPassword = await generateSystemHashedPassword();
      user = await User.create({
        ...(googleTitle ? { title: googleTitle } : {}),
        firstname: payload.given_name || "User",
        lastname: payload.family_name || "",
        email,
        password: generatedHashedPassword,
        role: "user",
        provider: "google",
        googleId: incomingGoogleId,
        profileImage: payload.picture || "",
        isTermsAccepted: true,
      });

      try {
        await userSubscriptionService.assignFreePlan(user._id.toString());
      } catch (subscriptionError) {
        console.error(
          "Failed to assign free plan for Google user:",
          subscriptionError,
        );
      }

      try {
        await emailService.sendWelcome(user.email, {
          userName: user.firstname || "User",
        });
      } catch (emailError) {
        console.error(
          "Failed to send welcome email for Google user:",
          emailError,
        );
      }

      try {
        await syncUserLeadToGetResponse({
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          mobile: user.mobile,
          countryCode: user.countryCode,
        });
      } catch (syncError: any) {
        console.error(
          "Google user GetResponse sync failed:",
          syncError.message,
        );
      }
    } else {
      if (!user.password) {
        user.password = await generateSystemHashedPassword();
        await user.save();
      }
    }

    if (!user.googleId) {
      const googleUserConflict = await User.findOne({
        googleId: incomingGoogleId,
      });
      if (googleUserConflict) {
        return sendError(
          res,
          "Google account is already linked with another user",
          409,
        );
      }

      user.googleId = incomingGoogleId;
      user.provider = "google";
      if (!user.profileImage && payload.picture) {
        user.profileImage = payload.picture;
      }
      await user.save();
    }

    const jwtToken = generateToken(user._id.toString(), user.role, "public");
    const safeUser = await User.findById(user._id);

    setAuthCookies(res, jwtToken, "public", false);

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      user: safeUser || sanitizeUserForResponse(user),
    });
  } catch (error) {
    if (handleUserDuplicateKeyError(error, res)) return;
    console.error("Google login error:", error);
    return sendError(res, "Google authentication failed", 500);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    // Backward-compatible route:
    // auto-detect role and issue scoped cookie + legacy token.
    return await loginWithScope(req, res, {
      mode: "auto",
      includeLegacyToken: true,
      recaptchaAction: "login",
    });
  } catch (error: any) {
    console.error("Login error:", error.message);
    return sendError(
      res,
      error?.message === "Missing RECAPTCHA_SECRET_KEY"
        ? "Captcha is not configured on the server"
        : "Server error",
      500,
    );
  }
};

export const logoutUser = (req: Request, res: Response) => {
  clearAllAuthCookies(res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
    data: null,
  });
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    return await loginWithScope(req, res, {
      mode: "admin",
      includeLegacyToken: false,
    });
  } catch (error: any) {
    console.error("Admin login error:", error.message);
    return sendError(res, "Server error", 500);
  }
};

export const loginPublicUser = async (req: Request, res: Response) => {
  try {
    return await loginWithScope(req, res, {
      mode: "public",
      includeLegacyToken: false,
      recaptchaAction: "login",
    });
  } catch (error: any) {
    console.error("User login error:", error.message);
    return sendError(
      res,
      error?.message === "Missing RECAPTCHA_SECRET_KEY"
        ? "Captcha is not configured on the server"
        : "Server error",
      500,
    );
  }
};

export const logoutAdmin = (_req: Request, res: Response) => {
  clearAuthCookie(res, "admin_token");
  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
    data: null,
  });
};

export const logoutPublicUser = (_req: Request, res: Response) => {
  clearAuthCookie(res, "user_token");
  return res.status(200).json({
    success: true,
    message: "User logged out successfully",
    data: null,
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user: IUser | null = await User.findOne({ email, is_deleted: false });
    if (!user) {
      // Return success regardless — do not reveal whether email exists
      return sendSuccess(res, "If this email is registered, a reset link has been sent.", null);
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_KEY!, { expiresIn: "10m" });

    // Store a hash so the raw token is never in the DB
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const resetUrl = `${process.env.WEBSITE_URL}/auth/set-new-password?token=${resetToken}`;

    // Send password reset email using the email service
    try {
      await emailService.sendPasswordReset(user.email, {
        userName: user.firstname || "User",
        resetUrl: resetUrl,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return sendError(
        res,
        "Failed to send reset email. Please try again.",
        500,
      );
    }

    return sendSuccess(
      res,
      "Password reset link sent to your email",
      null,
      200,
      {},
    );
  } catch (error: any) {
    console.error("Forgot password error:", error.message);
    return sendError(res, error.message, 500);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) return sendError(res, "Token missing", 400);
    if (!password || !confirmPassword) return sendError(res, "All fields are required", 400);
    if (password !== confirmPassword) return sendError(res, "Passwords do not match", 400);

    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_KEY as string) as { id: string };
    } catch {
      return sendError(res, "Invalid or expired reset link", 400);
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return sendError(res, "Invalid or expired reset link", 400);

    user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return sendSuccess(res, "Password reset successfully", null);
  } catch (error: any) {
    console.error("Reset password error:", error);

    if (error.name === "TokenExpiredError")
      return sendError(res, "Reset link expired", 400);

    return sendError(res, "Invalid reset token", 400);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, "Not authorized", 401);
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return sendError(res, "Old and new password are required", 400);
    }

    const user = await User.findById(userId).select("+password");
    if (!user || !user.password) {
      return sendError(res, "User not found", 404);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return sendError(res, "Old password is incorrect", 401);
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return sendError(
        res,
        "New password must be at least 8 characters, include 1 uppercase, 1 number, and 1 special character.",
        400,
      );
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await user.save();

    // Send password changed confirmation email
    try {
      await emailService.sendPasswordChanged(user.email, {
        userName: user.firstname || "User",
      });
    } catch (emailError) {
      console.error("Failed to send password changed email:", emailError);
      // Don't fail the operation if email fails
    }

    return sendSuccess(res, "Password changed successfully", null);
  } catch (error: any) {
    console.error("Change password error:", error.message);
    return sendError(res, "Server error during password change", 500);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 200);
    const search = String(req.query.search || "").trim();
    const ALLOWED_SORT_FIELDS = ["created_at", "updated_at", "firstname", "lastname", "email", "role"];
    const rawSortField = String(req.query.sortField || "created_at");
    const sortField = ALLOWED_SORT_FIELDS.includes(rawSortField) ? rawSortField : "created_at";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const query: any = { role: "user", is_deleted: false };
    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(query);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const currentPage = Math.min(page, totalPages);

    const users = await User.find(query, "-password")
      .sort({ [sortField]: sortOrder })
      .skip((currentPage - 1) * limit)
      .limit(limit);

    return sendSuccess(res, "Users fetched successfully", users, 200, {
      total,
      page: currentPage,
      limit,
      totalPages,
      users,
    });
  } catch (error: any) {
    console.error("Get users error:", error.message);
    return sendError(res, "Server error while fetching users", 500);
  }
};

export const softDeleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { new: true },
    );
    if (!user) return sendError(res, "User not found", 404);

    return sendSuccess(res, "User deleted successfully", null);
  } catch (error: any) {
    console.error("Soft delete user error:", error);
    return sendError(res, error.message || "Server error", 500);
  }
};
