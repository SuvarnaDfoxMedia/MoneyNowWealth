const KNOWN_MAIN_CATEGORIES = [
  "equity",
  "debt",
  "hybrid",
  "solution oriented",
  "other",
  "others",
  "fund of funds",
  "fof",
  "commodity",
  "commodities",
  "alternative",
  "alternatives",
  "cash",
  "money market"
];

export const parseCategoryPath = (rawCategory: string): {
  mainCategoryName: string;
  categoryName: string;
} => {
  const clean = String(rawCategory || "").trim();
  if (!clean) {
    return { mainCategoryName: "Uncategorized", categoryName: "Uncategorized" };
  }

  // Format 1: "Equity: Sectoral-Banking and Financial Services"
  if (clean.includes(":")) {
    const colonIdx = clean.indexOf(":");
    const mainRaw = clean.slice(0, colonIdx).trim();
    const subRaw  = clean.slice(colonIdx + 1).trim();
    return {
      mainCategoryName: mainRaw || "Uncategorized",
      categoryName:     subRaw  || mainRaw || "Uncategorized",
    };
  }

  // Format 2: "Fund of Funds-Domestic-Silver" -> main="Fund of Funds", sub="Domestic-Silver"
  if (clean.includes("-")) {
    const hyphenIdx = clean.indexOf("-");
    const mainRaw = clean.slice(0, hyphenIdx).trim();
    const subRaw  = clean.slice(hyphenIdx + 1).trim();
    if (KNOWN_MAIN_CATEGORIES.includes(mainRaw.toLowerCase())) {
      return {
        mainCategoryName: mainRaw || "Uncategorized",
        categoryName:     subRaw  || mainRaw || "Uncategorized",
      };
    }
  }

  // Fallback: treat entire string as both main and sub
  return {
    mainCategoryName: clean,
    categoryName:     clean,
  };
};
