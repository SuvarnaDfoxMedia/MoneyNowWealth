import { getResponseEmailService } from "./getResponseEmailService";
import type { ContentEmailData } from "../emails/types";

export const addContactToGetResponse = async (email: string) => {
  return getResponseEmailService.addContact(email);
};

type BlogNotificationPayload = ContentEmailData;

export const sendBlogNotificationViaGetResponse = async (
  to: string,
  data: BlogNotificationPayload,
) => {
  return getResponseEmailService.sendBlogNotification(to, data);
};
