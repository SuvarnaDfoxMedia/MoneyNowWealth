import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Structured sub-schemas (extracted from raw API response) ────────────────

const mfApiTrailingReturnsSchema = new Schema(
  {
    "1w":         { type: Number, default: null },
    "1m":         { type: Number, default: null },
    "3m":         { type: Number, default: null },
    "6m":         { type: Number, default: null },
    "1y":         { type: Number, default: null },
    "2y":         { type: Number, default: null }, // from API (new vs old system)
    "3y":         { type: Number, default: null },
    "5y":         { type: Number, default: null },
    "10y":        { type: Number, default: null },
    since_launch: { type: Number, default: null },
    ytd:          { type: Number, default: null },
    // d1 (1-day) is NOT provided by AdvisorKhoj API — kept null
    d1:           { type: Number, default: null },
  },
  { _id: false },
);

const mfApiYearlyReturnsSchema = new Schema(
  {
    ytd: { type: Number, default: null },
    // yearly_returns: populated by manual import only — AdvisorKhoj does not provide
    yearly_returns: { type: Map, of: Number, default: () => ({}) },
  },
  { _id: false },
);

const mfApiBenchmarkReturnsSchema = new Schema(
  {
    benchmark_name: { type: String, default: "" },
    "1w":           { type: Number, default: null },
    "1m":           { type: Number, default: null },
    "3m":           { type: Number, default: null },
    "6m":           { type: Number, default: null },
    "1y":           { type: Number, default: null },
    "2y":           { type: Number, default: null },
    "3y":           { type: Number, default: null },
    "5y":           { type: Number, default: null },
    "10y":          { type: Number, default: null },
    since_launch:   { type: Number, default: null },
    ytd:            { type: Number, default: null },
  },
  { _id: false },
);

const mfApiCategoryAvgReturnsSchema = new Schema(
  {
    category_name: { type: String, default: "" },
    "1w":          { type: Number, default: null },
    "1m":          { type: Number, default: null },
    "3m":          { type: Number, default: null },
    "6m":          { type: Number, default: null },
    "1y":          { type: Number, default: null },
    "2y":          { type: Number, default: null },
    "3y":          { type: Number, default: null },
    "5y":          { type: Number, default: null },
    "10y":         { type: Number, default: null },
    since_launch:  { type: Number, default: null },
    ytd:           { type: Number, default: null },
  },
  { _id: false },
);

const mfApiRiskMetricsSchema = new Schema(
  {
    volatility_3y:     { type: Number, default: null }, // from volatility_cm_3year
    sharpe_3y:         { type: Number, default: null }, // from sharpratio_cm_3year
    alpha_1y:          { type: Number, default: null }, // from alpha_cm_1year
    beta_1y:           { type: Number, default: null }, // from beta_cm_1year
    sortino:           { type: Number, default: null }, // from shortino_ratio
    yield_to_maturity: { type: Number, default: null },
    average_maturity:  { type: Number, default: null },
    turnover_ratio:    { type: Number, default: null },
  },
  { _id: false },
);

