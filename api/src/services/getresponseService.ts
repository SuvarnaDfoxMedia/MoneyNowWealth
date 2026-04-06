import { marketingService } from "./marketingService";

export const addContactToGetResponse = async (email: string) => {
  return marketingService.addContactToCampaign(email);
};

export const syncLeadToGetResponse = async (payload: {
  email: string;
  name?: string;
  mobile?: string;
  city?: string;
  contactPurpose?: string;
  source?:
    | "newsletter"
    | "contact_enquiry"
    | "partner_enquiry"
    | "one_crore_journey"
    | "who_we_work_with"
    | "financial_assessment"
    | "register";
}) => {
  return marketingService.addContactToCampaign(payload);
};
