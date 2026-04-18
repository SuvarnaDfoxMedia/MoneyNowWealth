import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { enquiryUnreadService } from "../services/enquiryUnreadService";

export const getUnreadEnquiryCounts = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return sendError(res, "Not authorized", 401);
    }

    const unreadCounts = await enquiryUnreadService.getUnreadCounts(req.user.id);

    return sendSuccess(
      res,
      "Unread enquiry counts fetched successfully",
      unreadCounts,
      200,
      unreadCounts,
    );
  } catch (error) {
    console.error("Get unread enquiry counts error:", error);
    return sendError(res, "Server error", 500);
  }
};

export const markEnquiriesAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return sendError(res, "Not authorized", 401);
    }

    const { modules, markAll } = req.body as {
      modules?: string[];
      markAll?: boolean;
    };

    if (!markAll && (!Array.isArray(modules) || modules.length === 0)) {
      return sendError(
        res,
        "Provide modules or set markAll to true",
        400,
      );
    }

    const unreadCounts = await enquiryUnreadService.markAsRead(
      req.user.id,
      modules,
      Boolean(markAll),
    );

    return sendSuccess(
      res,
      "Enquiries marked as read successfully",
      unreadCounts,
      200,
      unreadCounts,
    );
  } catch (error: any) {
    console.error("Mark enquiries as read error:", error);
    return sendError(
      res,
      error?.message === "Invalid enquiry modules"
        ? "One or more enquiry modules are invalid"
        : "Server error",
      error?.message === "Invalid enquiry modules" ? 400 : 500,
    );
  }
};
