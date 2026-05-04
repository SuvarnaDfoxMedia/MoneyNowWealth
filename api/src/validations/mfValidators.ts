import { body } from "express-validator";
import {
  BENCHMARK_TRAILING_KEYS,
  CATEGORY_TRAILING_KEYS,
  FUND_RETURN_KEYS,
  MF_ANNUAL_YEARS,
} from "../services/mfUtils";

const requiredString = (field: string, label: string, min = 2, max = 120) =>
  body(field)
    .exists({ checkFalsy: true })
    .withMessage(`${label} is required`)
    .bail()
    .isString()
    .withMessage(`${label} must be a string`)
    .bail()
    .isLength({ min, max })
    .withMessage(`${label} must be between ${min} and ${max} characters`)
    .trim();

const optionalString = (field: string, label: string, max = 5000) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage(`${label} must be a string`)
    .bail()
    .isLength({ max })
    .withMessage(`${label} must be at most ${max} characters`)
    .trim();

const optionalNumber = (field: string, label: string, min = -1000, max = 1000) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min, max })
    .withMessage(`${label} must be a number between ${min} and ${max}`)
    .toFloat();

const optionalNonNegativeNumber = (field: string, label: string, max = 1_000_000_000) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max })
    .withMessage(`${label} must be a number between 0 and ${max}`)
    .toFloat();

const optionalBoolean = (field: string, label: string) =>
  body(field)
    .optional({ nullable: true })
    .isBoolean()
    .withMessage(`${label} must be a boolean`)
    .toBoolean();

const optionalIsActive = (field = "is_active") =>
  body(field)
    .optional({ nullable: true })
    .isInt({ min: 0, max: 1 })
    .withMessage("is_active must be 0 or 1")
    .toInt();

const optionalVisibilityObject = () =>
  body("frontend_visibility")
    .optional({ nullable: true })
    .custom((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("frontend_visibility must be an object");
      }

      const groups = value.groups ?? {};
      const fields = value.fields ?? {};
      if (typeof groups !== "object" || Array.isArray(groups)) {
        throw new Error("frontend_visibility.groups must be an object");
      }
      if (typeof fields !== "object" || Array.isArray(fields)) {
        throw new Error("frontend_visibility.fields must be an object");
      }

      const values = [...Object.values(groups), ...Object.values(fields)];
      if (
        values.some(
          (item) =>
            !["boolean", "number", "string"].includes(typeof item) ||
            (typeof item === "string" &&
              !["true", "false", "1", "0"].includes(item.toLowerCase())) ||
            (typeof item === "number" && ![0, 1].includes(item)),
        )
      ) {
        throw new Error("frontend_visibility values must be true/false");
      }

      return true;
    });

const optionalMongoId = (field: string, label: string) =>
  body(field)
    .optional({ nullable: true })
    .isMongoId()
    .withMessage(`${label} must be a valid id`);

const requiredMongoId = (field: string, label: string) =>
  body(field)
    .exists({ checkFalsy: true })
    .withMessage(`${label} is required`)
    .bail()
    .isMongoId()
    .withMessage(`${label} must be a valid id`);

const optionalIsoDate = (field: string, label: string) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage(`${label} must be a valid ISO date`)
    .toDate();

const requiredIsoDate = (field: string, label: string) =>
  body(field)
    .exists({ checkFalsy: true })
    .withMessage(`${label} is required`)
    .bail()
    .isISO8601()
    .withMessage(`${label} must be a valid ISO date`)
    .toDate();

const requireAmcReference = () =>
  body().custom((value, { req }) => {
    if (req.body?.amc_id || req.body?.amc_name) return true;
    throw new Error("amc_id or amc_name is required");
  });

const validateDateOrder = (startField: string, endField: string, label: string) =>
  body(endField).custom((value, { req }) => {
    if (!req.body?.[startField] || !value) return true;
    const start = new Date(req.body[startField]);
    const end = new Date(value);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
    if (end < start) throw new Error(`${label} must be greater than or equal to ${startField}`);
    return true;
  });

