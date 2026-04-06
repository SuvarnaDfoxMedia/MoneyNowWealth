import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { recaptchaService } from "../services/recaptchaService";
import { syncLeadToGetResponse } from "../services/getresponseService";
import {
  partnerEnquiryService,
  getPartnerEnquiryFilter,
} from "../services/partnerEnquiryService";
import {
  PARTNER_CURRENT_STATUS,
  type PartnerCurrentStatus,
} from "../models/partnerEnquiryModel";
import { getAdminListQuery } from "../utils/adminListQuery";

const PARTNER_RECAPTCHA_ACTION = "partner_with_us_submit";
const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ARN_REGEX = /^[A-Za-z0-9/-]{3,30}$/;

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const addPartnerEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      full_name,
      email,
      mobile,
      country_code,
      city,
      organisation_name,
      current_status,
      arn_number,
      terms_accepted,
      recaptcha_token,
    } = req.body;

    const normalizedFullName = normalizeText(full_name);
    const normalizedEmail = normalizeText(email).toLowerCase();
    const normalizedMobile = normalizeText(mobile);
    const normalizedCountryCode = normalizeText(country_code);
    const normalizedCity = normalizeText(city);
    const normalizedOrganisationName = normalizeText(organisation_name);
    const normalizedCurrentStatus = normalizeText(current_status);
    const normalizedArnNumber = normalizeText(arn_number);

    if (
      !normalizedFullName ||
      !normalizedEmail ||
      !normalizedMobile ||
      !normalizedCountryCode ||
      !normalizedCity ||
      !normalizedCurrentStatus
    ) {
      return sendError(res, "All required fields are required", 400);
    }

    if (!terms_accepted) {
      return sendError(
        res,
        "You must accept the consent checkbox before submitting",
        400,
      );
    }

    if (normalizedFullName.length < 2 || normalizedFullName.length > 100) {
      return sendError(res, "Full name must be between 2 and 100 characters", 400);
    }

    if (!VALID_EMAIL_REGEX.test(normalizedEmail)) {
      return sendError(res, "Please enter a valid email address", 400);
    }

    if (normalizedCity.length < 2 || normalizedCity.length > 80) {
      return sendError(res, "City must be between 2 and 80 characters", 400);
    }

    if (
      normalizedOrganisationName &&
      normalizedOrganisationName.length > 120
    ) {
      return sendError(
        res,
        "Organisation name must be 120 characters or fewer",
        400,
      );
    }

    if (normalizedArnNumber && !VALID_ARN_REGEX.test(normalizedArnNumber)) {
      return sendError(res, "Please enter a valid ARN number", 400);
    }

    const normalizedCurrentStatusValue =
      PARTNER_CURRENT_STATUS.find(
        (status) => status.toLowerCase() === normalizedCurrentStatus.toLowerCase(),
      ) || null;

    if (!normalizedCurrentStatusValue) {
      return sendError(res, "Please select a valid current status", 400);
    }

    const recaptchaResult = await recaptchaService.verify({
      token: recaptcha_token,
      expectedAction: PARTNER_RECAPTCHA_ACTION,
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

    const enquiry = await partnerEnquiryService.add({
      full_name: normalizedFullName,
      email: normalizedEmail,
      mobile: normalizedMobile,
      country_code: normalizedCountryCode,
      city: normalizedCity,
      organisation_name: normalizedOrganisationName,
      current_status: normalizedCurrentStatusValue as PartnerCurrentStatus,
      arn_number: normalizedArnNumber,
      terms_accepted: Boolean(terms_accepted),
    });

    try {
      await syncLeadToGetResponse({
        email: enquiry.email,
        name: enquiry.full_name,
        mobile: `${enquiry.country_code}${enquiry.mobile}`,
        city: enquiry.city,
        source: "partner_enquiry",
      });
    } catch (syncError: any) {
      console.error("Partner enquiry GetResponse sync failed:", syncError.message);
    }

    return sendSuccess(
      res,
      "Partner enquiry submitted successfully",
      enquiry,
      201,
    );
  } catch (err: any) {
    console.error("Add partner enquiry error:", err);
    return sendError(
      res,
      err?.message === "Missing RECAPTCHA_SECRET_KEY"
        ? "Captcha is not configured on the server"
        : err?.message === "Invalid phone number"
          ? "Please enter a valid mobile number"
          : err?.message === "Invalid email format"
            ? "Please enter a valid email address"
            : err?.message || "Server error",
      err?.message === "Invalid phone number" ||
        err?.message === "Invalid email format"
        ? 400
        : 500,
    );
  }
};

export const getPartnerEnquiries = async (
  req: Request,
  res: Response,
) => {
  try {
    const { search, page, limit, skip, sort } = getAdminListQuery(
      req,
      [
        "full_name",
        "email",
        "mobile",
        "city",
        "organisation_name",
        "current_status",
        "arn_number",
        "created_at",
      ],
      "created_at",
    );
    const filter = getPartnerEnquiryFilter(search);

    const { enquiries, total } = await partnerEnquiryService.getAll({
      filter,
      skip,
      limit,
      sort,
    });

    return sendSuccess(
      res,
      "Partner enquiries fetched successfully",
      enquiries,
      200,
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    );
  } catch (err: any) {
    console.error("Get partner enquiries error:", err);
    return sendError(res, "Server error", 500);
  }
};

export const getPartnerEnquiryById = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const enquiry = await partnerEnquiryService.getById(id);

    if (!enquiry || enquiry.is_active !== 1) {
      return sendError(res, "Partner enquiry not found", 404);
    }

    return sendSuccess(
      res,
      "Partner enquiry fetched successfully",
      enquiry,
      200,
    );
  } catch (err: any) {
    console.error("Get partner enquiry error:", err);
    return sendError(res, "Server error", 500);
  }
};

export const softDeletePartnerEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const enquiry = await partnerEnquiryService.softDelete(id);

    if (!enquiry) {
      return sendError(res, "Partner enquiry not found", 404);
    }

    return sendSuccess(
      res,
      "Partner enquiry deleted successfully",
      enquiry,
      200,
    );
  } catch (err: any) {
    console.error("Soft delete partner enquiry error:", err);
    return sendError(res, "Server error", 500);
  }
};

export const updatePartnerEnquiryStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["new", "in-progress", "resolved"].includes(status)) {
      return sendError(res, "Invalid status", 400);
    }

    const enquiry = await partnerEnquiryService.updateStatus(id, status);

    if (!enquiry) {
      return sendError(res, "Partner enquiry not found", 404);
    }

    return sendSuccess(
      res,
      "Partner enquiry status updated successfully",
      enquiry,
      200,
    );
  } catch (err: any) {
    console.error("Update partner enquiry status error:", err);
    return sendError(res, "Server error", 500);
  }
};
