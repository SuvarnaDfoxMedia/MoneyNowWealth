import express from "express";
import { validationResult } from "express-validator";
import User, { type IUser } from "../models/userModel";
import { sendError, sendSuccess } from "../utils/apiResponse";

type Request = express.Request;
type Response = express.Response;

export type AuthenticatedRequest = Request & {
  user?: { id: string; role?: string };
  file?: Express.Multer.File;
};

const toPublicProfileImage = (value?: string | null) => {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/uploads/")) return value;
  return `/uploads/profiles/${value}`;
};

/* -------------------- GET PROFILE -------------------- */
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return sendError(res, "Unauthorized", 401);
    }

    const user: IUser | null = await User.findById(req.user.id).select(
      "-password",
    );
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const profile = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.mobile || null,
      countryCode: user.countryCode || null,
      address: user.address || null,
      role: user.role,
      profileImage: toPublicProfileImage(user.profileImage),
    };

    return sendSuccess(res, "Profile fetched successfully", profile, 200, {
      ...profile,
      user: profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return sendError(res, "Server error", 500);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user?.id) {
      return sendError(res, "Unauthorized", 401);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, "Validation failed", 400, errors.array());
    }

    const { name, mobile, countryCode, address } = req.body;

    /* ---- Split full name ---- */
    let firstname = "";
    let lastname = "";

    if (name && typeof name === "string") {
      const parts = name.trim().split(" ");
      firstname = parts.shift() || "";
      lastname = parts.join(" ") || "";
    }

    /* ---- Build update object ---- */
    const updateData: Partial<IUser> = {};

    if (firstname) updateData.firstname = firstname;
    if (lastname) updateData.lastname = lastname;

    //  FIXED
    if (mobile !== undefined) updateData.mobile = mobile;
    if (countryCode !== undefined) updateData.countryCode = countryCode;

    if (address !== undefined) updateData.address = address;
    if (req.file?.filename) updateData.profileImage = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return sendError(res, "User not found", 404);
    }

    const profile = {
      id: updatedUser._id,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      phone: updatedUser.mobile,
      countryCode: updatedUser.countryCode,
      address: updatedUser.address,
      role: updatedUser.role,
      profileImage: toPublicProfileImage(updatedUser.profileImage),
    };

    return sendSuccess(res, "Profile updated successfully", profile, 200, {
      ...profile,
      user: profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return sendError(res, "Server error", 500);
  }
};

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user?.id) {
      return sendError(res, "Unauthorized", 401);
    }

    const user: IUser | null = await User.findById(req.user.id).select(
      "-password",
    );
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const profile = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.mobile,
      countryCode: user.countryCode,
      address: user.address,
      role: user.role,
      profileImage: toPublicProfileImage(user.profileImage),
    };

    return sendSuccess(res, "Current user fetched successfully", profile, 200, {
      ...profile,
      user: profile,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return sendError(res, "Server error", 500);
  }
};
