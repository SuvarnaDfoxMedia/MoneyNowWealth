import mongoose from "mongoose";
import { ContactEnquiry } from "../models/contactEnquiryModel";
import { PartnerEnquiry } from "../models/partnerEnquiryModel";
import { OneCroreJourneyEnquiry } from "../models/oneCroreJourneyEnquiryModel";
import { WhoWeWorkWithEnquiry } from "../models/whoWeWorkWithEnquiryModel";
import FinancialAssessment from "../models/financialAssessmentModel";

export const ENQUIRY_MODULES = [
  "contact-enquiries",
  "partner-enquiries",
  "one-crore-journey-enquiries",
  "who-we-work-with-enquiries",
  "financial-wellness-enquiries",
] as const;

export type EnquiryModule = (typeof ENQUIRY_MODULES)[number];

type EnquiryModel = {
  countDocuments: (filter: Record<string, unknown>) => Promise<number>;
  updateMany: (
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ) => Promise<unknown>;
};

const enquiryModels: Record<EnquiryModule, EnquiryModel> = {
  "contact-enquiries": ContactEnquiry,
  "partner-enquiries": PartnerEnquiry,
  "one-crore-journey-enquiries": OneCroreJourneyEnquiry,
  "who-we-work-with-enquiries": WhoWeWorkWithEnquiry,
  "financial-wellness-enquiries": FinancialAssessment,
};

const getUnreadFilter = (
  module: EnquiryModule,
  userId: mongoose.Types.ObjectId,
) => {
  const baseReadFilter = {
    readBy: {
      $not: {
        $elemMatch: { userId },
      },
    },
  };

  if (module === "financial-wellness-enquiries") {
    return {
      ...baseReadFilter,
      is_active: true,
      is_deleted: false,
      assessment_variant: "money_life_check",
      lead_source: { $regex: "^financial_wellness_enquiry$", $options: "i" },
    };
  }

  return {
    ...baseReadFilter,
    is_active: 1,
  };
};

const resolveModules = (modules?: string[], markAll?: boolean): EnquiryModule[] => {
  if (markAll || !modules?.length) {
    return [...ENQUIRY_MODULES];
  }

  const validModules = modules.filter((module): module is EnquiryModule =>
    ENQUIRY_MODULES.includes(module as EnquiryModule),
  );

  if (!validModules.length) {
    throw new Error("Invalid enquiry modules");
  }

  return validModules;
};

const getUnreadCountsForUser = async (userId: string) => {
  const objectId = new mongoose.Types.ObjectId(userId);

  const countEntries = await Promise.all(
    ENQUIRY_MODULES.map(async (module) => {
      const count = await enquiryModels[module].countDocuments(
        getUnreadFilter(module, objectId),
      );
      return [module, count] as const;
    }),
  );

  const counts = countEntries.reduce<Record<EnquiryModule, number>>(
    (acc, [module, count]) => {
      acc[module] = count;
      return acc;
    },
    {
      "contact-enquiries": 0,
      "partner-enquiries": 0,
      "one-crore-journey-enquiries": 0,
      "who-we-work-with-enquiries": 0,
      "financial-wellness-enquiries": 0,
    },
  );

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return { total, counts };
};

export const enquiryUnreadService = {
  resolveModules,

  getUnreadCounts: getUnreadCountsForUser,

  markAsRead: async (userId: string, modules?: string[], markAll?: boolean) => {
    const objectId = new mongoose.Types.ObjectId(userId);
    const selectedModules = resolveModules(modules, markAll);
    const readAt = new Date();

    await Promise.all(
      selectedModules.map((module) =>
        enquiryModels[module].updateMany(getUnreadFilter(module, objectId), {
          $push: {
            readBy: {
              userId: objectId,
              readAt,
            },
          },
          $set: {
            updated_at: readAt,
          },
        }),
      ),
    );

    return getUnreadCountsForUser(userId);
  },
};

export default enquiryUnreadService;
