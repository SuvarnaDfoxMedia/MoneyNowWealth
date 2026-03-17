import type { Request, Response } from "express";
import { ContactEnquiry } from "../models/contactEnquiryModel";
import { sendError, sendSuccess } from "../utils/apiResponse";

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
      subject,
      message,
      terms_accepted,
    } = req.body;

    // ------------------ Required Fields ------------------
    if (
      !first_name ||
      !last_name ||
      !email ||
      !mobile ||
      !country_code ||
      !subject ||
      !message
    ) {
      return sendError(res, "All fields are required", 400);
    }

    if (!terms_accepted) {
      return sendError(res, "You must accept Terms and Conditions", 400);
    }

    // ------------------ Validate Email ------------------
    const emailTrim = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      return sendError(res, "Invalid email format", 400);
    }

    // ------------------ Normalize Phone (Optional) ------------------
    // Instead of strict validation, just normalize by trimming
    const normalizedMobile = mobile.toString().trim();
    const normalizedCountryCode = country_code.toString().trim();

    // ------------------ Save to DB ------------------
    const enquiry = await ContactEnquiry.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: emailTrim,
      mobile: normalizedMobile,
      country_code: normalizedCountryCode,
      subject,
      message: message.trim(),
      terms_accepted,
      status: "new",
    });

    return sendSuccess(res, "Contact enquiry submitted successfully", enquiry, 201, {
      enquiry,
    });
  } catch (err: any) {
    console.error("Add contact enquiry error:", err);
    return sendError(res, "Server error", 500);
  }
};

/* -------------------------
   Get Enquiries (Admin)
------------------------- */
export const getContactEnquiries = async (req: Request, res: Response) => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);
    const skip = (page - 1) * limit;

    const sortField =
      typeof req.query.sortField === "string"
        ? req.query.sortField
        : "created_at";
    const sortOrder =
      typeof req.query.sortOrder === "string" ? req.query.sortOrder : "desc";

    const filter: Record<string, unknown> = { is_active: 1 };

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { first_name: regex },
        { last_name: regex },
        { email: regex },
        { mobile: regex },
        { country_code: regex },
        { subject: regex },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortField] = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    const total = await ContactEnquiry.countDocuments(filter);
    const enquiries = await ContactEnquiry.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

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
    const enquiry = await ContactEnquiry.findByIdAndUpdate(
      id,
      { is_active: 0 },
      { new: true }
    );

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

    const enquiry = await ContactEnquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

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
