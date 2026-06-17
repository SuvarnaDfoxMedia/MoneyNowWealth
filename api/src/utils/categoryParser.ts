export const parseCategoryPath = (rawCategory: string): {
  mainCategoryName: string;
  categoryName: string;
} => {
  const clean = String(rawCategory || "").trim();
  if (!clean) {
    return { mainCategoryName: "Uncategorized", categoryName: "Uncategorized" };
  }

  // Format: "Equity: Sectoral-Banking and Financial Services"
  if (clean.includes(":")) {
    const colonIdx = clean.indexOf(":");
    const mainRaw = clean.slice(0, colonIdx).trim();
    const subRaw  = clean.slice(colonIdx + 1).trim();
    return {
      mainCategoryName: mainRaw || "Uncategorized",
      categoryName:     subRaw  || mainRaw || "Uncategorized",
    };
  }

  // Format: "Fund of Funds-Domestic-Silver" — treat entire string as both main and sub
  return {
    mainCategoryName: clean,
    categoryName:     clean,
  };
};
