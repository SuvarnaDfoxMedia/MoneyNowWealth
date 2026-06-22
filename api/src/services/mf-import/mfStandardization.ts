export const MF_SHEET_NAMES = {
  MAIN_CATEGORIES: "Main_Categories",
  CATEGORIES: "Categories_Master",
  AMCS: "AMCs",
  FUNDS_POPULAR: "Popular_Funds",
  FUNDS_ALL: "Scheme_Details",
  BENCHMARKS: "Benchmarks",
  NFOS: "NFO_List",
  INDEX_SNAPSHOTS: "Index_Data",
  TOP_HOLDINGS: "Top_Holdings",
};

export const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : null, obj);
};

export type FieldParser = "string" | "number" | "boolean" | "date" | "boolean_number";

export interface FieldConfig {
  header: string; // The exact header string for Export
  dbPath: string; // The dotted Mongoose path for Import
  aliases: string[]; // Aliases used to recognize this column during Import
  parser: FieldParser;
  required?: boolean;
}

export const MF_ANNUAL_YEARS = [
  new Date().getFullYear() - 1,
  new Date().getFullYear() - 2,
  new Date().getFullYear() - 3,
  new Date().getFullYear() - 4,
  new Date().getFullYear() - 5,
];

// Helper to generate dynamic annual return fields
const generateAnnualReturns = (): FieldConfig[] => {
  return MF_ANNUAL_YEARS.map(year => ({
    header: String(year),
    dbPath: `returns.annual.yearly_returns.${year}`,
    aliases: [String(year)],
    parser: "number"
  }));
};

const generateCategoryAnnualReturns = (): FieldConfig[] => {
  return MF_ANNUAL_YEARS.map(year => ({
    header: `category_${year}`,
    dbPath: `annual_returns.${year}`,
    aliases: [`category_${year}`, String(year)],
    parser: "number"
  }));
};

