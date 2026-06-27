import { ContactEnquiry } from "../models/contactEnquiryModel";
import type { IContactEnquiry } from "../models/contactEnquiryModel";
import type { SortOrder } from "mongoose";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const splitFullName = (firstName?: string, lastName?: string) => {
  const normalizedFirstName = firstName?.trim() || "";
  const normalizedLastName = lastName?.trim() || "";

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

const normalizeSubject = (subject?: string) => {
  const subjectMap: Record<string, IContactEnquiry["subject"]> = {
    partnership: "Partnership",
    partner: "Partnership",
    support: "Support",
    feedback: "Feedback",
    others: "Others",
    "investment inquiry": "Investment Inquiry",
  };

  if (!subject) {
    return "";
  }

  return subjectMap[subject.trim().toLowerCase()] || subject.trim();
};

export const getContactEnquiryFilter = (search?: string) => {
  const filter: Record<string, unknown> = { is_active: 1 };

  if (!search) {
    return filter;
  }

  const regex = new RegExp(search, "i");
  filter.$or = [
    { first_name: regex },
    { last_name: regex },
    { email: regex },
    { mobile: regex },
    { country_code: regex },
    { subject: regex },
  ];

  return filter;
};

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
    const normalizedSubject = normalizeSubject(data.subject);

    if (
      !data.first_name ||
      !data.email ||
      !data.mobile ||
      !data.country_code ||
      !normalizedSubject ||
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
    const splitName = splitFullName(data.first_name, data.last_name);

    // ------------------ Create Enquiry ------------------
    const enquiry = new ContactEnquiry({
      first_name: splitName.first_name,
      last_name: splitName.last_name,
      email: emailTrim,
      mobile: normalizedMobile,
      country_code: normalizedCountryCode,
      city: data.city?.trim() || "",
      subject: normalizedSubject,
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
    const finalLimit = Math.min(Math.max(Number(limit) || 10, 1), 200);
    const enquiries = await ContactEnquiry.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(finalLimit);

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
