export const goalOptions = [
  "Emergency fund",
  "Child education",
  "Retirement planning",
  "Home purchase",
  "Wealth creation",
  "Tax-efficient investing",
] as const;

export const pillarLabels = [
  {
    key: "savings_score",
    label: "Savings discipline",
    description: "How well your monthly cash flow supports resilience.",
  },
  {
    key: "investment_score",
    label: "Investment readiness",
    description: "Whether current investing levels match long-term goals.",
  },
  {
    key: "protection_score",
    label: "Protection layer",
    description: "Insurance and downside protection readiness.",
  },
  {
    key: "distribution_score",
    label: "Future planning",
    description: "Retirement and wealth-transfer preparedness.",
  },
] as const;

export const trustHighlights = [
  "Quick self-check with practical recommendations",
  "Personalized score, category, and four-pillar report",
  "Downloadable report to review with an advisor",
] as const;
