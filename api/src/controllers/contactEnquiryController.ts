import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { recaptchaService } from "../services/recaptchaService";
import { syncLeadToGetResponse } from "../services/getresponseService";
import {
  contactEnquiryService,
  getContactEnquiryFilter,
} from "../services/contactEnquiryService";
import { getAdminListQuery } from "../utils/adminListQuery";

const CONTACT_RECAPTCHA_ACTION = "contact_submit";
type ContactSubject =
  | "Investment Inquiry"
  | "Support"
  | "Partnership"
  | "Feedback"
  | "Others";

const splitFullName = (firstName?: string, lastName?: string) => {
  const normalizedFirstName = typeof firstName === "string" ? firstName.trim() : "";
  const normalizedLastName = typeof lastName === "string" ? lastName.trim() : "";

  if (!normalizedFirstName) {
    return { first_name: "", last_name: normalizedLastName };
  }

  if (normalizedLastName) {
    return { first_name: normalizedFirstName, last_name: normalizedLastName };
  }

  const nameParts = normalizedFirstName.replace(/\s+/g, " ").split(" ");

  return {
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" "),
  };
};

/* -------------------------
   Add Contact Enquiry
------------------------- */
export const addContactEnquiry = async (req: Request, res: Response) => {
  try {
    const {
      first_name,
      last_name,
      email,
      mobile,
      country_code,
      city,
      subject,
      message,
      terms_accepted,
      recaptcha_token,
    } = req.body;

    const normalizedSubjectMap: Record<string, ContactSubject> = {
      partnership: "Partnership",
      partner: "Partnership",
      support: "Support",
      feedback: "Feedback",
      others: "Others",
      "investment inquiry": "Investment Inquiry",
    };

    const normalizedSubjectKey =
      typeof subject === "string" ? subject.trim().toLowerCase() : "";
    const normalizedSubject: ContactSubject | "" =
      normalizedSubjectMap[normalizedSubjectKey] || "";

    // ------------------ Required Fields ------------------
    if (
      !first_name ||
      !email ||
      !mobile ||
      !country_code ||
      !normalizedSubject ||
      !message
    ) {
      return sendError(res, "All fields are required", 400);
    }

    if (!terms_accepted) {
      return sendError(res, "You must accept Terms and Conditions", 400);
    }

    const recaptchaResult = await recaptchaService.verify({
      token: recaptcha_token,
      expectedAction: CONTACT_RECAPTCHA_ACTION,
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

    // ------------------ Validate Email ------------------
    const emailTrim = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      return sendError(res, "Invalid email format", 400);
    }

    const splitName = splitFullName(first_name, last_name);

    const enquiry = await contactEnquiryService.add({
      first_name: splitName.first_name,
      last_name: splitName.last_name,
      email: emailTrim,
      mobile: mobile.toString().trim(),
      country_code: country_code.toString().trim(),
      city: typeof city === "string" ? city.trim() : "",
      subject: normalizedSubject,
      message: message.trim(),
      terms_accepted,
      status: "new",
    });

    try {
      await syncLeadToGetResponse({
        email: enquiry.email,
        name: [enquiry.first_name, enquiry.last_name].filter(Boolean).join(" "),
        mobile: `${enquiry.country_code}${enquiry.mobile}`,
        city: enquiry.city,
        contactPurpose: enquiry.subject,
        source: "contact_enquiry",
      });
    } catch (syncError: any) {
      console.error("Contact enquiry GetResponse sync failed:", syncError.message);
    }

    return sendSuccess(res, "Contact enquiry submitted successfully", enquiry, 201, {
      enquiry,
    });
  } catch (err: any) {
    console.error("Add contact enquiry error:", err);
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

/* -------------------------
   Get Enquiries (Admin)
------------------------- */
export const getContactEnquiries = async (req: Request, res: Response) => {
  try {
    const { search, page, limit, skip, sort } = getAdminListQuery(
      req,
      ["first_name", "last_name", "email", "mobile", "subject", "created_at"],
      "created_at",
    );
    const filter = getContactEnquiryFilter(search);
    const { enquiries, total } = await contactEnquiryService.getAll({
      filter,
      skip,
      limit,
      sort,
    });

    return sendSuccess(res, "Contact enquiries fetched successfully", enquiries, 200, {
      enquiries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("Get contact enquiries error:", err);
    return sendError(res, "Server error", 500);
  }
};

/* -------------------------
   Soft Delete Enquiry (Admin)
------------------------- */
export const softDeleteContactEnquiry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const enquiry = await contactEnquiryService.softDelete(id);

    if (!enquiry) {
      return sendError(res, "Contact enquiry not found", 404);
    }

    return sendSuccess(res, "Contact enquiry deleted successfully", enquiry, 200, {
      enquiry,
    });
  } catch (err: any) {
    console.error("Soft delete contact enquiry error:", err);
    return sendError(res, "Server error", 500);
  }
};

/* -------------------------
   Update Enquiry Status (Admin)
------------------------- */
export const updateContactEnquiryStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["new", "in-progress", "resolved"].includes(status)) {
      return sendError(res, "Invalid status", 400);
    }

    const enquiry = await contactEnquiryService.updateStatus(id, status);

    if (!enquiry) {
      return sendError(res, "Contact enquiry not found", 404);
    }

    return sendSuccess(res, "Contact enquiry status updated successfully", enquiry, 200, {
      enquiry,
    });
  } catch (err: any) {
    console.error("Update contact enquiry status error:", err);
    return sendError(res, "Server error", 500);
  }
};
