import express from "express";
import { validationResult } from "express-validator";
import User, { type IUser } from "../models/userModel";

type Request = express.Request;
type Response = express.Response;

export type AuthenticatedRequest = Request & {
  user?: { id: string; role?: string };
  file?: Express.Multer.File;
};

/* -------------------- GET PROFILE -------------------- */
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user: IUser | null = await User.findById(req.user.id).select(
      "-password",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,

      //  IMPORTANT
      phone: user.mobile || null,
      countryCode: user.countryCode || null,

      address: user.address || null,
      role: user.role,
      profileImage: user.profileImage
        ? `/uploads/profiles/${user.profileImage}`
        : null,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* -------------------- UPDATE PROFILE -------------------- */
// export const updateProfile = async (
//   req: AuthenticatedRequest,
//   res: Response,
// ) => {
//   try {
//     if (!req.user?.id) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     //  READ country_code
//     const { name, phone, country_code, address } = req.body;

//     /* ---- Split full name ---- */
//     let firstname = "";
//     let lastname = "";

//     if (name && typeof name === "string") {
//       const parts = name.trim().split(" ");
//       firstname = parts.shift() || "";
//       lastname = parts.join(" ") || "";
//     }

//     /* ---- Build update object ---- */
//     const updateData: Partial<IUser> = {};

//     if (firstname) updateData.firstname = firstname;
//     if (lastname) updateData.lastname = lastname;

//     if (phone !== undefined) updateData.mobile = phone;

//     //  SAVE COUNTRY CODE
//     if (country_code !== undefined) {
//       updateData.countryCode = country_code;
//     }

//     if (address !== undefined) updateData.address = address;
//     if (req.file?.filename) updateData.profileImage = req.file.filename;

//     const updatedUser = await User.findByIdAndUpdate(
//       req.user.id,
//       { $set: updateData },
//       { new: true, runValidators: true },
//     ).select("-password");

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({
//       message: "Profile updated successfully",
//       user: {
//         id: updatedUser._id,
//         firstname: updatedUser.firstname,
//         lastname: updatedUser.lastname,
//         email: updatedUser.email,

//         //  RETURN UPDATED VALUES
//         phone: updatedUser.mobile || null,
//         countryCode: updatedUser.countryCode || null,

//         address: updatedUser.address || null,
//         role: updatedUser.role,
//         profileImage: updatedUser.profileImage
//           ? `/uploads/profiles/${updatedUser.profileImage}`
//           : null,
//       },
//     });
//   } catch (error) {
//     console.error("Update profile error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// Add this to your authController or profileController

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //  FIXED: read correct field names
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
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        email: updatedUser.email,

        //  ALWAYS RETURN UPDATED VALUES
        mobile: updatedUser.mobile,
        countryCode: updatedUser.countryCode,

        address: updatedUser.address,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage
          ? `/uploads/profiles/${updatedUser.profileImage}`
          : null,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user: IUser | null = await User.findById(req.user.id).select(
      "-password",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.mobile,
      countryCode: user.countryCode,
      address: user.address,
      role: user.role,
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
