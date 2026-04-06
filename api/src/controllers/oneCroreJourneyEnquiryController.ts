import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { recaptchaService } from "../services/recaptchaService";
import { syncLeadToGetResponse } from "../services/getresponseService";
import { oneCroreJourneyEnquiryService } from "../services/oneCroreJourneyEnquiryService";
import { getAdminListQuery } from "../utils/adminListQuery";

const ONE_CRORE_RECAPTCHA_ACTION = "one_crore_journey_submit";
const ALLOWED_SORT_FIELDS = [
  "full_name",
  "email",
  "mobile",
  "required_sip",
  "target_wealth",
  "years",
  "wants_callback",
  "created_at",
] as const;

const isFiniteNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);

export const addOneCroreJourneyEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      full_name,
      email,
      mobile,
      country_code,
      wants_callback,
      wealth_amount,
      user_sip_capacity,
      years,
      expected_return,
      inflation_rate,
      required_sip,
      invested_amount,
      growth_amount,
      target_wealth,
      recaptcha_token,
    } = req.body;

    if (
      !full_name ||
      !email ||
      !mobile ||
      !country_code ||
      !isFiniteNumber(wealth_amount) ||
      !isFiniteNumber(user_sip_capacity) ||
      !isFiniteNumber(years) ||
      !isFiniteNumber(expected_return) ||
      !isFiniteNumber(inflation_rate) ||
      !isFiniteNumber(required_sip) ||
      !isFiniteNumber(invested_amount) ||
      !isFiniteNumber(growth_amount) ||
      !isFiniteNumber(target_wealth)
    ) {
      return sendError(res, "All journey and contact fields are required", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return sendError(res, "Invalid email format", 400);
    }

    const recaptchaResult = await recaptchaService.verify({
      token: recaptcha_token,
      expectedAction: ONE_CRORE_RECAPTCHA_ACTION,
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

    const enquiry = await oneCroreJourneyEnquiryService.add({
      full_name,
      email: normalizedEmail,
      mobile: mobile.toString().trim(),
      country_code: country_code.toString().trim(),
      wants_callback: Boolean(wants_callback),
      wealth_amount,
      user_sip_capacity,
      years,
      expected_return,
      inflation_rate,
      required_sip,
      invested_amount,
      growth_amount,
      target_wealth,
    });

    try {
      await syncLeadToGetResponse({
        email: enquiry.email,
        name: enquiry.full_name,
        mobile: `${enquiry.country_code}${enquiry.mobile}`,
        source: "one_crore_journey",
      });
    } catch (syncError: any) {
      console.error(
        "One crore journey GetResponse sync failed:",
        syncError.message,
      );
    }

    return sendSuccess(
      res,
      "One crore journey enquiry submitted successfully",
      enquiry,
      201,
      { enquiry },
    );
  } catch (err: any) {
    console.error("Add one crore journey enquiry error:", err);
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

export const getOneCroreJourneyEnquiries = async (
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
        { country_code: regex },
      ];
    }

    const { enquiries, total } = await oneCroreJourneyEnquiryService.getAll({
      filter,
      skip,
      limit,
      sort,
    });

    return sendSuccess(
      res,
      "One crore journey enquiries fetched successfully",
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
    console.error("Get one crore journey enquiries error:", err);
    return sendError(res, "Server error", 500);
  }
};

export const softDeleteOneCroreJourneyEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const enquiry = await oneCroreJourneyEnquiryService.softDelete(id);

    if (!enquiry) {
      return sendError(res, "One crore journey enquiry not found", 404);
    }

    return sendSuccess(
      res,
      "One crore journey enquiry deleted successfully",
      enquiry,
      200,
      { enquiry },
    );
  } catch (err) {
    console.error("Delete one crore journey enquiry error:", err);
    return sendError(res, "Server error", 500);
  }
};