export const STANDARDIZED_CONFIGS = {
  MAIN_CATEGORIES: [
    { header: "main_category_name", dbPath: "name", aliases: ["main_category_name", "main_category", "name", "type"], parser: "string", required: true },
    { header: "description", dbPath: "description", aliases: ["description"], parser: "string" },
    { header: "sort_order", dbPath: "sort_order", aliases: ["sort_order", "sortorder"], parser: "number" },
    { header: "is_active", dbPath: "is_active", aliases: ["is_active", "active"], parser: "boolean_number" }
  ] as FieldConfig[],

  CATEGORIES: [
    { header: "category_name", dbPath: "name", aliases: ["category_name", "category", "name"], parser: "string", required: true },
    { header: "main_category_name", dbPath: "mainCategoryName", aliases: ["main_category_name", "main_category", "type"], parser: "string", required: true },
    { header: "description", dbPath: "description", aliases: ["description"], parser: "string" },
    { header: "category_trailing_1w", dbPath: "category_average_returns.trailing.1w", aliases: ["category_trailing_1w", "1w"], parser: "number" },
    { header: "category_trailing_1m", dbPath: "category_average_returns.trailing.1m", aliases: ["category_trailing_1m", "1m"], parser: "number" },
    { header: "category_trailing_3m", dbPath: "category_average_returns.trailing.3m", aliases: ["category_trailing_3m", "3m"], parser: "number" },
    { header: "category_trailing_6m", dbPath: "category_average_returns.trailing.6m", aliases: ["category_trailing_6m", "6m"], parser: "number" },
    { header: "category_trailing_1y", dbPath: "category_average_returns.trailing.1y", aliases: ["category_trailing_1y", "1y"], parser: "number" },
    { header: "category_trailing_3y", dbPath: "category_average_returns.trailing.3y", aliases: ["category_trailing_3y", "3y"], parser: "number" },
    { header: "category_trailing_5y", dbPath: "category_average_returns.trailing.5y", aliases: ["category_trailing_5y", "5y"], parser: "number" },
    { header: "category_trailing_10y", dbPath: "category_average_returns.trailing.10y", aliases: ["category_trailing_10y", "10y"], parser: "number" },
    { header: "since_launch", dbPath: "category_average_returns.trailing.since_launch", aliases: ["since_launch"], parser: "number" },
    { header: "category_ytd", dbPath: "category_average_returns.trailing.ytd", aliases: ["category_ytd", "ytd"], parser: "number" },
    ...generateCategoryAnnualReturns(),
    { header: "risk_level", dbPath: "risk_level", aliases: ["risk_level", "risk"], parser: "string" },
    { header: "suggested_use_case", dbPath: "suggested_use_case", aliases: ["suggested_use_case"], parser: "string" },
    { header: "suggested_use_case_note", dbPath: "suggested_use_case_note", aliases: ["suggested_use_case_note"], parser: "string" },
    { header: "is_active", dbPath: "is_active", aliases: ["is_active", "active"], parser: "boolean_number" }
  ] as FieldConfig[],

  AMCS: [
    { header: "amc_name", dbPath: "name", aliases: ["amc_name", "amc", "name"], parser: "string", required: true },
    { header: "is_active", dbPath: "is_active", aliases: ["is_active", "active"], parser: "boolean_number" }
  ] as FieldConfig[],

  FUNDS: [
    { header: "scheme_code", dbPath: "scheme_code", aliases: ["scheme_code", "schemecode", "code"], parser: "string" },
    { header: "isin_number", dbPath: "isin", aliases: ["isin_number", "isin"], parser: "string" },
    { header: "fund_name", dbPath: "fund_name", aliases: ["fund_name", "scheme_name", "name"], parser: "string", required: true },
    { header: "amc_name", dbPath: "amcName", aliases: ["amc_name", "amc"], parser: "string", required: true },
    { header: "category_name", dbPath: "categoryName", aliases: ["category_name", "category"], parser: "string", required: true },
    { header: "main_category_name", dbPath: "mainCategoryName", aliases: ["main_category_name", "main_category", "type"], parser: "string", required: true },
    { header: "plan_type", dbPath: "plan_type", aliases: ["plan_type", "plan"], parser: "string" },
    { header: "option_type", dbPath: "option_type", aliases: ["option_type", "option"], parser: "string" },
    { header: "nav_current", dbPath: "nav", aliases: ["nav_current", "nav", "current_nav"], parser: "number" },
    { header: "nav_date", dbPath: "nav_date", aliases: ["nav_date", "date"], parser: "date" },
    { header: "aum_cr", dbPath: "aum_cr", aliases: ["aum_cr", "aum", "fund_size", "size"], parser: "number" },
    { header: "expense_ratio", dbPath: "expense_ratio", aliases: ["expense_ratio", "ter"], parser: "number" },
    { header: "return_1d", dbPath: "returns.trailing.1d", aliases: ["return_1d", "1d_return"], parser: "number" },
    { header: "Fund trailing return_1w", dbPath: "returns.trailing.1w", aliases: ["fund trailing return_1w", "return_1w", "1w"], parser: "number" },
    { header: "Fund trailing return_1m", dbPath: "returns.trailing.1m", aliases: ["fund trailing return_1m", "return_1m", "1m"], parser: "number" },
    { header: "Fund trailing return_3m", dbPath: "returns.trailing.3m", aliases: ["fund trailing return_3m", "return_3m", "3m"], parser: "number" },
    { header: "Fund trailing return_6m", dbPath: "returns.trailing.6m", aliases: ["fund trailing return_6m", "return_6m", "6m"], parser: "number" },
    { header: "Fund trailing return_1y", dbPath: "returns.trailing.1y", aliases: ["fund trailing return_1y", "return_1y", "1y"], parser: "number" },
    { header: "Fund trailing return_3y", dbPath: "returns.trailing.3y", aliases: ["fund trailing return_3y", "return_3y", "3y"], parser: "number" },
    { header: "Fund trailing return_5y", dbPath: "returns.trailing.5y", aliases: ["fund trailing return_5y", "return_5y", "5y"], parser: "number" },
    { header: "Fund trailing return_10y", dbPath: "returns.trailing.10y", aliases: ["fund trailing return_10y", "return_10y", "10y"], parser: "number" },
    { header: "Fund trailing since_launch", dbPath: "returns.since_inception", aliases: ["fund trailing since_launch", "since_launch"], parser: "number" },
    { header: "YTD", dbPath: "returns.annual.ytd", aliases: ["ytd"], parser: "number" },
    ...generateAnnualReturns(),
    { header: "sharpe_3y", dbPath: "risk_metrics.sharpe_3y", aliases: ["sharpe_3y"], parser: "number" },
    { header: "sharpe_5y", dbPath: "risk_metrics.sharpe_5y", aliases: ["sharpe_5y"], parser: "number" },
    { header: "std_dev_3y", dbPath: "risk_metrics.std_dev_3y", aliases: ["std_dev_3y"], parser: "number" },
    { header: "std_dev_5y", dbPath: "risk_metrics.std_dev_5y", aliases: ["std_dev_5y"], parser: "number" },
    { header: "beta_3y", dbPath: "risk_metrics.beta_3y", aliases: ["beta_3y"], parser: "number" },
    { header: "beta_5y", dbPath: "risk_metrics.beta_5y", aliases: ["beta_5y"], parser: "number" },
    { header: "alpha_3y", dbPath: "risk_metrics.alpha_3y", aliases: ["alpha_3y"], parser: "number" },
    { header: "alpha_5y", dbPath: "risk_metrics.alpha_5y", aliases: ["alpha_5y"], parser: "number" },
    { header: "max_drawdown_5y", dbPath: "risk_metrics.max_drawdown_5y", aliases: ["max_drawdown_5y"], parser: "number" },
    { header: "max_drawdown_10y", dbPath: "risk_metrics.max_drawdown_10y", aliases: ["max_drawdown_10y"], parser: "number" },
    { header: "turnover_ratio", dbPath: "risk_metrics.turnover_ratio", aliases: ["turnover_ratio"], parser: "number" },
    { header: "fund_manager", dbPath: "fund_manager", aliases: ["fund_manager", "manager"], parser: "string" },
    { header: "launch_date", dbPath: "launch_date", aliases: ["launch_date", "inception_date"], parser: "date" },
    { header: "min_investment", dbPath: "min_investment", aliases: ["min_investment", "minimum_investment"], parser: "number" },
    { header: "sip_allowed", dbPath: "sip_allowed", aliases: ["sip_allowed"], parser: "boolean" },
    { header: "min_sip_investment", dbPath: "min_sip_investment", aliases: ["min_sip_investment", "minimum_sip_investment", "min_sip"], parser: "number" },
    { header: "lumpsum_allowed", dbPath: "lumpsum_allowed", aliases: ["lumpsum_allowed"], parser: "boolean" },
    { header: "min_lumpsum_investment", dbPath: "min_lumpsum_investment", aliases: ["min_lumpsum_investment"], parser: "number" },
    { header: "exit_load", dbPath: "exit_load", aliases: ["exit_load"], parser: "string" },
    { header: "is_featured", dbPath: "is_featured", aliases: ["is_featured"], parser: "boolean" },
    { header: "is_popular", dbPath: "is_popular", aliases: ["is_popular"], parser: "boolean" },
    { header: "fund_objective", dbPath: "fund_objective", aliases: ["fund_objective"], parser: "string" },
    { header: "investment_strategy", dbPath: "investment_strategy", aliases: ["investment_strategy"], parser: "string" },
    { header: "domestic_equity_pct", dbPath: "domestic_equity_pct", aliases: ["domestic_equity_pct"], parser: "number" },
    { header: "international_equity_pct", dbPath: "international_equity_pct", aliases: ["international_equity_pct"], parser: "number" },
    { header: "debt_pct", dbPath: "debt_pct", aliases: ["debt_pct"], parser: "number" },
    { header: "other_pct", dbPath: "other_pct", aliases: ["other_pct"], parser: "number" },
    { header: "gold_pct", dbPath: "gold_pct", aliases: ["gold_pct"], parser: "number" },
    { header: "cash_pct", dbPath: "cash_pct", aliases: ["cash_pct"], parser: "number" },
    { header: "large_cap_pct", dbPath: "large_cap_pct", aliases: ["large_cap_pct"], parser: "number" },
    { header: "mid_cap_pct", dbPath: "mid_cap_pct", aliases: ["mid_cap_pct"], parser: "number" },
    { header: "small_cap_pct", dbPath: "small_cap_pct", aliases: ["small_cap_pct"], parser: "number" },
    { header: "tax_type", dbPath: "tax_type", aliases: ["tax_type"], parser: "string" },
    { header: "riskometer_label", dbPath: "riskometer_label", aliases: ["riskometer_label", "risk_level", "risk"], parser: "string" },
    { header: "benchmark_index_name", dbPath: "benchmarkIndexName", aliases: ["benchmark_index_name", "benchmark"], parser: "string" },
    { header: "benchmark_trailing_1w", dbPath: "benchmark_returns_trailing.1w", aliases: ["benchmark_trailing_1w"], parser: "number" },
    { header: "benchmark_trailing_1m", dbPath: "benchmark_returns_trailing.1m", aliases: ["benchmark_trailing_1m"], parser: "number" },
    { header: "benchmark_trailing_3m", dbPath: "benchmark_returns_trailing.3m", aliases: ["benchmark_trailing_3m"], parser: "number" },
    { header: "benchmark_trailing_6m", dbPath: "benchmark_returns_trailing.6m", aliases: ["benchmark_trailing_6m"], parser: "number" },
    { header: "benchmark_trailing_1y", dbPath: "benchmark_returns_trailing.1y", aliases: ["benchmark_trailing_1y"], parser: "number" },
    { header: "benchmark_trailing_3y", dbPath: "benchmark_returns_trailing.3y", aliases: ["benchmark_trailing_3y"], parser: "number" },
    { header: "benchmark_trailing_5y", dbPath: "benchmark_returns_trailing.5y", aliases: ["benchmark_trailing_5y"], parser: "number" },
    { header: "benchmark_trailing_10y", dbPath: "benchmark_returns_trailing.10y", aliases: ["benchmark_trailing_10y"], parser: "number" },
    { header: "bench_ytd", dbPath: "benchmark_returns_trailing.ytd", aliases: ["bench_ytd"], parser: "number" },
    { header: "mf_api_synced_at", dbPath: "mf_api_synced_at", aliases: ["mf_api_synced_at"], parser: "date" },
    { header: "is_active", dbPath: "is_active", aliases: ["is_active", "active"], parser: "boolean_number" }
  ] as FieldConfig[],

  NFOS: [
    { header: "nfo_id", dbPath: "nfo_id", aliases: ["nfo_id"], parser: "string" },
    { header: "fund_name", dbPath: "nfo_name", aliases: ["fund_name", "nfo_name", "name", "scheme_name"], parser: "string", required: true },
    { header: "amc_name", dbPath: "amcName", aliases: ["amc_name", "amc"], parser: "string", required: true },
    { header: "category_name", dbPath: "categoryName", aliases: ["category_name", "category"], parser: "string", required: true },
    { header: "main_category_name", dbPath: "mainCategoryName", aliases: ["main_category_name", "main_category", "type"], parser: "string" },
    { header: "fund_objective_short", dbPath: "fund_objective_short", aliases: ["fund_objective_short"], parser: "string" },
    { header: "subscription_start_date", dbPath: "open_date", aliases: ["subscription_start_date", "open_date", "start_date"], parser: "date" },
    { header: "subscription_end_date", dbPath: "close_date", aliases: ["subscription_end_date", "close_date", "end_date"], parser: "date" },
    { header: "min_investment", dbPath: "min_investment", aliases: ["min_investment", "minimum_investment"], parser: "number" },
    { header: "benchmark", dbPath: "benchmark", aliases: ["benchmark"], parser: "string" },
    { header: "risk_level", dbPath: "risk_level", aliases: ["risk_level", "risk"], parser: "string" },
    { header: "is_open", dbPath: "is_open", aliases: ["is_open"], parser: "boolean" },
    { header: "is_active", dbPath: "is_active", aliases: ["is_active", "active"], parser: "boolean_number" }
  ] as FieldConfig[],

  BENCHMARKS: [
    { header: "benchmark_index_name", dbPath: "benchmark_index_name", aliases: ["benchmark_index_name", "benchmark_name", "benchmark", "name"], parser: "string", required: true },
    { header: "category", dbPath: "categoryName", aliases: ["category", "category_name"], parser: "string" },
    { header: "main_category", dbPath: "mainCategoryName", aliases: ["main_category", "main_category_name", "type"], parser: "string" },
    { header: "type", dbPath: "type", aliases: ["type"], parser: "string" },
    { header: "is_active", dbPath: "is_active", aliases: ["is_active", "active"], parser: "boolean_number" }
  ] as FieldConfig[],

  BENCHMARK_RETURNS: [
    { header: "benchmark_index_name", dbPath: "benchmarkIndexName", aliases: ["benchmark_index_name", "benchmark_name", "benchmark"], parser: "string", required: true },
    { header: "date", dbPath: "date", aliases: ["date", "last_updated_date"], parser: "date" },
    { header: "benchmark_trailing_1w", dbPath: "trailing.1w", aliases: ["benchmark_trailing_1w", "return_1w", "1w"], parser: "number" },
    { header: "benchmark_trailing_1m", dbPath: "trailing.1m", aliases: ["benchmark_trailing_1m", "return_1m", "1m"], parser: "number" },
    { header: "benchmark_trailing_3m", dbPath: "trailing.3m", aliases: ["benchmark_trailing_3m", "return_3m", "3m"], parser: "number" },
    { header: "benchmark_trailing_6m", dbPath: "trailing.6m", aliases: ["benchmark_trailing_6m", "return_6m", "6m"], parser: "number" },
    { header: "benchmark_trailing_1y", dbPath: "trailing.1y", aliases: ["benchmark_trailing_1y", "return_1y", "1y"], parser: "number" },
    { header: "benchmark_trailing_3y", dbPath: "trailing.3y", aliases: ["benchmark_trailing_3y", "return_3y", "3y"], parser: "number" },
    { header: "benchmark_trailing_5y", dbPath: "trailing.5y", aliases: ["benchmark_trailing_5y", "return_5y", "5y"], parser: "number" },
    { header: "benchmark_trailing_10y", dbPath: "trailing.10y", aliases: ["benchmark_trailing_10y", "return_10y", "10y"], parser: "number" },
    { header: "since_launch", dbPath: "trailing.since_launch", aliases: ["since_launch"], parser: "number" },
    { header: "bench_YTD", dbPath: "trailing.ytd", aliases: ["bench_ytd", "ytd"], parser: "number" },
    ...MF_ANNUAL_YEARS.map(year => ({
      header: `bench_${year}`,
      dbPath: `bench_${year}`,
      aliases: [`bench_${year}`, String(year)],
      parser: "number" as FieldParser
    }))
  ] as FieldConfig[],

  INDEX_SNAPSHOTS: [
    { header: "benchmark_index_name", dbPath: "benchmark_index_name", aliases: ["benchmark_index_name", "benchmark", "name"], parser: "string", required: true },
    { header: "main_category_name", dbPath: "main_category_name", aliases: ["main_category_name", "main_category"], parser: "string" },
    { header: "category_name", dbPath: "category_name", aliases: ["category_name", "category"], parser: "string" },
    { header: "return_1d", dbPath: "return_1d", aliases: ["return_1d", "1d"], parser: "number" },
    { header: "return_1w", dbPath: "trailing.1w", aliases: ["return_1w", "1w"], parser: "number" },
    { header: "return_1m", dbPath: "trailing.1m", aliases: ["return_1m", "1m"], parser: "number" },
    { header: "return_3m", dbPath: "trailing.3m", aliases: ["return_3m", "3m"], parser: "number" },
    { header: "return_6m", dbPath: "trailing.6m", aliases: ["return_6m", "6m"], parser: "number" },
    { header: "return_1y", dbPath: "trailing.1y", aliases: ["return_1y", "1y"], parser: "number" },
    { header: "return_3y", dbPath: "trailing.3y", aliases: ["return_3y", "3y"], parser: "number" },
    { header: "return_5y", dbPath: "trailing.5y", aliases: ["return_5y", "5y"], parser: "number" },
    { header: "return_10y", dbPath: "trailing.10y", aliases: ["return_10y", "10y"], parser: "number" },
    { header: "last_updated_date", dbPath: "last_updated_date", aliases: ["last_updated_date", "date"], parser: "date" },
    { header: "is_active", dbPath: "is_active", aliases: ["is_active", "active"], parser: "boolean_number" }
  ] as FieldConfig[],

  TOP_HOLDINGS: [
    { header: "scheme_code", dbPath: "scheme_code", aliases: ["scheme_code", "schemecode", "code"], parser: "string", required: true },
    { header: "fund_name", dbPath: "fundName", aliases: ["fund_name", "name"], parser: "string" },
    { header: "source_standard_name", dbPath: "source_standard_name", aliases: ["source_standard_name", "holding_name", "name"], parser: "string" },
    { header: "source_isin", dbPath: "source_isin", aliases: ["source_isin", "isin"], parser: "string" },
    { header: "portfolio_date", dbPath: "portfolio_date", aliases: ["portfolio_date", "date"], parser: "date" },
    { header: "prev_portfolio_date", dbPath: "prev_portfolio_date", aliases: ["prev_portfolio_date"], parser: "date" },
    { header: "stock_holdings", dbPath: "stock_holdings", aliases: ["stock_holdings"], parser: "number" },
    { header: "bond_holdings", dbPath: "bond_holdings", aliases: ["bond_holdings"], parser: "number" },
    { header: "assets_top_10_holdings_pct", dbPath: "assets_top_10_holdings_pct", aliases: ["assets_top_10_holdings_pct"], parser: "number" },
    { header: "turnover_pct", dbPath: "turnover_pct", aliases: ["turnover_pct"], parser: "number" },
    { header: "holding_name", dbPath: "holding_name", aliases: ["holding_name"], parser: "string" },
    { header: "net_assets_pct", dbPath: "net_assets_pct", aliases: ["net_assets_pct", "assets_pct"], parser: "number" },
    { header: "market_value", dbPath: "market_value", aliases: ["market_value", "value"], parser: "number" },
    { header: "share_amount", dbPath: "share_amount", aliases: ["share_amount", "shares"], parser: "number" },
    { header: "share_change", dbPath: "share_change", aliases: ["share_change"], parser: "number" },
    { header: "security_type", dbPath: "security_type", aliases: ["security_type", "type"], parser: "string" },
    { header: "sector", dbPath: "sector", aliases: ["sector"], parser: "string" },
    { header: "maturity", dbPath: "maturity", aliases: ["maturity"], parser: "date" },
    { header: "credit_quality_india", dbPath: "credit_quality_india", aliases: ["credit_quality_india", "credit_quality"], parser: "string" },
    { header: "country", dbPath: "country", aliases: ["country"], parser: "string" },
    { header: "is_active", dbPath: "is_active", aliases: ["is_active", "active"], parser: "boolean_number" }
  ] as FieldConfig[]
};
