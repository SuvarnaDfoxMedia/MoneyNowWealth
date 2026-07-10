import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  PortfolioReviewEnquiry,
  type IPortfolioReviewEnquiry,
} from "../models/portfolioReviewEnquiryModel";
import type { SortOrder } from "mongoose";

interface GetAllParams {
  filter?: Record<string, unknown>;
  skip?: number;
  limit?: number;
  sort?: Record<string, SortOrder>;
}

export const portfolioReviewEnquiryService = {
  add: async (data: Partial<IPortfolioReviewEnquiry>) => {
    if (
      !data.full_name ||
      !data.email ||
      !data.mobile ||
      !data.country_code ||
      !data.investor_mindset
    ) {
      throw new Error(
        "All required contact and investor mindset fields must be provided",
      );
    }

    const email = data.email.trim().toLowerCase();
    const fullNumber = `${data.country_code}${data.mobile}`;
    const phoneNumber = parsePhoneNumberFromString(fullNumber);

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Invalid phone number");
    }

    const enquiry = new PortfolioReviewEnquiry({
      full_name: data.full_name.trim().replace(/\s+/g, " "),
      email,
      mobile: phoneNumber.nationalNumber.toString(),
      country_code: `+${phoneNumber.countryCallingCode}`,
      investor_mindset: data.investor_mindset,
      cas_file_name: data.cas_file_name ?? null,
      cas_file_url: data.cas_file_url ?? null,
      status: "new",
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
    const finalLimit = Math.min(Math.max(Number(limit) || 10, 1), 200);

    const enquiries = await PortfolioReviewEnquiry.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(finalLimit);

    const total = await PortfolioReviewEnquiry.countDocuments(finalFilter);

    return { enquiries, total };
  },

  softDelete: async (id: string) => {
    return PortfolioReviewEnquiry.findByIdAndUpdate(
      id,
      { is_active: 0, updated_at: new Date() },
      { new: true },
    );
  },
};