export const createMainCategoryValidators = [
  requiredString("name", "Name", 2, 120),
  optionalString("description", "Description", 5000),
  optionalNumber("sort_order", "Sort order", 0, 9999),
  optionalIsActive(),
];

export const updateMainCategoryValidators = [
  optionalString("name", "Name", 120),
  optionalString("description", "Description", 5000),
  optionalNumber("sort_order", "Sort order", 0, 9999),
  optionalIsActive(),
];

export const createCategoryValidators = [
  requiredString("name", "Name", 2, 120),
  requiredMongoId("main_category_id", "Main category"),
  optionalString("description", "Description", 5000),
  optionalString("benchmark_index_name", "Benchmark index name", 200),
  body("benchmark_return_type")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["Annual", "Trailing"])
    .withMessage("Benchmark return type must be Annual or Trailing"),
  ...CATEGORY_TRAILING_KEYS.map((key) =>
    optionalNumber(
      `benchmark_returns.${key}`,
      `Benchmark ${key.toUpperCase()} return`,
    ),
  ),
  ...CATEGORY_TRAILING_KEYS.map((key) =>
    optionalNumber(
      `category_average_returns.${key}`,
      `Category average ${key.toUpperCase()} return`,
    ),
  ),
  ...MF_ANNUAL_YEARS.map((year) =>
    optionalNumber(`benchmark_returns.annual.${year}`, `Benchmark ${year} return`),
  ),
  ...MF_ANNUAL_YEARS.map((year) =>
    optionalNumber(`category_average_returns.annual.${year}`, `Category average ${year} return`),
  ),
  optionalString("risk_level", "Risk level", 200),
  optionalString("suggested_use_case", "Suggested use case", 500),
  optionalString("suggested_use_case_note", "Suggested use case note", 5000),
  optionalIsActive(),
];

export const updateCategoryValidators = [
  optionalString("name", "Name", 120),
  optionalMongoId("main_category_id", "Main category"),
  optionalString("description", "Description", 5000),
  optionalString("benchmark_index_name", "Benchmark index name", 200),
  body("benchmark_return_type")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["Annual", "Trailing"])
    .withMessage("Benchmark return type must be Annual or Trailing"),
  ...CATEGORY_TRAILING_KEYS.map((key) =>
    optionalNumber(
      `benchmark_returns.${key}`,
      `Benchmark ${key.toUpperCase()} return`,
    ),
  ),
  ...CATEGORY_TRAILING_KEYS.map((key) =>
    optionalNumber(
      `category_average_returns.${key}`,
      `Category average ${key.toUpperCase()} return`,
    ),
  ),
  ...MF_ANNUAL_YEARS.map((year) =>
    optionalNumber(`benchmark_returns.annual.${year}`, `Benchmark ${year} return`),
  ),
  ...MF_ANNUAL_YEARS.map((year) =>
    optionalNumber(`category_average_returns.annual.${year}`, `Category average ${year} return`),
  ),
  optionalString("risk_level", "Risk level", 200),
  optionalString("suggested_use_case", "Suggested use case", 500),
  optionalString("suggested_use_case_note", "Suggested use case note", 5000),
  optionalIsActive(),
];

export const createAmcValidators = [
  requiredString("name", "AMC name", 2, 120),
  optionalIsActive(),
];

export const updateAmcValidators = [
  optionalString("name", "AMC name", 120),
  optionalIsActive(),
];

