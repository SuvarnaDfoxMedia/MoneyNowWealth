import { Request, Response } from "express";
import * as chatbotService from "../services/chatbotService";
import UserSubscription from "../models/userSubscriptionModel";
import User from "../models/userModel";

export const askNova = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    const userId = (req as any).user?.id; // Fixed: authMiddleware sets req.user.id, not _id

    let userContext = null;

    // 1. If logged in, build user context
    if (userId) {
      const [user, subscription] = await Promise.all([
        User.findById(userId).select("firstname lastname email"),
        UserSubscription.findOne({ user_id: userId }).populate("plan_id")
      ]);

      userContext = {
        name: user ? `${user.firstname} ${user.lastname}`.trim() : "User",
        email: user?.email,
        subscription: subscription ? {
          plan_name: (subscription.plan_id as any)?.name || "Unknown",
          status: subscription.status,
          expiry_date: subscription.expiry_date
        } : "No active subscription"
      };
    }

    // 2. Call FastAPI via Chatbot Service
    const response = await chatbotService.chatWithNova({
      message,
      history: history || [],
      user_context: userContext
    });

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Nova Chat Error:", error.message);
    return res.status(500).json({ 
      status: "error", 
      message: error.message || "Failed to get response from Nova." 
    });
  }
};
