import express from "express";
import { askNova } from "../controllers/chatbotController";
import { optionalUserProtect } from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @route   POST /api/chat/nova
 * @desc    Chat with Nova AI assistant (Context-aware if logged in)
 * @access  Public (Optional Auth)
 */
router.post("/nova", optionalUserProtect, askNova);

export default router;
