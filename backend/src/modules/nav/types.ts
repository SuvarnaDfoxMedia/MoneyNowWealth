export type NavHistoryItem = {
  _id: string;
  schemeId: string;
  date: string;
  nav: number;
  totalAssets: number;
  totalLiabilities: number;
  totalUnits: number;
};

export type NavScheme = {
  _id: string;
  scheme_code?: string;
  isin?: string;
  fund_name: string;
  amc_id?: {
    _id?: string;
    name?: string;
  };
  latestNav: number;
  latestDate: string;
  navCount: number;
};

export type LatestNavResponse = {
  latest: NavHistoryItem | null;
  previous: NavHistoryItem | null;
  change: number | null;
};

export type ReturnValue = {
  value: number | null;
  currentNav: number | null;
  pastNav: number | null;
  currentDate: string | null;
  pastDate: string | null;
  missingReason?: string;
};

export type ReturnsResponse = {
  d1: ReturnValue;
  m1: ReturnValue;
  m3: ReturnValue;
  m6: ReturnValue;
  y1: ReturnValue;
  y5: ReturnValue;
  y10: ReturnValue;
};

export type UploadReport = {
  success: boolean;
  fileName: string;
  validateOnly?: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  rejected: number;
  errors: Array<{
    row: number;
    message: string;
    identifier?: string;
  }>;
};
