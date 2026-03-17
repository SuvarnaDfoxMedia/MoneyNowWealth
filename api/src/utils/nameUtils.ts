const normalizeSpaces = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

export const capitalizeWords = (name: string): string => {
  const normalized = normalizeSpaces(name);
  if (!normalized) return "";

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const splitFullName = (
  fullName: string,
): { firstname: string; lastname: string } => {
  const normalized = normalizeSpaces(fullName);
  if (!normalized) return { firstname: "", lastname: "" };

  const parts = normalized.split(" ").filter(Boolean);
  const firstname = capitalizeWords(parts[0] || "");
  const lastname = capitalizeWords(parts.slice(1).join(" "));

  return { firstname, lastname };
};
