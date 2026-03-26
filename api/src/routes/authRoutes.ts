// import express, { Request, Response } from "express";
// import {
//   getAllUsers,
//   softDeleteUser,
//   registerUser,
//   loginUser,
//   logoutUser,
//   forgotPassword,
//   resetPassword,
//   changePassword,
// } from "../controllers/authController";
// import { validateRegister } from "../middlewares/validateRequest";
// import { protect } from "../middlewares/authMiddleware";
// import { roleFromUrl } from "../middlewares/roleUrlMiddleware";

import express, { Request, Response } from "express";
import {
  getAllUsers,
  softDeleteUser,
  registerUser,
  loginUser,
  loginAdmin,
  loginPublicUser,
  logoutUser,
  logoutAdmin,
  logoutPublicUser,
  forgotPassword,
  resetPassword,
  changePassword,
  googleLogin
} from "../controllers/authController";
import { validateRegister } from "../middlewares/validateRequest";
import { adminProtect, protect, userProtect } from "../middlewares/authMiddleware";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";

const router = express.Router();

interface AuthRequest extends Request {
  user?: any;
}

const adminMiddleware = roleFromUrl(["admin"]);

/* -------------------- PUBLIC ROUTES -------------------- */
router.post("/register", validateRegister, registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/users", getAllUsers);

router.post("/google-login", googleLogin);
router.post("/admin/login", loginAdmin);
router.post("/user/login", loginPublicUser);
router.post("/admin/logout", logoutAdmin);
router.post("/user/logout", logoutPublicUser);

/* -------------------- ADMIN / PROTECTED ROUTES -------------------- */
router.delete("/:role/users/delete/:id", adminMiddleware, softDeleteUser);

router.post("/change-password", protect, changePassword);
router.post("/admin/change-password", adminProtect, changePassword);
router.post("/user/change-password", userProtect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

/* -------------------- ROLE-BASED DASHBOARD -------------------- */
// Add this for admin user listing:
router.get(
  "/:role/users",
  adminMiddleware,
  getAllUsers, // Reuse existing controller
);

router.get("/admin/session", adminProtect, (req: AuthRequest, res: Response) => {
  const session = {
    id: req.user?.id,
    role: req.user?.role,
  };

  res.json({
    success: true,
    message: "Admin session active",
    data: session,
  });
});

router.get("/user/session", userProtect, (req: AuthRequest, res: Response) => {
  const session = {
    id: req.user?.id,
    role: req.user?.role,
  };

  res.json({
    success: true,
    message: "User session active",
    data: session,
  });
});

router.get(
  "/:role/admin",
  adminMiddleware,
  (req: AuthRequest, res: Response) => {
    res.json({
      message: "Admin dashboard",
      user: req.user,
    });
  },
);

router.get(
  "/:role/editor",
  roleFromUrl(["editor"]),
  (req: AuthRequest, res: Response) => {
    res.json({
      message: "Editor panel",
      user: req.user,
    });
  },
);

export default router;
