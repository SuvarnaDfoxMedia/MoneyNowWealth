const parsePort = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("SMTP_PORT must be a valid positive number");
  }

  return parsed;
};

export const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP configuration missing. Ensure SMTP_HOST, SMTP_USER, and SMTP_PASS are set.",
    );
  }

  return {
    host,
    port: parsePort(process.env.SMTP_PORT?.trim(), 587),
    user,
    pass,
  };
};

export const getGetResponseConfig = () => {
  const apiBase =
    process.env.GETRESPONSE_API_BASE?.trim() || "https://api.getresponse.com/v3";
  const apiKey = process.env.GETRESPONSE_API_KEY?.trim();
  const campaignId = process.env.GETRESPONSE_CAMPAIGN_ID?.trim();
  const mobileCustomFieldId =
    process.env.GETRESPONSE_CUSTOM_FIELD_ID_MOBILE?.trim() || "";
  const cityCustomFieldId =
    process.env.GETRESPONSE_CUSTOM_FIELD_ID_CITY?.trim() || "";
  const contactPurposeCustomFieldId =
    process.env.GETRESPONSE_CUSTOM_FIELD_ID_CONTACT_PURPOSE?.trim() || "ngSUly";

  if (!apiKey || !campaignId) {
    throw new Error(
      "GetResponse configuration missing. Ensure GETRESPONSE_API_KEY and GETRESPONSE_CAMPAIGN_ID are set.",
    );
  }

  return {
    apiBase,
    apiKey,
    campaignId,
    mobileCustomFieldId,
    cityCustomFieldId,
    contactPurposeCustomFieldId,
    sourceCampaignIds: {
      newsletter:
        process.env.GETRESPONSE_CAMPAIGN_ID_NEWSLETTER?.trim() || campaignId,
      contact_enquiry:
        process.env.GETRESPONSE_CAMPAIGN_ID_CONTACT_ENQUIRY?.trim() || "CJ5cv",
      register:
        process.env.GETRESPONSE_CAMPAIGN_ID_REGISTER?.trim() || "CJ5pF",
      who_we_work_with:
        process.env.GETRESPONSE_CAMPAIGN_ID_WHO_WE_WORK_WITH?.trim() || "CJ58b",
      one_crore_journey:
        process.env.GETRESPONSE_CAMPAIGN_ID_ONE_CRORE_JOURNEY?.trim() || "CJ5a5",
      partner_enquiry:
        process.env.GETRESPONSE_CAMPAIGN_ID_PARTNER_ENQUIRY?.trim() || "CJ540",
    },
  };
};

export const validateEmailEnvironment = () => {
  getSmtpConfig();
  getGetResponseConfig();
};
