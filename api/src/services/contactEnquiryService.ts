import { ContactEnquiry } from "../models/contactEnquiryModel";
import type { IContactEnquiry } from "../models/contactEnquiryModel";
import type { SortOrder } from "mongoose";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// Types
// -------------------------
interface GetAllParams {
  filter?: Record<string, any>;
  skip?: number;
  limit?: number;
  sort?: Record<string, SortOrder>;
}

// Service
// -------------------------
export const contactEnquiryService = {
  // ADD A NEW ENQUIRY
  // =========================
  add: async (data: Partial<IContactEnquiry>) => {
    if (
      !data.first_name ||
      !data.last_name ||
      !data.email ||
      !data.mobile ||
      !data.country_code ||
      !data.subject ||
      !data.message ||
      data.terms_accepted !== true
    ) {
      throw new Error("All fields are required and Terms must be accepted");
    }

    // ------------------ Normalize Email ------------------
    const emailTrim = data.email.trim().toLowerCase();

    // ------------------ Validate Phone ------------------
    const fullNumber = `${data.country_code}${data.mobile}`;
    const phoneNumber = parsePhoneNumberFromString(fullNumber);

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Invalid phone number");
    }

    const normalizedMobile = phoneNumber.nationalNumber.toString();
    const normalizedCountryCode = `+${phoneNumber.countryCallingCode}`;

    // ------------------ Create Enquiry ------------------
    const enquiry = new ContactEnquiry({
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: emailTrim,
      mobile: normalizedMobile,
      country_code: normalizedCountryCode,
      subject: data.subject,
      message: data.message.trim(),
      terms_accepted: true,
      status: "new",
    });

    return enquiry.save();
  },

  // GET ALL ENQUIRIES WITH PAGINATION
  // =========================
  getAll: async ({
    filter = {},
    skip = 0,
    limit = 10,
    sort = { created_at: -1 } as Record<string, SortOrder>,
  }: GetAllParams) => {
    const finalFilter = { is_active: 1, ...filter };

    const enquiries = await ContactEnquiry.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await ContactEnquiry.countDocuments(finalFilter);

    return { enquiries, total };
  },

  // SOFT DELETE ENQUIRY
  // =========================
  softDelete: async (id: string) => {
    return ContactEnquiry.findByIdAndUpdate(
      id,
      { is_active: 0, updated_at: new Date() },
      { new: true }
    );
  },

  // GET ENQUIRY BY ID
  // =========================
  getById: async (id: string) => {
    return ContactEnquiry.findById(id);
  },

  // UPDATE ENQUIRY STATUS
  // =========================
  updateStatus: async (
    id: string,
    status: "new" | "in-progress" | "resolved"
  ) => {
    if (!["new", "in-progress", "resolved"].includes(status)) {
      throw new Error("Invalid status");
    }

    return ContactEnquiry.findByIdAndUpdate(
      id,
      { status, updated_at: new Date() },
      { new: true }
    );
  },
};
