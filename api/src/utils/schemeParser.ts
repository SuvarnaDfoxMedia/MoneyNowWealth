export const parseSchemeTitle = (schemeName: string) => {
  let clean = String(schemeName || "").trim();

  let planType: "Direct" | "Regular" | "" = "";
  let optionType: "Growth" | "IDCW" | "" = "";

  // Extract Plan Type
  const planRegex = /\b(Direct|Regular)(?:\s*Plan)?\b/i;
  const planMatch = planRegex.exec(clean);
  if (planMatch) {
    planType = planMatch[1].toLowerCase() === "direct" ? "Direct" : "Regular";
    clean = clean.replace(planMatch[0], "");
  }

  // Extract Option Type
  const optionRegex = /\b(Growth|IDCW|Dividend|Payout|Reinvestment)(?:\s*(?:Option|Plan))?\b/i;
  const optionMatch = optionRegex.exec(clean);
  if (optionMatch) {
    const opt = optionMatch[1].toLowerCase();
    optionType = (opt === "idcw" || opt === "dividend" || opt === "payout" || opt === "reinvestment") ? "IDCW" : "Growth";
    clean = clean.replace(optionMatch[0], "");
  }

  // Clean up dangling hyphens or extra spaces
  clean = clean.replace(/(\s*-\s*)+$/g, "").replace(/\s+/g, " ").trim();
  
  // also handle hyphens left in between due to replacements
  // e.g. "HDFC Fund - - Direct" replaced to "HDFC Fund - "
  clean = clean.replace(/\s*-\s*-\s*/g, " - ").trim();
  // do one final trailing hyphen check just in case
  clean = clean.replace(/(\s*-\s*)+$/g, "").trim();

  return {
    baseName: clean || schemeName,
    planType,
    optionType,
  };
};
