import type { Request, Response } from "express";
import * as newsletterService from "../services/newsletterService";
import { Newsletter } from "../models/newsletterModel";
import { syncLeadToGetResponse } from "../services/getresponseService";
import { sendError, sendSuccess } from "../utils/apiResponse";

/* ---------------------------------------------------
   Get paginated newsletter subscribers
--------------------------------------------------- */
export const getNewsletters = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const search = String(req.query.search || "");
    const includeDeleted = req.query.includeDeleted === "true";

    const sortBy = String(req.query.sortBy || "created_at");
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const response = await newsletterService.getNewsletters({
      page,
      limit,
      search,
      includeDeleted,
      sort: { [sortBy]: sortOrder },
    });

    return sendSuccess(
      res,
      "Newsletter subscribers fetched successfully",
      response,
      200,
      { ...response },
    );
  } catch (error: any) {
    return sendError(
      res,
      error.message || "Failed to fetch newsletter subscribers",
      500,
    );
  }
};

/* ---------------------------------------------------
   Get a single subscriber by ID
--------------------------------------------------- */
export const getNewsletterById = async (req: Request, res: Response) => {
  try {
    const subscriber = await newsletterService.getNewsletterById(req.params.id);
    return sendSuccess(res, "Subscriber fetched successfully", subscriber, 200, {
      subscriber,
    });
  } catch (error: any) {
    return sendError(res, error.message || "Subscriber not found", 404);
  }
};

export const addNewsletter = async (req: Request, res: Response) => {
  try {
    const { email, is_terms_accepted } = req.body;

    if (!email) {
      return sendError(res, "Email is required", 400);
    }

    if (!is_terms_accepted) {
      return sendError(res, "You must accept the Terms and Conditions", 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return sendError(res, "Invalid email format", 400);
    }

    const existing = await Newsletter.findOne({
      email: cleanEmail,
      is_deleted: false,
    });

    if (existing) {
      return sendError(res, "Email is already subscribed", 400);
    }

    let subscriber;

    try {
      subscriber = await newsletterService.createNewsletter({
        name: null,
        email: cleanEmail,
        is_terms_accepted: true,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return sendError(res, "Email is already subscribed", 400);
      }
      throw err;
    }

    try {
      await syncLeadToGetResponse({ email: cleanEmail, source: "newsletter" });
    } catch (err: any) {
      console.error("GetResponse sync failed:", err.message);
    }

    return sendSuccess(res, "Subscribed successfully", subscriber, 201, {
      subscriber,
    });
  } catch (error: any) {
    return sendError(res, error.message || "Subscription failed", 500);
  }
};

export const deleteNewsletter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subscriber = await newsletterService.deleteNewsletter(id);

    return sendSuccess(
      res,
      "Subscriber deleted successfully (soft delete)",
      subscriber,
      200,
      { subscriber },
    );
  } catch (error: any) {
    return sendError(res, error.message || "Failed to delete subscriber", 500);
  }
};
