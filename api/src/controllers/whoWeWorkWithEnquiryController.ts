import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { recaptchaService } from "../services/recaptchaService";
import { syncLeadToGetResponse } from "../services/getresponseService";
import { whoWeWorkWithEnquiryService } from "../services/whoWeWorkWithEnquiryService";
import { getAdminListQuery } from "../utils/adminListQuery";

const WHO_WE_WORK_WITH_RECAPTCHA_ACTION = "who_we_work_with_submit";
const ALLOWED_SORT_FIELDS = [
  "full_name",
  "email",
  "mobile",
  "preference",
  "persona_label",
  "created_at",
] as const;

export const addWhoWeWorkWithEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      full_name,
      email,
      mobile,
      country_code,
      preference,
      persona_id,
      persona_label,
      recaptcha_token,
    } = req.body;

    if (
      !full_name ||
      !email ||
      !mobile ||
      !country_code ||
      !preference ||
      !persona_id ||
      !persona_label
    ) {
      return sendError(res, "All persona enquiry fields are required", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return sendError(res, "Invalid email format", 400);
    }

    const recaptchaResult = await recaptchaService.verify({
      token: recaptcha_token,
      expectedAction: WHO_WE_WORK_WITH_RECAPTCHA_ACTION,
      minScore: 0.5,
      remoteIp: req.ip,
    });

    if (!recaptchaResult.ok) {
      return sendError(
        res,
        recaptchaResult.message,
        recaptchaResult.statusCode,
        null,
        { recaptcha: recaptchaResult.details ?? null },
      );
    }

    const enquiry = await whoWeWorkWithEnquiryService.add({
      full_name,
      email: normalizedEmail,
      mobile: mobile.toString().trim(),
      country_code: country_code.toString().trim(),
      preference,
      persona_id,
      persona_label,
    });

    try {
      await syncLeadToGetResponse({
        email: enquiry.email,
        name: enquiry.full_name,
        mobile: `${enquiry.country_code}${enquiry.mobile}`,
        source: "who_we_work_with",
      });
    } catch (syncError: any) {
      console.error(
        "Who we work with GetResponse sync failed:",
        syncError.message,
      );
    }

    return sendSuccess(
      res,
      "Who we work with enquiry submitted successfully",
      enquiry,
      201,
      { enquiry },
    );
  } catch (err: any) {
    console.error("Add who we work with enquiry error:", err);
    return sendError(
      res,
      err?.message === "Missing RECAPTCHA_SECRET_KEY"
        ? "Captcha is not configured on the server"
        : err?.message === "Invalid phone number"
          ? "Please enter a valid mobile number"
          : "Server error",
      err?.message === "Invalid phone number" ? 400 : 500,
    );
  }
};

export const getWhoWeWorkWithEnquiries = async (
  req: Request,
  res: Response,
) => {
  try {
    const { search, page, limit, skip, sort } = getAdminListQuery(
      req,
      ALLOWED_SORT_FIELDS,
      "created_at",
    );

    const filter: Record<string, unknown> = { is_active: 1 };

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { full_name: regex },
        { email: regex },
        { mobile: regex },
        { preference: regex },
        { persona_label: regex },
      ];
    }

    const { enquiries, total } = await whoWeWorkWithEnquiryService.getAll({
      filter,
      skip,
      limit,
      sort,
    });

    return sendSuccess(
      res,
      "Who we work with enquiries fetched successfully",
      enquiries,
      200,
      {
        enquiries,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    );
  } catch (err) {
    console.error("Get who we work with enquiries error:", err);
    return sendError(res, "Server error", 500);
  }
};

export const softDeleteWhoWeWorkWithEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const enquiry = await whoWeWorkWithEnquiryService.softDelete(id);

    if (!enquiry) {
      return sendError(res, "Who we work with enquiry not found", 404);
    }

    return sendSuccess(
      res,
      "Who we work with enquiry deleted successfully",
      enquiry,
      200,
      { enquiry },
    );
  } catch (err) {
    console.error("Delete who we work with enquiry error:", err);
    return sendError(res, "Server error", 500);
  }
};
