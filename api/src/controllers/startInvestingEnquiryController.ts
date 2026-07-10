import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { recaptchaService } from "../services/recaptchaService";
import { syncLeadToGetResponse } from "../services/getresponseService";
import { startInvestingEnquiryService } from "../services/startInvestingEnquiryService";
import { getAdminListQuery } from "../utils/adminListQuery";

const START_INVESTING_RECAPTCHA_ACTION = "start_investing_submit";
const ALLOWED_SORT_FIELDS = [
  "full_name",
  "email",
  "mobile",
  "goal",
  "created_at",
] as const;

const VALID_GOALS = [
  "childs_future",
  "retirement",
  "growing_savings",
  "not_sure",
] as const;

export const addStartInvestingEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      full_name,
      email,
      mobile,
      country_code,
      goal,
      calculator_type,
      calculator_inputs,
      calculator_result,
      recaptcha_token,
    } = req.body;

    if (!full_name || !email || !mobile || !country_code || !goal) {
      return sendError(res, "Name, email, mobile, country code and goal are required", 400);
    }

    if (!VALID_GOALS.includes(goal)) {
      return sendError(res, "Invalid goal value", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return sendError(res, "Invalid email format", 400);
    }

    const recaptchaResult = await recaptchaService.verify({
      token: recaptcha_token,
      expectedAction: START_INVESTING_RECAPTCHA_ACTION,
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

    const enquiry = await startInvestingEnquiryService.add({
      full_name,
      email: normalizedEmail,
      mobile: mobile.toString().trim(),
      country_code: country_code.toString().trim(),
      goal,
      // Calculator fields are optional — only populated when goal !== "not_sure"
      calculator_type: calculator_type ?? null,
      calculator_inputs: calculator_inputs ?? null,
      calculator_result: calculator_result ?? null,
    });

    try {
      await syncLeadToGetResponse({
        email: enquiry.email,
        name: enquiry.full_name,
        mobile: `${enquiry.country_code}${enquiry.mobile}`,
        source: "start_investing",
      });
    } catch (syncError: any) {
      console.error(
        "Start investing GetResponse sync failed:",
        syncError.message,
      );
    }

    return sendSuccess(
      res,
      "Start investing enquiry submitted successfully",
      enquiry,
      201,
      { enquiry },
    );
  } catch (err: any) {
    console.error("Add start investing enquiry error:", err);
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

export const getStartInvestingEnquiries = async (
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
        { goal: regex },
      ];
    }

    const { enquiries, total } = await startInvestingEnquiryService.getAll({
      filter,
      skip,
      limit,
      sort,
    });

    return sendSuccess(
      res,
      "Start investing enquiries fetched successfully",
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
    console.error("Get start investing enquiries error:", err);
    return sendError(res, "Server error", 500);
  }
};

export const softDeleteStartInvestingEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const enquiry = await startInvestingEnquiryService.softDelete(id);

    if (!enquiry) {
      return sendError(res, "Start investing enquiry not found", 404);
    }

    return sendSuccess(
      res,
      "Start investing enquiry deleted successfully",
      enquiry,
      200,
      { enquiry },
    );
  } catch (err) {
    console.error("Delete start investing enquiry error:", err);
    return sendError(res, "Server error", 500);
  }
};