const mfApiMarketCapSchema = new Schema(
  {
    large_cap_pct: { type: Number, default: null },
    mid_cap_pct:   { type: Number, default: null },
    small_cap_pct: { type: Number, default: null },
  },
  { _id: false },
);

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IMfApiScheme extends Document {
  external_key: string;
  external_scheme_id?: string;
  scheme_name: string;
  amc_name?: string;
  scheme_code?: string;
  isin?: string;
  plan_type?: string;
  option_type?: string;
  category?: string;
  sub_category?: string;
  latest_nav?: number | null;
  latest_date?: Date | null;
  latest_info?: mongoose.Schema.Types.Mixed;
  latest_info_raw?: mongoose.Schema.Types.Mixed;
  scheme_objective?: string;
  scheme_manager?: string;
  riskometer_value?: string;
  scheme_inception_date?: Date | null;
  asset_class?: string;
  scheme_benchmark?: string;
  scheme_status?: string;
  minimum_investment?: number | null;
  sip_minimum_amount?: number | null;
  minimum_topup?: number | null;
  exit_load?: string;
  expense_ratio_percentage?: number | null;
  expense_ratio_date?: Date | null;
  scheme_assets?: number | null;
  scheme_asset_date?: Date | null;
  scheme_turnover?: string;
  rating?: string;
  rating_value?: number | null;
  market_cap_largecap_percent?: number | null;
  market_cap_midcap_percent?: number | null;
  market_cap_smallcap_percent?: number | null;
  scheme_inception_return?: number | null;
  benchmark_inception_return?: number | null;
  upmarket_capture_ratio?: number | null;
  downmarket_capture_ratio?: number | null;
  is_dividend_scheme?: boolean | null;
  scheme_performance_list?: mongoose.Schema.Types.Mixed;
  risk_statistics_list?: mongoose.Schema.Types.Mixed;
  scheme_peer_comparision_list?: mongoose.Schema.Types.Mixed;
  raw_payload?: mongoose.Schema.Types.Mixed;
  // ─── Structured extracted fields ─────────────────────────────────────────
  trailing_returns?: {
    "1w"?: number | null; "1m"?: number | null; "3m"?: number | null;
    "6m"?: number | null; "1y"?: number | null; "2y"?: number | null;
    "3y"?: number | null; "5y"?: number | null; "10y"?: number | null;
    since_launch?: number | null; ytd?: number | null; d1?: number | null;
  };
  annual_returns?: {
    ytd?: number | null;
    yearly_returns?: Map<string, number | null> | Record<string, number | null>;
  };
  benchmark_returns?: {
    benchmark_name?: string;
    "1w"?: number | null; "1m"?: number | null; "3m"?: number | null;
    "6m"?: number | null; "1y"?: number | null; "2y"?: number | null;
    "3y"?: number | null; "5y"?: number | null; "10y"?: number | null;
    since_launch?: number | null; ytd?: number | null;
  };
  category_avg_returns?: {
    category_name?: string;
    "1w"?: number | null; "1m"?: number | null; "3m"?: number | null;
    "6m"?: number | null; "1y"?: number | null; "2y"?: number | null;
    "3y"?: number | null; "5y"?: number | null; "10y"?: number | null;
    since_launch?: number | null; ytd?: number | null;
  };
  risk_metrics?: {
    volatility_3y?: number | null; sharpe_3y?: number | null;
    alpha_1y?: number | null; beta_1y?: number | null;
    sortino?: number | null; yield_to_maturity?: number | null;
    average_maturity?: number | null; turnover_ratio?: number | null;
  };
  market_cap?: {
    large_cap_pct?: number | null;
    mid_cap_pct?: number | null;
    small_cap_pct?: number | null;
  };
  nav_change?: number | null;
  nav_change_percentage?: number | null;
  // ─── Sync metadata ───────────────────────────────────────────────────────
  sync_status?: string;
  has_returns_data?: boolean | null;
  last_synced_at?: Date | null;
  last_sync_error?: string;
  is_deleted?: boolean;
  is_active?: boolean;
  is_new?: boolean;
  first_seen_date?: Date;
  created_at: Date;
  updated_at: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const mfApiSchemeSchema = new Schema<IMfApiScheme>(
  {
    external_key:        { type: String, required: true, trim: true, index: true, unique: true },
    external_scheme_id:  { type: String, trim: true, index: true, default: "" },
    scheme_name:         { type: String, required: true, trim: true, index: true },
    amc_name:            { type: String, trim: true, default: "", index: true },
    scheme_code:         { type: String, trim: true, default: "", index: true },
    isin:                { type: String, trim: true, default: "", index: true },
    plan_type:           { type: String, trim: true, default: "" },
    option_type:         { type: String, trim: true, default: "" },
    category:            { type: String, trim: true, default: "" },
    sub_category:        { type: String, trim: true, default: "" },
    latest_nav:          { type: Number, default: null },
    latest_date:         { type: Date, default: null },
    latest_info:         { type: Schema.Types.Mixed, default: null },
    latest_info_raw:     { type: Schema.Types.Mixed, default: null },
    scheme_objective:    { type: String, trim: true, default: "" },
    scheme_manager:      { type: String, trim: true, default: "" },
    riskometer_value:    { type: String, trim: true, default: "" },
    scheme_inception_date: { type: Date, default: null },
    asset_class:         { type: String, trim: true, default: "" },
    scheme_benchmark:    { type: String, trim: true, default: "" },
    scheme_status:       { type: String, trim: true, default: "" },
    minimum_investment:  { type: Number, default: null },
    sip_minimum_amount:  { type: Number, default: null },
    minimum_topup:       { type: Number, default: null },
    exit_load:           { type: String, trim: true, default: "" },
    expense_ratio_percentage: { type: Number, default: null },
    expense_ratio_date:  { type: Date, default: null },
    scheme_assets:       { type: Number, default: null },
    scheme_asset_date:   { type: Date, default: null },
    scheme_turnover:     { type: String, trim: true, default: "" },
    rating:              { type: String, trim: true, default: "" },
    rating_value:        { type: Number, default: null },
    market_cap_largecap_percent: { type: Number, default: null },
    market_cap_midcap_percent:   { type: Number, default: null },
    market_cap_smallcap_percent: { type: Number, default: null },
    scheme_inception_return:     { type: Number, default: null },
    benchmark_inception_return:  { type: Number, default: null },
    upmarket_capture_ratio:      { type: Number, default: null },
    downmarket_capture_ratio:    { type: Number, default: null },
    is_dividend_scheme:          { type: Boolean, default: null },
    // Raw lists kept as-is for backup/inspection
    scheme_performance_list:     { type: Schema.Types.Mixed, default: null },
    risk_statistics_list:        { type: Schema.Types.Mixed, default: null },
    scheme_peer_comparision_list:{ type: Schema.Types.Mixed, default: null },
    raw_payload:                 { type: Schema.Types.Mixed, default: null },
    // ─── Structured extracted fields ───────────────────────────────────────
    trailing_returns:     { type: mfApiTrailingReturnsSchema, default: () => ({}) },
    annual_returns:       { type: mfApiYearlyReturnsSchema, default: () => ({}) },
    benchmark_returns:    { type: mfApiBenchmarkReturnsSchema, default: () => ({}) },
    category_avg_returns: { type: mfApiCategoryAvgReturnsSchema, default: () => ({}) },
    risk_metrics:         { type: mfApiRiskMetricsSchema, default: () => ({}) },
    market_cap:           { type: mfApiMarketCapSchema, default: () => ({}) },
    nav_change:           { type: Number, default: null },
    nav_change_percentage:{ type: Number, default: null },
    // ─── Sync metadata ─────────────────────────────────────────────────────
    sync_status:     { type: String, trim: true, default: "queued", index: true },
    has_returns_data: { type: Boolean, default: null },
    last_synced_at:  { type: Date, default: null, index: true },
    last_sync_error: { type: String, trim: true, default: "" },
    is_deleted:      { type: Boolean, default: false, index: true },
    is_active:       { type: Boolean, default: false, index: true },
    is_new:          { type: Boolean, default: true, index: true },
    first_seen_date: { type: Date, default: () => new Date() },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfApiSchemeSchema.index({ scheme_name: 1, plan_type: 1, option_type: 1 });
mfApiSchemeSchema.index({ amc_name: 1, scheme_name: 1 });
mfApiSchemeSchema.index({ sync_status: 1, last_synced_at: -1 });
mfApiSchemeSchema.index({ is_active: 1, sync_status: 1 });

const MfApiScheme: Model<IMfApiScheme> =
  (mongoose.models.MfApiScheme as Model<IMfApiScheme>) ||
  mongoose.model<IMfApiScheme>("MfApiScheme", mfApiSchemeSchema, "mf_api_schemes");

export default MfApiScheme;