export const createFundValidators = [
  requiredString("scheme_code", "Scheme code", 2, 80),
  optionalString("isin_number", "ISIN", 80),
  optionalString("isin", "ISIN", 80),
  requiredString("fund_name", "Fund name", 2, 200),
  requireAmcReference(),
  optionalMongoId("amc_id", "AMC"),
  optionalString("amc_name", "AMC name", 120),
  requiredMongoId("category_id", "Category"),
  body("plan_type")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["Regular", "Direct"])
    .withMessage("plan_type must be Regular or Direct"),
  body("option_type")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["Growth", "IDCW"])
    .withMessage("option_type must be Growth or IDCW"),
  optionalNonNegativeNumber("nav_Current", "NAV"),
  optionalNonNegativeNumber("nav_current", "NAV"),
  optionalNonNegativeNumber("aum", "AUM (Cr)"),
  optionalNonNegativeNumber("aum_cr", "AUM (Cr)"),
  optionalNumber("expense_ratio", "Expense ratio", 0, 100),
  ...FUND_RETURN_KEYS.map((key) =>
    optionalNumber(`returns.${key}`, `Return ${key.toUpperCase()}`),
  ),
  ...MF_ANNUAL_YEARS.map((year) =>
    optionalNumber(`returns.annual.${year}`, `Return ${year}`),
  ),
  optionalNumber("risk_metrics.sharpe_3y", "Sharpe (3Y)"),
  optionalNumber("risk_metrics.sharpe_5y", "Sharpe (5Y)"),
  optionalNumber("risk_metrics.std_dev_3y", "Std Dev (3Y)"),
  optionalNumber("risk_metrics.std_dev_5y", "Std Dev (5Y)"),
  optionalNumber("risk_metrics.beta_3y", "Beta (3Y)"),
  optionalNumber("risk_metrics.beta_5y", "Beta (5Y)"),
  optionalNumber("risk_metrics.alpha_3y", "Alpha (3Y)"),
  optionalNumber("risk_metrics.alpha_5y", "Alpha (5Y)"),
  optionalNumber("risk_metrics.max_drawdown_5y", "Max Drawdown (5Y)"),
  optionalNumber("risk_metrics.max_drawdown_10y", "Max Drawdown (10Y)"),
  optionalNumber("risk_metrics.turnover_ratio", "Turnover ratio"),
  optionalString("fund_manager", "Fund manager", 200),
  optionalIsoDate("launch_date", "Acceptance date"),
  optionalString("benchmark_index_name", "Benchmark index name", 200),
  ...BENCHMARK_TRAILING_KEYS.map((key) =>
    optionalNumber(`benchmark_returns_trailing.${key}`, `Benchmark ${key.toUpperCase()} return`),
  ),
  ...MF_ANNUAL_YEARS.map((year) =>
    optionalNumber(`benchmark_returns_annual.${year}`, `Benchmark annual ${year} return`),
  ),
  optionalNonNegativeNumber("min_investment", "Minimum investment"),
  optionalBoolean("sip_allowed", "sip_allowed"),
  optionalNonNegativeNumber("min_sip_investment", "Minimum SIP investment"),
  optionalBoolean("lumpsum_allowed", "lumpsum_allowed"),
  optionalNonNegativeNumber("min_lumpsum_investment", "Minimum lumpsum investment"),
  optionalString("exit_load", "Exit load", 500),
  optionalBoolean("is_featured", "is_featured"),
  optionalBoolean("is_popular", "is_popular"),
  body("top_holdings")
    .optional({ nullable: true })
    .custom((value) => {
      if (Array.isArray(value)) return value.every((v) => typeof v === "string");
      if (typeof value === "string") return true;
      throw new Error("top_holdings must be an array of strings or a comma/newline-separated string");
    }),
  optionalNumber("asset_allocation.domestic_equity_pct", "Domestic equity allocation", 0, 100),
  optionalNumber("asset_allocation.international_equity_pct", "International equity allocation", 0, 100),
  optionalNumber("asset_allocation.equity_pct", "Equity allocation", 0, 100),
  optionalNumber("asset_allocation.debt_pct", "Debt allocation", 0, 100),
  optionalNumber("asset_allocation.other_pct", "Other allocation", 0, 100),
  optionalNumber("asset_allocation.gold_pct", "Gold allocation", 0, 100),
  optionalNumber("asset_allocation.cash_pct", "Cash allocation", 0, 100),
  optionalNumber("equity_allocation.large_cap_pct", "Large cap allocation", 0, 100),
  optionalNumber("equity_allocation.mid_cap_pct", "Mid cap allocation", 0, 100),
  optionalNumber("equity_allocation.small_cap_pct", "Small cap allocation", 0, 100),
  optionalString("tax_type", "Tax type", 120),
  optionalString("riskometer_label", "Risk label", 120),
  optionalVisibilityObject(),
  optionalIsActive(),
];

