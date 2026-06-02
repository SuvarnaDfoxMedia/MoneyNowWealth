import { body } from "express-validator";
import { CATEGORY_TRAILING_KEYS, FUND_RETURN_KEYS } from "../services/mfUtils";
const CATEGORY_TRAILING_TO_NESTED_KEY: Record<string, string> = {
  w1: "1w",
  m1: "1m",
  m3: "3m",
  m6: "6m",
  y1: "1y",
  y3: "3y",
  y5: "5y",
  y10: "10y",
  ytd: "ytd",
};

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

const optionalDynamicYearMap = (field: string, label: string, min = -1000, max = 1000) =>
  body(field)
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === "") return true;
      if (typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${label} must be an object`);
      }
      for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
        if (!/^\d{4}$/.test(String(key))) {
          throw new Error(`${label} contains invalid year key: ${key}`);
        }
        if (raw === null || raw === undefined || raw === "") continue;
        const n = Number(raw);
        if (!Number.isFinite(n) || n < min || n > max) {
          throw new Error(`${label} year ${key} must be between ${min} and ${max}`);
        }
      }
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
  ...CATEGORY_TRAILING_KEYS.map((key) =>
    optionalNumber(
      `category_average_returns.trailing.${CATEGORY_TRAILING_TO_NESTED_KEY[key]}`,
      `Category average ${key.toUpperCase()} return`,
    ),
  ),
  ...CATEGORY_TRAILING_KEYS.map((key) =>
    optionalNumber(
      `category_returns.trailing.${CATEGORY_TRAILING_TO_NESTED_KEY[key]}`,
      `Category ${key.toUpperCase()} return`,
    ),
  ),
  optionalDynamicYearMap("category_average_returns.annual.yearly_returns", "Category annual returns"),
  optionalDynamicYearMap("category_returns.annual.yearly_returns", "Category annual returns"),
  optionalNumber("category_average_returns.trailing.since_launch", "Category average since launch return"),
  optionalNumber("category_average_returns.annual.ytd", "Category average YTD return"),
  optionalNumber("category_returns.trailing.since_launch", "Category since launch return"),
  optionalNumber("category_returns.annual.ytd", "Category YTD return"),
  optionalString("risk_level", "Risk level", 200),
  optionalString("suggested_use_case", "Suggested use case", 500),
  optionalString("suggested_use_case_note", "Suggested use case note", 5000),
  optionalIsActive(),
];

export const updateCategoryValidators = [
  optionalString("name", "Name", 120),
  optionalMongoId("main_category_id", "Main category"),
  optionalString("description", "Description", 5000),
  ...CATEGORY_TRAILING_KEYS.map((key) =>
    optionalNumber(
      `category_average_returns.trailing.${CATEGORY_TRAILING_TO_NESTED_KEY[key]}`,
      `Category average ${key.toUpperCase()} return`,
    ),
  ),
  ...CATEGORY_TRAILING_KEYS.map((key) =>
    optionalNumber(
      `category_returns.trailing.${CATEGORY_TRAILING_TO_NESTED_KEY[key]}`,
      `Category ${key.toUpperCase()} return`,
    ),
  ),
  optionalDynamicYearMap("category_average_returns.annual.yearly_returns", "Category annual returns"),
  optionalDynamicYearMap("category_returns.annual.yearly_returns", "Category annual returns"),
  optionalNumber("category_average_returns.trailing.since_launch", "Category average since launch return"),
  optionalNumber("category_average_returns.annual.ytd", "Category average YTD return"),
  optionalNumber("category_returns.trailing.since_launch", "Category since launch return"),
  optionalNumber("category_returns.annual.ytd", "Category YTD return"),
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
  optionalNonNegativeNumber("aum_cr", "AUM (Cr)"),
  optionalNumber("expense_ratio", "Expense ratio", 0, 100),
  ...FUND_RETURN_KEYS.map((key) =>
    optionalNumber(`returns.${key}`, `Return ${key.toUpperCase()}`),
  ),
  optionalDynamicYearMap("returns.annual.yearly_returns", "Fund annual returns"),
  optionalNumber("risk_metrics.sharpe_3y", "Sharpe (3Y)"),
  optionalNumber("risk_metrics.std_dev_3y", "Std Dev (3Y)"),
  optionalNumber("risk_metrics.beta_3y", "Beta (3Y)"),
  optionalNumber("risk_metrics.alpha_3y", "Alpha (3Y)"),
  optionalNumber("risk_metrics.max_drawdown_5y", "Max Drawdown (5Y)"),
  optionalNumber("risk_metrics.turnover_ratio", "Turnover ratio"),
  optionalString("fund_manager", "Fund manager", 200),
  optionalIsoDate("launch_date", "Acceptance date"),
  optionalNonNegativeNumber("min_investment", "Minimum investment"),
  optionalBoolean("sip_allowed", "sip_allowed"),
  optionalNonNegativeNumber("min_sip_investment", "Minimum SIP investment"),
  optionalBoolean("lumpsum_allowed", "lumpsum_allowed"),
  optionalNonNegativeNumber("min_lumpsum_investment", "Minimum lumpsum investment"),
  optionalString("exit_load", "Exit load", 500),
  optionalBoolean("is_featured", "is_featured"),
  optionalBoolean("is_popular", "is_popular"),
  optionalIsActive(),
];

export const updateFundValidators = [
  optionalString("scheme_code", "Scheme code", 80),
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
  optionalNonNegativeNumber("aum_cr", "AUM (Cr)"),
  optionalNumber("expense_ratio", "Expense ratio", 0, 100),
  ...FUND_RETURN_KEYS.map((key) =>
    optionalNumber(`returns.${key}`, `Return ${key.toUpperCase()}`),
  ),
  optionalDynamicYearMap("returns.annual.yearly_returns", "Fund annual returns"),
  optionalNumber("risk_metrics.sharpe_3y", "Sharpe (3Y)"),
  optionalNumber("risk_metrics.std_dev_3y", "Std Dev (3Y)"),
  optionalNumber("risk_metrics.beta_3y", "Beta (3Y)"),
  optionalNumber("risk_metrics.alpha_3y", "Alpha (3Y)"),
  optionalNumber("risk_metrics.max_drawdown_5y", "Max Drawdown (5Y)"),
  optionalNumber("risk_metrics.turnover_ratio", "Turnover ratio"),
  optionalString("fund_manager", "Fund manager", 200),
  optionalIsoDate("launch_date", "Acceptance date"),
  optionalNonNegativeNumber("min_investment", "Minimum investment"),
  optionalBoolean("sip_allowed", "sip_allowed"),
  optionalNonNegativeNumber("min_sip_investment", "Minimum SIP investment"),
  optionalBoolean("lumpsum_allowed", "lumpsum_allowed"),
  optionalNonNegativeNumber("min_lumpsum_investment", "Minimum lumpsum investment"),
  optionalString("exit_load", "Exit load", 500),
  optionalBoolean("is_featured", "is_featured"),
  optionalBoolean("is_popular", "is_popular"),
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
  optionalNumber("returns.d1", "1D return"),
  optionalNumber("returns.w1", "1W return"),
  optionalNumber("returns.m1", "1M return"),
  optionalNumber("returns.m3", "3M return"),
  optionalNumber("returns.m6", "6M return"),
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
  optionalNumber("returns.d1", "1D return"),
  optionalNumber("returns.w1", "1W return"),
  optionalNumber("returns.m1", "1M return"),
  optionalNumber("returns.m3", "3M return"),
  optionalNumber("returns.m6", "6M return"),
  optionalNumber("returns.y1", "1Y return"),
  optionalNumber("returns.y3", "3Y return"),
  optionalNumber("returns.y5", "5Y return"),
  optionalNumber("returns.y10", "10Y return"),
  optionalIsoDate("last_updated_date", "Last updated date"),
  optionalIsActive(),
];

export const createBenchmarkValidators = [
  body("name")
    .custom((value, { req }) => {
      const candidate = String(value || req.body?.benchmark_index_name || "").trim();
      if (!candidate) throw new Error("Benchmark name is required");
      if (candidate.length < 2 || candidate.length > 200) {
        throw new Error("Benchmark name must be between 2 and 200 characters");
      }
      return true;
    }),
  optionalString("category", "Category", 120),
  optionalMongoId("main_category_id", "Main category"),
  optionalMongoId("category_id", "Category"),
  optionalString("type", "Type", 50),
  optionalIsActive(),
];

export const updateBenchmarkValidators = [
  optionalString("name", "Benchmark name", 200),
  optionalString("benchmark_index_name", "Benchmark index name", 200),
  optionalString("category", "Category", 120),
  optionalMongoId("main_category_id", "Main category"),
  optionalMongoId("category_id", "Category"),
  optionalString("type", "Type", 50),
  optionalIsActive(),
];

export const createBenchmarkReturnValidators = [
  requiredMongoId("benchmark_id", "Benchmark"),
  requiredIsoDate("date", "Date"),
  optionalNumber("trailing.1w", "1W return"),
  optionalNumber("trailing.1m", "1M return"),
  optionalNumber("trailing.3m", "3M return"),
  optionalNumber("trailing.6m", "6M return"),
  optionalNumber("trailing.1y", "1Y return"),
  optionalNumber("trailing.3y", "3Y return"),
  optionalNumber("trailing.5y", "5Y return"),
  optionalNumber("trailing.10y", "10Y return"),
  optionalNumber("trailing.since_launch", "Since launch return"),
  optionalNumber("annual.ytd", "YTD return"),
  optionalNumber("benchmark_trailing_1w", "1W return"),
  optionalNumber("benchmark_trailing_1m", "1M return"),
  optionalNumber("benchmark_trailing_3m", "3M return"),
  optionalNumber("benchmark_trailing_6m", "6M return"),
  optionalNumber("benchmark_trailing_1y", "1Y return"),
  optionalNumber("benchmark_trailing_3y", "3Y return"),
  optionalNumber("benchmark_trailing_5y", "5Y return"),
  optionalNumber("benchmark_trailing_10y", "10Y return"),
  optionalNumber("since_launch", "Since launch return"),
  optionalNumber("bench_YTD", "YTD return"),
  optionalDynamicYearMap("annual.yearly_returns", "Benchmark annual returns"),
];
