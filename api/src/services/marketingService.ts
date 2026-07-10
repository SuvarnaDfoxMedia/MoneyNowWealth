import axios from "axios";
import { getGetResponseConfig } from "../config/emailEnv";

interface GetResponseContactInput {
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
    | "start_investing"
    | "portfolio_review"
    | "register";
}

class MarketingService {
  private get config() {
    return getGetResponseConfig();
  }

  private get headers() {
    return {
      "X-Auth-Token": `api-key ${this.config.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private get contactEndpoint() {
    return `${this.config.apiBase}/contacts`;
  }

  private buildLookupParams(email: string, campaignId: string) {
    return {
      query: {
        email,
        campaignId,
        perPage: 20,
      },
      headers: this.headers,
    };
  }

  private resolveCampaignId(source?: GetResponseContactInput["source"]) {
    if (!source) {
      return this.config.campaignId;
    }

    return this.config.sourceCampaignIds[source] || this.config.campaignId;
  }

  private resolveCampaignName(source?: GetResponseContactInput["source"]) {
    const names: Record<NonNullable<GetResponseContactInput["source"]>, string> = {
      newsletter: "Newsletter",
      contact_enquiry: "Contact Enquiry",
      partner_enquiry: "Partner Enquiry",
      one_crore_journey: "One Crore Journey",
      who_we_work_with: "Who We Work With",
      financial_assessment: "Financial Assessment",
      start_investing: "Start Investing",
      portfolio_review: "Portfolio Review",
      register: "Register User List",
    };

    if (!source) {
      return "Default";
    }

    return names[source] || "Default";
  }

  private buildCustomFieldValues({
    mobile,
    city,
    contactPurpose,
  }: Pick<GetResponseContactInput, "mobile" | "city" | "contactPurpose">) {
    const customFieldValues: Array<{
      customFieldId: string;
      value: string[];
    }> = [];

    const normalizedMobile = mobile?.trim();
    const normalizedCity = city?.trim();
    const normalizedContactPurpose = contactPurpose?.trim();

    if (normalizedMobile && this.config.mobileCustomFieldId) {
      customFieldValues.push({
        customFieldId: this.config.mobileCustomFieldId,
        value: [normalizedMobile],
      });
    }

    if (normalizedCity && this.config.cityCustomFieldId) {
      customFieldValues.push({
        customFieldId: this.config.cityCustomFieldId,
        value: [normalizedCity],
      });
    }

    if (
      normalizedContactPurpose &&
      this.config.contactPurposeCustomFieldId
    ) {
      customFieldValues.push({
        customFieldId: this.config.contactPurposeCustomFieldId,
        value: [normalizedContactPurpose],
      });
    }

    return customFieldValues;
  }

  private isDuplicateContactError(error: any): boolean {
    return (
      error?.response?.status === 409 &&
      Number(error?.response?.data?.code) === 1008
    );
  }

  private async findContactsByEmail(email: string, campaignId: string) {
    const response = await axios.get<Array<Record<string, unknown>>>(
      this.contactEndpoint,
      this.buildLookupParams(email, campaignId),
    );

    return Array.isArray(response.data) ? response.data : [];
  }

  private findMatchingContact(
    email: string,
    campaignId: string,
    contacts: Array<Record<string, unknown>>,
  ) {
    return contacts.find((contact) => {
      const contactCampaignId =
        typeof contact?.campaign === "object" && contact?.campaign
          ? String((contact.campaign as Record<string, unknown>).campaignId || "")
          : "";

      const contactEmail = String(contact?.email || "").trim().toLowerCase();

      return contactEmail === email && contactCampaignId === campaignId;
    });
  }

  private async updateExistingContact(
    contactId: string,
    payload: Record<string, unknown>,
  ) {
    return axios.post(`${this.contactEndpoint}/${contactId}`, payload, {
      headers: this.headers,
    });
  }

  private logVerifiedContacts(
    email: string,
    source: GetResponseContactInput["source"] | undefined,
    campaignId: string,
    campaignName: string,
    contacts: Array<Record<string, unknown>>,
  ) {
    const matchedContacts = contacts.filter((contact) => {
      const contactCampaignId =
        typeof contact?.campaign === "object" && contact?.campaign
          ? String((contact.campaign as Record<string, unknown>).campaignId || "")
          : "";

      const contactEmail = String(contact?.email || "").trim().toLowerCase();

      return contactEmail === email && contactCampaignId === campaignId;
    });

    if (matchedContacts.length === 0) {
      console.log(
        `MARKETING_CONTACT_VERIFY_PENDING provider=getresponse email=${email} source=${source || "default"} campaignId=${campaignId} campaignName="${campaignName}" matched=0`,
      );
      return;
    }

    for (const contact of matchedContacts) {
      const contactId = String(contact.contactId || "unknown");
      const name = String(contact.name || "");
      const origin = String(contact.origin || "unknown");
      const dayOfCycle =
        contact.dayOfCycle === null || contact.dayOfCycle === undefined
          ? "null"
          : String(contact.dayOfCycle);

      console.log(
        `MARKETING_CONTACT_VERIFIED provider=getresponse email=${email} source=${source || "default"} campaignId=${campaignId} campaignName="${campaignName}" contactId=${contactId} name="${name}" origin=${origin} dayOfCycle=${dayOfCycle}`,
      );
    }
  }

  async addContactToCampaign(input: string | GetResponseContactInput): Promise<void> {
    const payloadInput =
      typeof input === "string" ? { email: input } : input;
    const email = payloadInput.email.trim().toLowerCase();
    const name = payloadInput.name?.trim();
    const customFieldValues = this.buildCustomFieldValues(payloadInput);
    const campaignId = this.resolveCampaignId(payloadInput.source);
    const campaignName = this.resolveCampaignName(payloadInput.source);

    try {
      const payload: Record<string, unknown> = {
        email,
        campaign: { campaignId },
      };

      if (name) {
        payload.name = name;
      }

      if (customFieldValues.length > 0) {
        payload.customFieldValues = customFieldValues;
      }

      const response = await axios.post<{ contactId?: string }>(
        this.contactEndpoint,
        payload,
        { headers: this.headers },
      );
      const status = response.status;
      const contactId = response.data?.contactId || "unknown";

      if (status === 202) {
        console.log(
          `MARKETING_CONTACT_ACCEPTED provider=getresponse email=${email} source=${payloadInput.source || "default"} campaignId=${campaignId} campaignName="${campaignName}" status=${status} contactId=${contactId} customFields=${customFieldValues.length}`,
        );
        try {
          const contacts = await this.findContactsByEmail(email, campaignId);
          this.logVerifiedContacts(
            email,
            payloadInput.source,
            campaignId,
            campaignName,
            contacts,
          );
        } catch (lookupError: any) {
          console.error(
            `MARKETING_CONTACT_VERIFY_FAILED provider=getresponse email=${email} source=${payloadInput.source || "default"} campaignId=${campaignId} campaignName="${campaignName}"`,
            lookupError?.response?.data || lookupError?.message || lookupError,
          );
        }
        return;
      }

      console.log(
        `MARKETING_CONTACT_SYNCED provider=getresponse email=${email} source=${payloadInput.source || "default"} campaignId=${campaignId} campaignName="${campaignName}" status=${status} contactId=${contactId} customFields=${customFieldValues.length}`,
      );
    } catch (error: any) {
      if (this.isDuplicateContactError(error)) {
        try {
          const contacts = await this.findContactsByEmail(email, campaignId);
          const matchingContact = this.findMatchingContact(email, campaignId, contacts);
          const contactId = String(matchingContact?.contactId || "");

          if (!contactId) {
            console.log(
              `MARKETING_CONTACT_EXISTS provider=getresponse email=${email} source=${payloadInput.source || "default"} campaignId=${campaignId} campaignName="${campaignName}"`,
            );
            return;
          }

          const updatePayload: Record<string, unknown> = {};

          if (name) {
            updatePayload.name = name;
          }

          if (customFieldValues.length > 0) {
            updatePayload.customFieldValues = customFieldValues;
          }

          if (Object.keys(updatePayload).length > 0) {
            await this.updateExistingContact(contactId, updatePayload);
          }

          console.log(
            `MARKETING_CONTACT_UPDATED provider=getresponse email=${email} source=${payloadInput.source || "default"} campaignId=${campaignId} campaignName="${campaignName}" contactId=${contactId} customFields=${customFieldValues.length}`,
          );
          return;
        } catch (lookupError: any) {
          console.error(
            `MARKETING_CONTACT_UPDATE_FAILED provider=getresponse email=${email} source=${payloadInput.source || "default"} campaignId=${campaignId} campaignName="${campaignName}"`,
            lookupError?.response?.data || lookupError?.message || lookupError,
          );
          throw lookupError;
        }
      }

      console.error(
        `MARKETING_CONTACT_SYNC_FAILED provider=getresponse email=${email} source=${payloadInput.source || "default"} campaignId=${campaignId} campaignName="${campaignName}"`,
        error?.response?.data || error?.message || error,
      );
      throw error;
    }
  }
}

export { MarketingService };
export const marketingService = new MarketingService();
