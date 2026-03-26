import type { Request, Response } from "express";
import * as newsletterService from "../services/newsletterService";
import { Newsletter } from "../models/newsletterModel";
import { addContactToGetResponse } from "../services/getresponseService";
import { sendEmail } from "../emails/sendEmail";
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

    /* ------------------ Validations ------------------ */

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

    /* ------------------ Check Duplicate ------------------ */

    const existing = await Newsletter.findOne({
      email: cleanEmail,
      is_deleted: false,
    });

    if (existing) {
      return sendError(res, "Email is already subscribed", 400);
    }

    /* ------------------ Save Subscriber ------------------ */

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

    /* ------------------ Add to GetResponse ------------------ */
    try {
      await addContactToGetResponse(cleanEmail);
    } catch (err: any) {
      console.error("GetResponse Error:", err.message);
      // Do NOT fail subscription if GetResponse fails
    }

    /* ------------------ Send Thank You Email ------------------ */

    const html = `
      <div style="font-family:Arial, sans-serif;
                  max-width:600px;margin:auto;padding:25px;
                  background:#f5f8ff;border-radius:12px;
                  border:1px solid #e0e7ff;">
        <h2 style="text-align:center;color:#043F79;">
          Thank You for Subscribing!
        </h2>
        <p style="font-size:16px;color:#333;">
          You have been successfully subscribed to our newsletter.
        </p>
        <p style="font-size:16px;color:#333;">
          You’ll now receive the latest updates, insights, and news directly to your inbox.
        </p>
        <br/>
        <p style="color:#043F79;text-align:center;font-size:14px;">
          — Team MoneyNow
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: cleanEmail,
        subject: "You're Subscribed!",
        html,
      });
      // await getResponseEmailService.sendMarketingEmail(
      //   cleanEmail,
      //   "You're Subscribed!",
      //   html,
      // );
    } catch (err: any) {
      console.error("Email Send Error:", err.message);
    }

    /* ------------------ Final Response ------------------ */

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
