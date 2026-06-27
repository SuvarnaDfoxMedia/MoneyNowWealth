import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  WhoWeWorkWithEnquiry,
  type IWhoWeWorkWithEnquiry,
} from "../models/whoWeWorkWithEnquiryModel";
import type { SortOrder } from "mongoose";

interface GetAllParams {
  filter?: Record<string, unknown>;
  skip?: number;
  limit?: number;
  sort?: Record<string, SortOrder>;
}

export const whoWeWorkWithEnquiryService = {
  add: async (data: Partial<IWhoWeWorkWithEnquiry>) => {
    if (
      !data.full_name ||
      !data.email ||
      !data.mobile ||
      !data.country_code ||
      !data.preference ||
      !data.persona_id ||
      !data.persona_label
    ) {
      throw new Error("All required persona enquiry fields must be provided");
    }

    const email = data.email.trim().toLowerCase();
    const fullNumber = `${data.country_code}${data.mobile}`;
    const phoneNumber = parsePhoneNumberFromString(fullNumber);

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error("Invalid phone number");
    }

    const enquiry = new WhoWeWorkWithEnquiry({
      full_name: data.full_name.trim().replace(/\s+/g, " "),
      email,
      mobile: phoneNumber.nationalNumber.toString(),
      country_code: `+${phoneNumber.countryCallingCode}`,
      preference: data.preference.trim(),
      persona_id: data.persona_id.trim(),
      persona_label: data.persona_label.trim(),
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

    const enquiries = await WhoWeWorkWithEnquiry.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(finalLimit);

    const total = await WhoWeWorkWithEnquiry.countDocuments(finalFilter);

    return { enquiries, total };
  },

  softDelete: async (id: string) => {
    return WhoWeWorkWithEnquiry.findByIdAndUpdate(
      id,
      { is_active: 0, updated_at: new Date() },
      { new: true },
    );
  },
};
