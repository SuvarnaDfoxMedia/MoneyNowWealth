import type { Request, Response } from "express";
import * as newsletterService from "../services/newsletterService";
import { sendEmail } from "../utils/emails";

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

    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch newsletter subscribers",
    });
  }
};

/* ---------------------------------------------------
   Get a single subscriber by ID
--------------------------------------------------- */
export const getNewsletterById = async (req: Request, res: Response) => {
  try {
    const subscriber = await newsletterService.getNewsletterById(req.params.id);
    return res.status(200).json({ success: true, subscriber });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message || "Subscriber not found",
    });
  }
};

/* ---------------------------------------------------
   Create new newsletter subscription + SEND EMAIL
--------------------------------------------------- */
export const addNewsletter = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    // ------------------ Validations ------------------
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // ------------------ Email validation ------------------
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // ------------------ Save subscriber ------------------
    const subscriber = await newsletterService.createNewsletter({
      name: cleanName,
      email: cleanEmail,
    });

    // ------------------ Send thank-you email ------------------
    const html = `
      <div style="font-family:Arial, sans-serif;
                  max-width:600px;margin:auto;padding:25px;
                  background:#f5f8ff;border-radius:12px;
                  border:1px solid #e0e7ff;">
        <h2 style="text-align:center;color:#043F79;">Thank You for Subscribing!</h2>
        <p style="font-size:16px;color:#333;">
          Hi <strong>${cleanName}</strong>,
        </p>
        <p style="font-size:16px;color:#333;">
          You have been successfully subscribed to our newsletter.
        </p>
        <p style="font-size:16px;color:#333;">
          You’ll now receive the latest updates, offers, and news directly to your inbox.
        </p>
        <br/>
        <p style="color:#043F79;text-align:center;font-size:14px;">
          — Team MoneyNow
        </p>
      </div>
    `;

    await sendEmail({
      to: cleanEmail,
      subject: "You're Subscribed! 🎉",
      html,
    });

    // ------------------ Response ------------------
    return res.status(201).json({
      success: true,
      message: "Subscribed successfully",
      subscriber,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Subscription failed",
    });
  }
};

/* ---------------------------------------------------
   Soft delete subscriber
--------------------------------------------------- */
export const deleteNewsletter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subscriber = await newsletterService.deleteNewsletter(id);

    return res.status(200).json({
      success: true,
      message: "Subscriber deleted successfully (soft delete)",
      subscriber,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete subscriber",
    });
  }
};
