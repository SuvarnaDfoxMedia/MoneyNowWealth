import express from "express";
import { sendChatMessage } from "../../controllers/chatbot/chatController";

const router = express.Router();

router.post("/", sendChatMessage);

export default router;
