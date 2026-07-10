import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  StartInvestingEnquiry,
  type IStartInvestingEnquiry,
} from "../models/startInvestingEnquiryModel";
import type { SortOrder } from "mongoose";

interface GetAllParams {
  filter?: Record<string, unknown>;
  skip?: number;
  limit?: number;
  sort?: Record<string, SortOrder>;
}

export const startInvestingEnquiryService = {
  add: async (data: Partial<IStartInvestingEnquiry>) => {
    if (
      !data.full_name ||
      !data.email ||
      !data.mobile ||
      !data.country_code ||
      !data.goal
    ) {
      throw new Error("All required contact and goal fields must be provided");
    }

    const email = data.email.trim().toLowerCase();
    const fullNumber = `${data.country_code}${data.mobile}`;
    const phoneNumber = parsePhoneNumberFromString(fullNumber);

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Invalid phone number");
    }

    const enquiry = new StartInvestingEnquiry({
      full_name: data.full_name.trim().replace(/\s+/g, " "),
      email,
      mobile: phoneNumber.nationalNumber.toString(),
      country_code: `+${phoneNumber.countryCallingCode}`,
      goal: data.goal,
      calculator_type: data.calculator_type ?? null,
      calculator_inputs: data.calculator_inputs ?? null,
      calculator_result: data.calculator_result ?? null,
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

    const enquiries = await StartInvestingEnquiry.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(finalLimit);

    const total = await StartInvestingEnquiry.countDocuments(finalFilter);

    return { enquiries, total };
  },

  softDelete: async (id: string) => {
    return StartInvestingEnquiry.findByIdAndUpdate(
      id,
      { is_active: 0, updated_at: new Date() },
      { new: true },
    );
  },
};
