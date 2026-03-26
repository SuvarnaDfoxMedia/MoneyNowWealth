import type { SortOrder } from "mongoose";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  PartnerEnquiry,
  PARTNER_CURRENT_STATUS,
  type IPartnerEnquiry,
  type PartnerCurrentStatus,
} from "../models/partnerEnquiryModel";

interface GetAllParams {
  filter?: Record<string, any>;
  skip?: number;
  limit?: number;
  sort?: Record<string, SortOrder>;
}

const normalizeCurrentStatus = (
  currentStatus?: string,
): PartnerCurrentStatus | "" => {
  const normalizedValue = currentStatus?.trim().toLowerCase() || "";

  const statusMap: Record<string, PartnerCurrentStatus> = {
    [PARTNER_CURRENT_STATUS[0].toLowerCase()]: PARTNER_CURRENT_STATUS[0],
    [PARTNER_CURRENT_STATUS[1].toLowerCase()]: PARTNER_CURRENT_STATUS[1],
    [PARTNER_CURRENT_STATUS[2].toLowerCase()]: PARTNER_CURRENT_STATUS[2],
    "amfi registration number (arn)": PARTNER_CURRENT_STATUS[0],
    individual_mutual_fund_distributor: PARTNER_CURRENT_STATUS[0],
    ifa_arn_holder: PARTNER_CURRENT_STATUS[0],
    small_distribution_wealth_firm: PARTNER_CURRENT_STATUS[1],
    planning_to_become_distributor: PARTNER_CURRENT_STATUS[2],
    not_yet_arn_holder: PARTNER_CURRENT_STATUS[2],
  };

  return statusMap[normalizedValue] || "";
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const partnerEnquiryService = {
  add: async (data: Partial<IPartnerEnquiry>) => {
    const normalizedCurrentStatus = normalizeCurrentStatus(
      data.current_status,
    );

    if (
      !data.full_name ||
      !data.email ||
      !data.mobile ||
      !data.country_code ||
      !data.city ||
      !normalizedCurrentStatus ||
      data.terms_accepted !== true
    ) {
      throw new Error(
        "All required fields must be provided and terms must be accepted",
      );
    }

    const emailTrim = data.email.trim().toLowerCase();
    if (!isValidEmail(emailTrim)) {
      throw new Error("Invalid email format");
    }

    const fullNumber = `${data.country_code}${data.mobile}`;
    const phoneNumber = parsePhoneNumberFromString(fullNumber);

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Invalid phone number");
    }

    const normalizedMobile = phoneNumber.nationalNumber.toString();
    const normalizedCountryCode = `+${phoneNumber.countryCallingCode}`;

    const enquiry = new PartnerEnquiry({
      full_name: data.full_name.trim(),
      email: emailTrim,
      mobile: normalizedMobile,
      country_code: normalizedCountryCode,
      city: data.city.trim(),
      organisation_name: data.organisation_name?.trim() || "",
      current_status: normalizedCurrentStatus,
      arn_number: data.arn_number?.trim() || "",
      terms_accepted: true,
      status: "new",
      lead_source: "partner_with_us",
    });

    return enquiry.save();
  },

  getAll: async ({
    filter = {},
    skip = 0,
    limit = 10,
    sort = { created_at: -1 } as Record<string, SortOrder>,
  }: GetAllParams) => {
    const finalFilter = { is_active: 1, ...filter };

    const enquiries = await PartnerEnquiry.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await PartnerEnquiry.countDocuments(finalFilter);

    return { enquiries, total };
  },

  getById: async (id: string) => {
    return PartnerEnquiry.findById(id);
  },

  softDelete: async (id: string) => {
    return PartnerEnquiry.findByIdAndUpdate(
      id,
      { is_active: 0, updated_at: new Date() },
      { new: true },
    );
  },

  updateStatus: async (
    id: string,
    status: "new" | "in-progress" | "resolved",
  ) => {
    if (!["new", "in-progress", "resolved"].includes(status)) {
      throw new Error("Invalid status");
    }

    return PartnerEnquiry.findByIdAndUpdate(
      id,
      { status, updated_at: new Date() },
      { new: true },
    );
  },
};
