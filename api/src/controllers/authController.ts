
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import SubscriptionPlanModel from "../models/subscriptionPlan.model";
import { userSubscriptionService } from "@/services/userSubscriptionService";

import User, { IUser } from "../models/userModel"; 
import UserSubscription from "../models/userSubscriptionModel";
import UserSubscriptionPayment from "../models/userSubscriptionPaymentModel";
import { sendEmail } from "../utils/emails";
import { parsePhoneNumberFromString } from "libphonenumber-js";

dotenv.config();

// JWT expiration
const JWT_EXPIRES = 7 * 24 * 60 * 60 * 1000; // 7 days

// Generate JWT token
const generateToken = (userId: string, role: string) =>
  jwt.sign({ id: userId, role }, process.env.JWT_KEY!, { expiresIn: "7d" });

/* ------------------------------------------------------------------
   Define AuthenticatedRequest for routes with logged-in user
------------------------------------------------------------------ */
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

  //  ADD DURATION TO DATE
const addDurationToDate = (
  date: Date,
  value: number,
  unit: "day" | "month" | "year"
) => {
  const result = new Date(date);
  switch (unit) {
    case "day":
      result.setDate(result.getDate() + value);
      break;
    case "month":
      result.setMonth(result.getMonth() + value);
      break;
    case "year":
      result.setFullYear(result.getFullYear() + value);
      break;
  }
  return result;
};


export const createOrUpdateSubscription = async (
  userId: string,
  planId: string,
  durationValue: number,
  durationUnit: "day" | "month" | "year",
  trialType?: "free_sample" | "premium_sample",
  status: "new" | "upgrade" | "downgrade" = "new"
) => {
  try {
    const resolvedTrialType = trialType || "free_sample";
    const planType = resolvedTrialType === "free_sample" ? "Free" : "Premium";

    // Get plan details (for price)
  const plan = await SubscriptionPlanModel.findById(planId);
if (!plan) throw new Error("Subscription plan not found");


    const endDate = addDurationToDate(new Date(), durationValue, durationUnit);

    // 1 Deactivate all old active subscriptions
    await UserSubscription.updateMany(
      { user_id: new Types.ObjectId(userId), is_active: true },
      { is_active: false }
    );

    // 2 Create new subscription entry
    const subscription = await UserSubscription.create({
      user_id: new Types.ObjectId(userId),
      plan_id: new Types.ObjectId(planId),
      plan_type: planType,
      trial_type: resolvedTrialType,
      start_date: new Date(),
      end_date: endDate,
      status,                     // new | upgrade | downgrade
      auto_renew: false,
      is_active: true,
      is_deleted: false,
    });

    // 3 Create payment entry for this subscription
    await UserSubscriptionPayment.create({
      user_id: new Types.ObjectId(userId),
      plan_id: new Types.ObjectId(planId),
      user_subscription_id: subscription._id,

      amount: planType === "Free" ? 0 : plan.price,   // FREE → 0
      currency: "INR",
      payment_method: "system",

      transaction_id: `${status.toUpperCase()}-${Date.now()}`,
      order_id: `${status.toUpperCase()}-${Date.now()}`,

      payment_status: "success",
      payment_date: new Date(),
      type: status,                                   

      metadata: {
        note: `Auto-generated for ${status} subscription`,
      },
    });

    // 4 Populate and return subscription
    await subscription.populate([
      { path: "user_id", select: "firstname lastname email mobile" },
      { path: "plan_id" },
    ]);

    return subscription;

  } catch (err) {
    console.error("Error creating/updating subscription:", err);
    throw err;
  }
};



  //  ASSIGN FREE PLAN (during registration)
export const assignFreePlan = async (userId: string) => {
  try {
    const freePlan = await SubscriptionPlanModel.findOne({
      name: "Free",
      is_active: true,
      is_deleted: false,
    });

    if (!freePlan) throw new Error("Free plan not found!");

    // createOrUpdateSubscription NOW auto-creates payment entry
    const subscription = await createOrUpdateSubscription(
      userId,
      freePlan._id.toString(),
      freePlan.duration.value,
      freePlan.duration.unit,
      "free_sample",
      "new"
    );

    return { subscription };
  } catch (err) {
    console.error("Failed to assign free plan:", err);
    throw err;
  }
};