export const updateFundValidators = [
  optionalString("scheme_code", "Scheme code", 80),
  optionalString("isin_number", "ISIN", 80),
  optionalString("isin", "ISIN", 80),
  optionalString("fund_name", "Fund name", 200),
  optionalMongoId("amc_id", "AMC"),
  optionalString("amc_name", "AMC name", 120),
  optionalMongoId("category_id", "Category"),
  body("plan_type")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["Regular", "Direct"])
    .withMessage("plan_type must be Regular or Direct"),
  body("option_type")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["Growth", "IDCW"])
    .withMessage("option_type must be Growth or IDCW"),
  optionalNonNegativeNumber("nav_Current", "NAV"),
  optionalNonNegativeNumber("nav_current", "NAV"),
  optionalNonNegativeNumber("aum", "AUM (Cr)"),
  optionalNonNegativeNumber("aum_cr", "AUM (Cr)"),
  optionalNumber("expense_ratio", "Expense ratio", 0, 100),
  ...FUND_RETURN_KEYS.map((key) =>
    optionalNumber(`returns.${key}`, `Return ${key.toUpperCase()}`),
  ),
  ...MF_ANNUAL_YEARS.map((year) =>
    optionalNumber(`returns.annual.${year}`, `Return ${year}`),
  ),
  optionalNumber("risk_metrics.sharpe_3y", "Sharpe (3Y)"),
  optionalNumber("risk_metrics.sharpe_5y", "Sharpe (5Y)"),
  optionalNumber("risk_metrics.std_dev_3y", "Std Dev (3Y)"),
  optionalNumber("risk_metrics.std_dev_5y", "Std Dev (5Y)"),
  optionalNumber("risk_metrics.beta_3y", "Beta (3Y)"),
  optionalNumber("risk_metrics.beta_5y", "Beta (5Y)"),
  optionalNumber("risk_metrics.alpha_3y", "Alpha (3Y)"),
  optionalNumber("risk_metrics.alpha_5y", "Alpha (5Y)"),
  optionalNumber("risk_metrics.max_drawdown_5y", "Max Drawdown (5Y)"),
  optionalNumber("risk_metrics.max_drawdown_10y", "Max Drawdown (10Y)"),
  optionalNumber("risk_metrics.turnover_ratio", "Turnover ratio"),
  optionalString("fund_manager", "Fund manager", 200),
  optionalIsoDate("launch_date", "Acceptance date"),
  optionalString("benchmark_index_name", "Benchmark index name", 200),
  ...BENCHMARK_TRAILING_KEYS.map((key) =>
    optionalNumber(`benchmark_returns_trailing.${key}`, `Benchmark ${key.toUpperCase()} return`),
  ),
  ...MF_ANNUAL_YEARS.map((year) =>
    optionalNumber(`benchmark_returns_annual.${year}`, `Benchmark annual ${year} return`),
  ),
  optionalNonNegativeNumber("min_investment", "Minimum investment"),
  optionalBoolean("sip_allowed", "sip_allowed"),
  optionalNonNegativeNumber("min_sip_investment", "Minimum SIP investment"),
  optionalBoolean("lumpsum_allowed", "lumpsum_allowed"),
  optionalNonNegativeNumber("min_lumpsum_investment", "Minimum lumpsum investment"),
  optionalString("exit_load", "Exit load", 500),
  optionalBoolean("is_featured", "is_featured"),
  optionalBoolean("is_popular", "is_popular"),
  body("top_holdings")
    .optional({ nullable: true })
    .custom((value) => {
      if (Array.isArray(value)) return value.every((v) => typeof v === "string");
      if (typeof value === "string") return true;
      throw new Error("top_holdings must be an array of strings or a comma/newline-separated string");
    }),
  optionalNumber("asset_allocation.domestic_equity_pct", "Domestic equity allocation", 0, 100),
  optionalNumber("asset_allocation.international_equity_pct", "International equity allocation", 0, 100),
  optionalNumber("asset_allocation.equity_pct", "Equity allocation", 0, 100),
  optionalNumber("asset_allocation.debt_pct", "Debt allocation", 0, 100),
  optionalNumber("asset_allocation.other_pct", "Other allocation", 0, 100),
  optionalNumber("asset_allocation.gold_pct", "Gold allocation", 0, 100),
  optionalNumber("asset_allocation.cash_pct", "Cash allocation", 0, 100),
  optionalNumber("equity_allocation.large_cap_pct", "Large cap allocation", 0, 100),
  optionalNumber("equity_allocation.mid_cap_pct", "Mid cap allocation", 0, 100),
  optionalNumber("equity_allocation.small_cap_pct", "Small cap allocation", 0, 100),
  optionalString("tax_type", "Tax type", 120),
  optionalString("riskometer_label", "Risk label", 120),
  optionalVisibilityObject(),
  optionalIsActive(),
];

