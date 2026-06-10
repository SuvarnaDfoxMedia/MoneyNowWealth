import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  OneCroreJourneyEnquiry,
  type IOneCroreJourneyEnquiry,
} from "../models/oneCroreJourneyEnquiryModel";
import type { SortOrder } from "mongoose";

interface GetAllParams {
  filter?: Record<string, unknown>;
  skip?: number;
  limit?: number;
  sort?: Record<string, SortOrder>;
}

export const oneCroreJourneyEnquiryService = {
  add: async (data: Partial<IOneCroreJourneyEnquiry>) => {
    if (
      !data.full_name ||
      !data.email ||
      !data.mobile ||
      !data.country_code ||
      typeof data.wealth_amount !== "number" ||
      typeof data.user_sip_capacity !== "number" ||
      typeof data.years !== "number" ||
      typeof data.expected_return !== "number" ||
      typeof data.inflation_rate !== "number" ||
      typeof data.required_sip !== "number" ||
      typeof data.invested_amount !== "number" ||
      typeof data.growth_amount !== "number" ||
      typeof data.target_wealth !== "number"
    ) {
      throw new Error("All required journey fields must be provided");
    }

    const email = data.email.trim().toLowerCase();
    const fullNumber = `${data.country_code}${data.mobile}`;
    const phoneNumber = parsePhoneNumberFromString(fullNumber);

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Invalid phone number");
    }

    const enquiry = new OneCroreJourneyEnquiry({
      full_name: data.full_name.trim().replace(/\s+/g, " "),
      email,
      mobile: phoneNumber.nationalNumber.toString(),
      country_code: `+${phoneNumber.countryCallingCode}`,
      wants_callback: Boolean(data.wants_callback),
      wealth_amount: data.wealth_amount,
      user_sip_capacity: data.user_sip_capacity,
      years: data.years,
      expected_return: data.expected_return,
      inflation_rate: data.inflation_rate,
      required_sip: data.required_sip,
      invested_amount: data.invested_amount,
      growth_amount: data.growth_amount,
      target_wealth: data.target_wealth,
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

    const enquiries = await OneCroreJourneyEnquiry.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await OneCroreJourneyEnquiry.countDocuments(finalFilter);

    return { enquiries, total };
  },

  softDelete: async (id: string) => {
    return OneCroreJourneyEnquiry.findByIdAndUpdate(
      id,
      { is_active: 0, updated_at: new Date() },
      { new: true },
    );
  },
};
