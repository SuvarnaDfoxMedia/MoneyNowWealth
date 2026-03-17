// import express from "express";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { body, validationResult } from "express-validator";

// import {
//   getCurrentUser,
//   getProfile,
//   updateProfile,
// } from "../controllers/profileController.js";
// import type { AuthenticatedRequest } from "../controllers/profileController.js";

// import { protect } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// /* -------------------- UPLOAD SETUP -------------------- */
// const uploadDir = path.join(process.cwd(), "uploads/profiles");
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, uploadDir),
//   filename: (_req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
//   },
// });

// const upload = multer({ storage });

// /* -------------------- VALIDATION -------------------- */
// const updateValidation = [
//   body("name").optional().isString().withMessage("Name must be a string"),

//   body("phone")
//     .optional()
//     .isString()
//     .isLength({ min: 5 })
//     .withMessage("Phone number is too short"),

//   body("address").optional().isString().withMessage("Address must be a string"),
// ];

// const handleValidationErrors = (
//   req: AuthenticatedRequest,
//   res: express.Response,
//   next: express.NextFunction,
// ) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty())
//     return res.status(400).json({ errors: errors.array() });
//   next();
// };

// /* -------------------- PROFILE ROUTES -------------------- */

// // Public GET route? Usually profile is protected, so keep protect
// router.get("/get-profile", protect, getProfile);

// // In your routes
// router.get("/auth/me", protect, getCurrentUser);

// // Protected PUT route for updating profile
// router.put(
//   "/profile",
//   protect,
//   upload.single("profileImage"),
//   updateValidation,
//   handleValidationErrors,
//   updateProfile,
// );

// export default router;

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { body, validationResult } from "express-validator";

import {
  getCurrentUser,
  getProfile,
  updateProfile,
} from "../controllers/profileController";
import type { AuthenticatedRequest } from "../controllers/profileController";

import { adminProtect, protect, userProtect } from "../middlewares/authMiddleware";

const router = express.Router();

/* -------------------- UPLOAD SETUP -------------------- */
const uploadDir = path.join(process.cwd(), "uploads/profiles");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

/* -------------------- VALIDATION -------------------- */
const updateValidation = [
  body("name").optional().isString().withMessage("Name must be a string"),
  body("mobile")
    .optional()
    .isString()
    .isLength({ min: 5 })
    .withMessage("Mobile number is too short"),
  body("countryCode")
    .optional()
    .isString()
    .withMessage("Country code must be a string"),
  body("address").optional().isString().withMessage("Address must be a string"),
];

const handleValidationErrors = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

/* -------------------- PROFILE ROUTES -------------------- */
router.get("/get-profile", protect, getProfile);
router.get("/user/profile/me", userProtect, getCurrentUser);
router.get("/admin/profile/me", adminProtect, getCurrentUser);

router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  updateValidation,
  handleValidationErrors,
  updateProfile,
);

export default router;