export const createNfoValidators = [
  requiredString("nfo_id", "NFO ID", 1, 80),
  requiredString("fund_name", "Fund name", 2, 200),
  requireAmcReference(),
  optionalMongoId("amc_id", "AMC"),
  optionalString("amc_name", "AMC name", 120),
  requiredMongoId("category_id", "Category"),
  optionalString("fund_objective_short", "Fund objective", 5000),
  optionalIsoDate("subscription_start_date", "Subscription start date"),
  optionalIsoDate("subscription_end_date", "Subscription end date"),
  validateDateOrder("subscription_start_date", "subscription_end_date", "subscription_end_date"),
  optionalNonNegativeNumber("min_investment", "Minimum investment"),
  optionalString("benchmark", "Benchmark", 200),
  optionalString("risk_level", "Risk level", 200),
  optionalBoolean("is_open", "is_open"),
  optionalIsActive(),
];

export const updateNfoValidators = [
  optionalString("nfo_id", "NFO ID", 80),
  optionalString("fund_name", "Fund name", 200),
  optionalMongoId("amc_id", "AMC"),
  optionalString("amc_name", "AMC name", 120),
  optionalMongoId("category_id", "Category"),
  optionalString("fund_objective_short", "Fund objective", 5000),
  optionalIsoDate("subscription_start_date", "Subscription start date"),
  optionalIsoDate("subscription_end_date", "Subscription end date"),
  validateDateOrder("subscription_start_date", "subscription_end_date", "subscription_end_date"),
  optionalNonNegativeNumber("min_investment", "Minimum investment"),
  optionalString("benchmark", "Benchmark", 200),
  optionalString("risk_level", "Risk level", 200),
  optionalBoolean("is_open", "is_open"),
  optionalIsActive(),
];

export const createIndexSnapshotValidators = [
  requiredString("benchmark_index_name", "Benchmark index name", 2, 200),
  requiredMongoId("main_category_id", "Main category"),
  requiredMongoId("category_id", "Category"),
  optionalNumber("returns.y1", "1Y return"),
  optionalNumber("returns.y3", "3Y return"),
  optionalNumber("returns.y5", "5Y return"),
  optionalNumber("returns.y10", "10Y return"),
  requiredIsoDate("last_updated_date", "Last updated date"),
  optionalIsActive(),
];

export const updateIndexSnapshotValidators = [
  optionalString("benchmark_index_name", "Benchmark index name", 200),
  optionalMongoId("main_category_id", "Main category"),
  optionalMongoId("category_id", "Category"),
  optionalNumber("returns.y1", "1Y return"),
  optionalNumber("returns.y3", "3Y return"),
  optionalNumber("returns.y5", "5Y return"),
  optionalNumber("returns.y10", "10Y return"),
  optionalIsoDate("last_updated_date", "Last updated date"),
  optionalIsActive(),
];
