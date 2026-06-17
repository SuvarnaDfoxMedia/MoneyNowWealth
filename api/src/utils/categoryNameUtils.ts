/**
 * Utilities for normalizing category names:
 * capitalizing words, trimming punctuation, and collapsing extra spaces.
 * Separated from categoryParser.ts so the parser can be kept lightweight.
 */

const normalizeSpacing = (value: string) => {
  return value
    .replace(/\s*-\s*/g, "-") // "Sectoral - Banking" -> "Sectoral-Banking"
    .replace(/\s*:\s*/g, ":") // "Equity : Sectoral" -> "Equity:Sectoral"
    .replace(/\s+/g, " ")
    .trim();
};

const capitalizeWords = (value: string) => {
  return value
    .split(/([-\s:])/) // Split by hyphen, space, or colon, keeping delimiters
    .map(part => {
      if (!part || /[-\s:]/.test(part)) return part;
      if (["of", "and", "the", "in", "for"].includes(part.toLowerCase())) return part.toLowerCase();
      // Preserve known abbreviations
      if (part.toUpperCase() === "PSU") return "PSU";
      if (part.toUpperCase() === "ETF") return "ETF";
      if (part.toUpperCase() === "ETFS") return "ETFs";
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
};

export const normalizeCategoryName = (name: string) => {
  if (!name) return "Uncategorized";
  let clean = normalizeSpacing(name);
  clean = capitalizeWords(clean);
  clean = clean.replace(/^[-:]+|[-:]+$/g, "").trim();
  return clean || "Uncategorized";
};
