export const getApiMessage = (err: any): string => {
  const data = err?.response?.data;

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  if (typeof err?.message === "string" && err.message.trim()) {
    return err.message.trim();
  }

  return "";
};

export const isDuplicateEntryMessage = (message: string): boolean =>
  /already exists|already present|duplicate|e11000/i.test(message);

export const toDuplicateFieldMessage = (
  message: string,
  fieldLabel: string,
): string =>
  isDuplicateEntryMessage(message) ? `${fieldLabel} already exists` : message;
