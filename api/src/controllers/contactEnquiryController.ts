import type { Request, Response } from "express";
import { ContactEnquiry } from "../models/contactEnquiryModel";
import { parsePhoneNumberFromString } from "libphonenumber-js";

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
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!terms_accepted) {
      return res.status(400).json({
        success: false,
        message: "You must accept Terms and Conditions",
      });
    }

    // ------------------ Validate Email ------------------
    const emailTrim = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
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

    return res.status(201).json({ success: true, enquiry });
  } catch (err: any) {
    console.error("Add contact enquiry error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
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

    const filter: any = { is_active: 1 };

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

    const sort: any = {};
    sort[sortField] = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    const total = await ContactEnquiry.countDocuments(filter);
    const enquiries = await ContactEnquiry.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      enquiries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("Get contact enquiries error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
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
      return res
        .status(404)
        .json({ success: false, message: "Contact enquiry not found" });
    }

    return res.json({ success: true, enquiry });
  } catch (err: any) {
    console.error("Soft delete contact enquiry error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const enquiry = await ContactEnquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!enquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Contact enquiry not found" });
    }

    return res.json({ success: true, enquiry });
  } catch (err: any) {
    console.error("Update contact enquiry status error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