export const registerUser = async (req: Request, res: Response) => {
  try {
    const { title, firstname, lastname, email, password, mobile, countryCode, termsAccepted } =
      req.body;

    // ------------------ Validations ------------------
    if (!title || !["Mr", "Mrs"].includes(title))
      return res.status(400).json({ message: "Title must be Mr or Mrs" });

    if (!firstname || !lastname || !email || !password || !mobile)
      return res.status(400).json({ message: "All fields are required" });

    if (termsAccepted !== true)
      return res.status(400).json({ message: "Please accept the terms" });

    // Email validation
    const emailTrim = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim))
      return res.status(400).json({ message: "Invalid email format" });

    // Password validation
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,128}$/.test(password))
      return res.status(400).json({
        message:
          "Password must be 8+ chars, include 1 uppercase, 1 number & 1 special character",
      });

    // Check if email exists
    const existingUser = await User.findOne({ email: emailTrim });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // ------------------ Phone Validation ------------------
    const fullPhone = `${countryCode}${mobile}`;
    const phoneNumber = parsePhoneNumberFromString(fullPhone);

    if (!phoneNumber || !phoneNumber.isValid())
      return res.status(400).json({ message: "Invalid phone number" });

    // Optional: normalize phone number for storage
    const normalizedMobile = phoneNumber.nationalNumber.toString();
    const normalizedCountryCode = `+${phoneNumber.countryCallingCode}`;

    // ------------------ Hash Password ------------------
    const hashedPassword = await bcrypt.hash(password, 10);

    // ------------------ Create user ------------------
    const newUser: IUser = await User.create({
      title,
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: emailTrim,
      password: hashedPassword,
      countryCode: normalizedCountryCode,
      mobile: normalizedMobile,
      role: "user",
      isTermsAccepted: termsAccepted,
    });

    // ------------------ Assign free plan ------------------
    let subscription;
    try {
      subscription = await assignFreePlan(newUser._id.toString());
    } catch (err: any) {
      return res.status(500).json({
        message: "Free plan assignment failed",
        error: err.message,
      });
    }

    // ------------------ Generate JWT ------------------
    const token = generateToken(newUser._id.toString(), newUser.role);

    // ------------------ Send welcome email ------------------
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:30px;background:#f7f9fc;border-radius:12px;">
        <h1 style="text-align:center;color:#140084;">Welcome, ${newUser.firstname}!</h1>
        <p style="text-align:center;">Your account has been created successfully.</p>
      </div>
    `;
    sendEmail({ to: newUser.email, subject: "Welcome!", html });

    // ------------------ Response ------------------
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false, // set true in production with HTTPS
        sameSite: "lax",
        maxAge: JWT_EXPIRES,
      })
      .status(201)
      .json({
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
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};


// ================= LOGIN USER =================

export const loginUser = async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    email = email.trim().toLowerCase();
    const user: IUser | null = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id.toString(), user.role);

    res
      .cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: JWT_EXPIRES })
      .status(200)
      .json({
        message: "Login successful",
        user: {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          phone: user.mobile,
          address: user.address,
          profileImage: user.profileImage ? `/uploads/profiles/${user.profileImage}` : null,
        },
        token,
      });
  } catch (error: any) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGOUT =================
export const logoutUser = (req: Request, res: Response) => {
  res.cookie("token", "", { httpOnly: true, secure: false, sameSite: "lax", expires: new Date(0) })
     .status(200)
     .json({ message: "Logged out successfully" });
};


export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user: IUser | null = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_KEY!,
      { expiresIn: "10m" }
    );

    // 👉 Open exactly your given page
    const resetUrl = `${process.env.WEBSITE_URL}/auth/set-new-password?token=${resetToken}`;

    const html = `
      <div style="font-family:sans-serif; max-width:600px; margin:auto; padding:30px; border-radius:12px; background:#f7f9fc;">
        <h2 style="color:#140084;">Hi ${user.firstname || "User"},</h2>
        <p>We received a request to reset your password. Click the link below to set a new password. This link expires in 10 minutes:</p>
        <p style="word-break: break-all; font-size:16px; line-height:1.5;">
          <a href="${resetUrl}" style="color:#140084; text-decoration:underline;">${resetUrl}</a>
        </p>
        <p style="font-size:14px;color:#777;">If you did not request a password reset, please ignore this email.</p>
        <p style="font-size:14px;color:#999;margin-top:20px;">— MoneyNow Wealth Team</p>
      </div>
    `;

    sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      html,
    }).catch(err => console.error("Email error:", err.message));

    res.json({ message: "Password reset link sent to your email" });
  } catch (error: any) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ message: error.message });
  }
};






export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) return res.status(400).json({ message: "Token missing" });
    if (!password || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    // Use JWT_KEY from .env
    const decoded = jwt.verify(token, process.env.JWT_KEY as string) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash new password
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Reset password error:", error);

    if (error.name === "TokenExpiredError")
      return res.status(400).json({ message: "Reset link expired" });

    return res.status(400).json({ message: "Invalid reset token" });
  }
};





export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;   

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old and new password are required" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user || !user.password) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters, include 1 uppercase, 1 number, and 1 special character.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ message: "Server error during password change" });
  }
};



// ================= GET ALL USERS =================
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const search = String(req.query.search || "").trim();
    const sortField = String(req.query.sortField || "created_at");
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

    res.status(200).json({ success: true, total, page: currentPage, limit, totalPages, users });
  } catch (error: any) {
    console.error("Get users error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching users" });
  }
};

// ================= SOFT DELETE USER =================
export const softDeleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(id, { is_deleted: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Soft delete user error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
