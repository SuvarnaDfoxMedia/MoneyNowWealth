
import express, { Request, Response } from "express";
import {
  getAllUsers,
  softDeleteUser,
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/authController";
import { validateRegister } from "../middlewares/validateRequest";
import { protect } from "../middlewares/authMiddleware";
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

/* -------------------- ADMIN / PROTECTED ROUTES -------------------- */
router.delete("/:role/users/delete/:id", adminMiddleware, softDeleteUser);

router.post("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/profile", protect, (req: AuthRequest, res: Response) => {
  res.json({
    message: "Profile data",
    user: req.user,
  });
});

/* -------------------- ROLE-BASED DASHBOARD -------------------- */
router.get("/:role/admin", adminMiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    message: "Admin dashboard",
    user: req.user,
  });
});

router.get("/:role/editor", roleFromUrl(["editor"]), (req: AuthRequest, res: Response) => {
  res.json({
    message: "Editor panel",
    user: req.user,
  });
});

export default router;
