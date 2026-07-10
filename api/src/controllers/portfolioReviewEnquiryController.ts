import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { recaptchaService } from "../services/recaptchaService";
import { syncLeadToGetResponse } from "../services/getresponseService";
import { portfolioReviewEnquiryService } from "../services/portfolioReviewEnquiryService";
import { getAdminListQuery } from "../utils/adminListQuery";

const PORTFOLIO_REVIEW_RECAPTCHA_ACTION = "portfolio_review_submit";
const ALLOWED_SORT_FIELDS = [
  "full_name",
  "email",
  "mobile",
  "investor_mindset",
  "created_at",
] as const;

const VALID_MINDSETS = [
  "just_getting_started",
  "investing_not_sure",
  "second_opinion",
  "all_over_the_place",
] as const;

export const addPortfolioReviewEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      full_name,
      email,
      mobile,
      country_code,
      investor_mindset,
      cas_file_name,
      cas_file_url,
      recaptcha_token,
    } = req.body;

    if (!full_name || !email || !mobile || !country_code || !investor_mindset) {
      return sendError(
        res,
        "Name, email, mobile, country code and investor mindset are required",
        400,
      );
    }

    if (!VALID_MINDSETS.includes(investor_mindset)) {
      return sendError(res, "Invalid investor mindset value", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return sendError(res, "Invalid email format", 400);
    }

    const recaptchaResult = await recaptchaService.verify({
      token: recaptcha_token,
      expectedAction: PORTFOLIO_REVIEW_RECAPTCHA_ACTION,
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

    const enquiry = await portfolioReviewEnquiryService.add({
      full_name,
      email: normalizedEmail,
      mobile: mobile.toString().trim(),
      country_code: country_code.toString().trim(),
      investor_mindset,
      // CAS fields are optional — stored only when a file was uploaded
      cas_file_name: cas_file_name?.toString().trim() || null,
      cas_file_url: cas_file_url?.toString().trim() || null,
    });

    try {
      await syncLeadToGetResponse({
        email: enquiry.email,
        name: enquiry.full_name,
        mobile: `${enquiry.country_code}${enquiry.mobile}`,
        source: "portfolio_review",
      });
    } catch (syncError: any) {
      console.error(
        "Portfolio review GetResponse sync failed:",
        syncError.message,
      );
    }

    return sendSuccess(
      res,
      "Portfolio review enquiry submitted successfully",
      enquiry,
      201,
      { enquiry },
    );
  } catch (err: any) {
    console.error("Add portfolio review enquiry error:", err);
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

export const getPortfolioReviewEnquiries = async (
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
        { investor_mindset: regex },
      ];
    }

    const { enquiries, total } = await portfolioReviewEnquiryService.getAll({
      filter,
      skip,
      limit,
      sort,
    });

    return sendSuccess(
      res,
      "Portfolio review enquiries fetched successfully",
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
    console.error("Get portfolio review enquiries error:", err);
    return sendError(res, "Server error", 500);
  }
};

export const softDeletePortfolioReviewEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const enquiry = await portfolioReviewEnquiryService.softDelete(id);

    if (!enquiry) {
      return sendError(res, "Portfolio review enquiry not found", 404);
    }

    return sendSuccess(
      res,
      "Portfolio review enquiry deleted successfully",
      enquiry,
      200,
      { enquiry },
    );
  } catch (err) {
    console.error("Delete portfolio review enquiry error:", err);
    return sendError(res, "Server error", 500);
  }
};
