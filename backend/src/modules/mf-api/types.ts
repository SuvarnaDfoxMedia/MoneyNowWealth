export type MfApiTrailingReturns = {
  "1w"?: number | null;
  "1m"?: number | null;
  "3m"?: number | null;
  "6m"?: number | null;
  "1y"?: number | null;
  "2y"?: number | null;
  "3y"?: number | null;
  "5y"?: number | null;
  "10y"?: number | null;
  since_launch?: number | null;
  inception_year_return?: number | null;
  ytd?: number | null;
  ytd_return?: number | null;
  d1?: number | null;
};

export type MfApiScheme = {
  _id: string;
  schemeName?: string;
  scheme_name?: string;
  amcName?: string;
  amc_name?: string;
  schemeCode?: string;
  scheme_code?: string;
  isin?: string;
  isin_no?: string;
  planType?: string;
  plan_type?: string;
  optionType?: string;
  option_type?: string;
  category?: string;
  scheme_category?: string;
  subCategory?: string;
  sub_category?: string;
  latestNav?: number | string | null;
  latest_nav?: number | null;
  latestDate?: string | null;
  latest_date?: string | null;
  nav?: number | null;
  nav_date?: string | null;
  scheme_benchmark?: string;
  scheme_assets?: number | null;
  scheme_asset_date?: string | null;
  scheme_manager?: string;
  riskometer_value?: string | null;
  scheme_objective?: string;
  scheme_inception_date?: string | null;
  scheme_inception_return?: number | null;
  expense_ratio_percentage?: number | null;
  expense_ratio_date?: string | null;
  scheme_status?: string;
  minimum_investment?: number | null;
  minimum_topup?: number | null;
  sip_minimum_amount?: number | null;
  scheme_turnover?: number | null;
  upmarket_capture_ratio?: number | null;
  downmarket_capture_ratio?: number | null;
  market_cap_largecap_percent?: number | null;
  market_cap_midcap_percent?: number | null;
  market_cap_smallcap_percent?: number | null;
  scheme_performance_list?: unknown[];
  risk_statistics_list?: unknown[];
  scheme_peer_comparision_list?: unknown[];
  lastSyncedAt?: string | null;
  last_synced_at?: string | null;
  last_sync_error?: string;
  syncStatus?: string;
  sync_status?: string;
  rawPayload?: unknown;
  raw_payload?: unknown;
  is_active?: boolean;
  is_new?: boolean;
  first_seen_date?: string | null;
  // ─── Structured extracted fields ──────────────────────────────────────────
  trailing_returns?: MfApiTrailingReturns;
  annual_returns?: {
    ytd?: number | null;
    ytd_return?: number | null;
    yearly_returns?: Record<string, number | null>;
  };
  benchmark_returns?: MfApiTrailingReturns & { benchmark_name?: string };
  category_avg_returns?: MfApiTrailingReturns & { category_name?: string };
  risk_metrics?: {
    volatility_3y?: number | null;
    std_dev_3y?: number | null;
    std_dev_5y?: number | null;
    sharpe_3y?: number | null;
    sharpe_5y?: number | null;
    alpha_1y?: number | null;
    alpha_3y?: number | null;
    alpha_5y?: number | null;
    beta_1y?: number | null;
    beta_3y?: number | null;
    beta_5y?: number | null;
    sortino?: number | null;
    max_drawdown_5y?: number | null;
    max_drawdown_10y?: number | null;
    turnover_ratio?: number | null;
    yield_to_maturity?: number | null;
    average_maturity?: number | null;
  };
  market_cap?: {
    large_cap_pct?: number | null;
    mid_cap_pct?: number | null;
    small_cap_pct?: number | null;
  };
  nav_change?: number | null;
  nav_change_percentage?: number | null;
};

export type MfApiSchemeDetail = MfApiScheme & {
  latestInfo?: unknown;
  syncHistory?: MfApiSyncLog[];
  linked_manual_fund?: {
    _id: string;
    fund_name: string;
    nav_Current?: number | null;
    nav_date?: string | null;
    mf_api_synced_at?: string | null;
    is_active?: number;
  } | null;
};

export type MfApiSyncLog = {
  _id: string;
  action?: string;
  schemeId?: string;
  scheme_id?: string;
  schemeName?: string;
  scheme_name?: string;
  status?: "success" | "failed" | "running" | "queued" | string;
  message?: string;
  error?: string;
  createdAt?: string;     // alias — may be present if server serialises differently
  updatedAt?: string;     // alias
  created_at?: string;    // actual DB field (timestamps: { createdAt: "created_at" })
  updated_at?: string;    // actual DB field
  payload?: unknown;
  response?: Record<string, unknown> | null;
};

export type MfApiDashboardSummary = {
  totalSchemes?: number;
  activeSchemes?: number;
  inactiveSchemes?: number;
  newSchemes?: number;
  syncedSchemes?: number;
  failedSchemes?: number;
  pendingSchemes?: number;
  lastSyncAt?: string | null;
  lastImportAt?: string | null;
  lastExportAt?: string | null;
  lastSyncMessage?: string;
  runningMessage?: string;
  latestSyncJob?: {
    status?: string;
    message?: string;
    response?: {
      total?: number;
      active?: number;
      inactive?: number;
      processed?: number;
      errors?: number;
      phase?: string;
    } | null;
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
  recentSchemes?: MfApiScheme[];
  recentLogs?: MfApiSyncLog[];
  raw?: unknown;
  bridgedFunds?: number;
  activeBridgedFunds?: number;
};

export type MfApiImportReport = {
  success: boolean;
  message: string;
  totalRows?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  rejected?: number;
  activated?: number;
  deactivated?: number;
  syncFailed?: number;
  syncPartial?: number;
  validateOnly?: boolean;
  fileName?: string;
  errors?: Array<{ row: number; field: string; message: string }>;
  bridgeFailed?: Array<{
    scheme_code: string;
    scheme_name: string;
    reason: string;
  }>;
};

export type MfApiSyncResult = {
  success?: boolean;
  message?: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
  total?: number;
  data?: unknown;
};

export type MfApiListResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T[];
  total?: number;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
};

export type MfApiNavHistoryEntry = {
  _id: string;
  date: string;
  nav: number;
  nav_change?: number | null;
  nav_change_pct?: number | null;
};

export type MfApiTopHoldingEntry = {
  name?: string;
  net_assets_pct?: number | null;
  market_value?: number | null;
  sector?: string;
  security_type?: string;
  maturity?: string;
  credit_quality_india?: string;
  country?: string;
};

export type MfApiTopHolding = {
  _id: string;
  mf_api_scheme_id?: string;
  external_key?: string;
  scheme_name?: string;
  portfolio_date?: string | null;
  prev_portfolio_date?: string | null;
  holdings_count: number;
  stock_holdings?: number | null;
  bond_holdings?: number | null;
  assets_top_10_holdings_pct?: number | null;
  turnover_pct?: number | null;
  asset_allocation?: {
    domestic_equity_pct?: number | null;
    international_equity_pct?: number | null;
    debt_pct?: number | null;
    other_pct?: number | null;
    gold_pct?: number | null;
    cash_pct?: number | null;
  };
  market_cap_allocation?: {
    large_cap_pct?: number | null;
    mid_cap_pct?: number | null;
    small_cap_pct?: number | null;
  };
  snapshot_month?: number | null;
  snapshot_year?: number | null;
  holdings: MfApiTopHoldingEntry[];
  is_latest?: boolean;
  upload_batch_id?: string;
  uploaded_at?: string;
};
