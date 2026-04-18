export interface MutualFundCategory {
  id: string;
  label: string;
  title: string;
  description: string;
  indexReference: string;
}

export interface MutualFundType {
  id: string;
  categoryId: string;
  label: string;
}

export interface MutualFundRow {
  id: string;
  categoryId: string;
  fundTypeId: string;
  fundName: string;
  returns: {
    threeYear: string;
    fiveYear: string;
    tenYear: string;
  };
}

export interface PopularFundCard {
  id: string;
  title: string;
  subtitle: string;
  cagr: string;
  riskLevel: "Low" | "Moderate" | "High";
}

export interface NewFundOffer {
  id: string;
  fundName: string;
  amc: string;
  category: string;
  openDate: string;
  closeDate: string;
}

export const categoryTabs = [
  { id: "categories", label: "Categories" },
  { id: "popular-funds", label: "Popular Funds" },
  { id: "new-fund-offers", label: "New Fund Offers" },
];

export const categories: MutualFundCategory[] = [
  {
    id: "equity-funds",
    label: "Equity Funds",
    title: "Equity Funds",
    description:
      "Equity funds invest primarily in shares of companies and are commonly used for long-term wealth creation. They include different strategies based on company size and investment style.",
    indexReference: "Index reference (TRI):",
  },
  {
    id: "hybrid-funds",
    label: "Hybrid Funds",
    title: "Hybrid Funds",
    description:
      "Hybrid funds combine equity and debt exposure to balance growth and stability across market cycles.",
    indexReference: "Index reference (TRI):",
  },
  {
    id: "debt-funds",
    label: "Debt Funds",
    title: "Debt Funds",
    description:
      "Debt funds invest in fixed-income instruments and are typically used for relatively stable returns and lower volatility.",
    indexReference: "Index reference (TRI):",
  },
  {
    id: "index-funds",
    label: "Index Funds",
    title: "Index Funds",
    description:
      "Index funds passively track benchmark indices with transparent holdings and low-cost portfolio management.",
    indexReference: "Index reference (TRI):",
  },
  {
    id: "tax-savings-funds-elss",
    label: "Tax-Savings funds (ELSS)",
    title: "Tax-Savings funds (ELSS)",
    description:
      "ELSS funds provide potential long-term growth while offering tax benefits under applicable sections.",
    indexReference: "Index reference (TRI):",
  },
];

export const fundTypes: MutualFundType[] = [
  { id: "large-cap", categoryId: "equity-funds", label: "Large Cap" },
  { id: "mid-cap", categoryId: "equity-funds", label: "Mid Cap" },
  { id: "flexi-multi-cap", categoryId: "equity-funds", label: "Flexi / Multi Cap" },
  { id: "aggressive-hybrid", categoryId: "hybrid-funds", label: "Aggressive Hybrid" },
  { id: "balanced-hybrid", categoryId: "hybrid-funds", label: "Balanced Hybrid" },
  { id: "corporate-bond", categoryId: "debt-funds", label: "Corporate Bond" },
  { id: "short-duration", categoryId: "debt-funds", label: "Short Duration" },
  { id: "nifty-50", categoryId: "index-funds", label: "Nifty 50" },
  { id: "sensex", categoryId: "index-funds", label: "Sensex" },
  { id: "elss", categoryId: "tax-savings-funds-elss", label: "ELSS" },
];

const baseEquityRows = Array.from({ length: 8 }, (_, index) => ({
  id: `equity-large-${index + 1}`,
  categoryId: "equity-funds",
  fundTypeId: "large-cap",
  fundName: "ICICI Prudential Large Cap Fund",
  returns: { threeYear: "22.98%", fiveYear: "22.98%", tenYear: "22.98%" },
}));

export const fundList: MutualFundRow[] = [
  ...baseEquityRows,
  {
    id: "equity-mid-1",
    categoryId: "equity-funds",
    fundTypeId: "mid-cap",
    fundName: "Nippon India Growth Fund",
    returns: { threeYear: "24.10%", fiveYear: "20.55%", tenYear: "18.20%" },
  },
  {
    id: "equity-flexi-1",
    categoryId: "equity-funds",
    fundTypeId: "flexi-multi-cap",
    fundName: "Parag Parikh Flexi Cap Fund",
    returns: { threeYear: "20.32%", fiveYear: "19.27%", tenYear: "17.88%" },
  },
  {
    id: "hybrid-1",
    categoryId: "hybrid-funds",
    fundTypeId: "aggressive-hybrid",
    fundName: "HDFC Hybrid Equity Fund",
    returns: { threeYear: "16.42%", fiveYear: "15.61%", tenYear: "14.35%" },
  },
  {
    id: "debt-1",
    categoryId: "debt-funds",
    fundTypeId: "corporate-bond",
    fundName: "SBI Corporate Bond Fund",
    returns: { threeYear: "7.25%", fiveYear: "7.89%", tenYear: "8.01%" },
  },
  {
    id: "index-1",
    categoryId: "index-funds",
    fundTypeId: "nifty-50",
    fundName: "UTI Nifty 50 Index Fund",
    returns: { threeYear: "18.12%", fiveYear: "17.06%", tenYear: "14.95%" },
  },
  {
    id: "elss-1",
    categoryId: "tax-savings-funds-elss",
    fundTypeId: "elss",
    fundName: "Mirae Asset Tax Saver Fund",
    returns: { threeYear: "19.43%", fiveYear: "18.11%", tenYear: "16.57%" },
  },
];

export const popularFunds: PopularFundCard[] = [
  {
    id: "pop-1",
    title: "ICICI Prudential Bluechip Fund",
    subtitle: "Large Cap Equity",
    cagr: "18.62%",
    riskLevel: "Moderate",
  },
  {
    id: "pop-2",
    title: "Parag Parikh Flexi Cap Fund",
    subtitle: "Flexi Cap Equity",
    cagr: "19.27%",
    riskLevel: "Moderate",
  },
  {
    id: "pop-3",
    title: "Axis Midcap Fund",
    subtitle: "Mid Cap Equity",
    cagr: "20.14%",
    riskLevel: "High",
  },
  {
    id: "pop-4",
    title: "Mirae Asset Tax Saver Fund",
    subtitle: "ELSS",
    cagr: "16.57%",
    riskLevel: "Moderate",
  },
];

export const newFundOffers: NewFundOffer[] = [
  {
    id: "nfo-1",
    fundName: "ABC Nifty 500 Index Fund",
    amc: "ABC Mutual Fund",
    category: "Index Fund",
    openDate: "10 Mar 2026",
    closeDate: "24 Mar 2026",
  },
  {
    id: "nfo-2",
    fundName: "XYZ Multi Asset Allocation Fund",
    amc: "XYZ Mutual Fund",
    category: "Hybrid Fund",
    openDate: "12 Mar 2026",
    closeDate: "26 Mar 2026",
  },
  {
    id: "nfo-3",
    fundName: "PQR India Opportunities Fund",
    amc: "PQR Mutual Fund",
    category: "Thematic Equity",
    openDate: "15 Mar 2026",
    closeDate: "29 Mar 2026",
  },
];
