import mongoose, { Document, Schema, Model } from "mongoose";

const yearValueMapField = { type: Map, of: Number, default: () => ({}) };
const trailingReturnsSchema = new Schema(
  {
    "1w": { type: Number, default: null },
    "1m": { type: Number, default: null },
    "3m": { type: Number, default: null },
    "6m": { type: Number, default: null },
    "1y": { type: Number, default: null },
    "2y": { type: Number, default: null },
    "3y": { type: Number, default: null },
    "5y": { type: Number, default: null },
    "10y": { type: Number, default: null },
    since_launch: { type: Number, default: null },
    ytd: { type: Number, default: null },
  },
  { _id: false },
);
const annualReturnsSchema = new Schema(
  {
    ytd: { type: Number, default: null },
    yearly_returns: yearValueMapField,
  },
  { _id: false },
);
const fundReturnsSchema = new Schema(
  {
    d1: { type: Number, default: null },
    since_inception: { type: Number, default: null },
    trailing: { type: trailingReturnsSchema, default: () => ({}) },
    annual: { type: annualReturnsSchema, default: () => ({}) },
  },
  { _id: false },
);

const frontendVisibilitySchema = new Schema(
  {
    groups: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    fields: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { _id: false },
);

export interface IMFFund extends Document {
  scheme_code?: string;
  isin?: string;
  isin_number?: string;
  mf_api_scheme_id?: mongoose.Types.ObjectId | null;  // ref to MfApiScheme._id
  mf_api_external_key?: string;                        // ref to MfApiScheme.external_key

  mf_api_synced_at?: Date | null;                      // last time API data was pushed into this fund
  fund_name: string;
  amc_id: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  plan_type?: "Regular" | "Direct" | "";
  option_type?: "Growth" | "IDCW" | "";
  nav_Current?: number | null;
  nav_date?: Date | null;
  nav_change?: number | null;
  nav_change_percentage?: number | null;
  aum?: number | null;
  aum_cr?: number | null;
  expense_ratio?: number | null;
  returns?: {
    d1?: number | null;
    since_inception?: number | null;

    trailing?: Record<string, number | null>;
    annual?: {
      ytd?: number | null;
      yearly_returns?: Map<string, number | null> | Record<string, number | null>;
    };
  };
  risk_metrics?: {
    sharpe_3y?: number | null;
    sharpe_5y?: number | null;
    std_dev_3y?: number | null;
    std_dev_5y?: number | null;
    beta_1y?: number | null;
    beta_3y?: number | null;
    beta_5y?: number | null;
    alpha_1y?: number | null;
    alpha_3y?: number | null;
    alpha_5y?: number | null;
    max_drawdown_5y?: number | null;
    max_drawdown_10y?: number | null;
    turnover_ratio?: number | null;
  };
  fund_manager?: string;
  launch_date?: Date | null;
  benchmark_id?: mongoose.Types.ObjectId | null;
  benchmark_index_name?: string;
  benchmark_returns_trailing?: {
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
    ytd?: number | null;
  };
  benchmark_returns_annual?: {
    y1?: number | null;
    y3?: number | null;
    y5?: number | null;
    y10?: number | null;
  };

  benchmark_inception_return?: number | null;
  min_investment?: number | null;
  sip_allowed?: boolean;
  min_sip_investment?: number | null;
  lumpsum_allowed?: boolean;
  min_lumpsum_investment?: number | null;
  exit_load?: string;
  is_featured?: boolean;
  is_popular?: boolean;
  fund_objective?: string;
  investment_strategy?: string;
  domestic_equity_pct?: number | null;
  international_equity_pct?: number | null;
  debt_pct?: number | null;
  other_pct?: number | null;
  gold_pct?: number | null;
  cash_pct?: number | null;
  large_cap_pct?: number | null;
  mid_cap_pct?: number | null;
  small_cap_pct?: number | null;
  tax_type?: string;
  riskometer_label?: string;
  frontend_visibility?: {
    groups?: Map<string, boolean> | Record<string, boolean>;
    fields?: Map<string, boolean> | Record<string, boolean>;
  };
  data_source?: string;
  last_manual_import_at?: Date | null;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mfFundSchema = new Schema<IMFFund>(
  {
    scheme_code: { type: String, trim: true, default: "", index: true },
    isin: { type: String, trim: true, default: "", index: true },
    isin_number: { type: String, trim: true, default: "", index: true },
    mf_api_scheme_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MfApiScheme",
      default: null,
      index: true,
    },
    mf_api_external_key: { type: String, trim: true, default: "", index: true },
    mf_api_synced_at: { type: Date, default: null },
    data_source: { type: String, enum: ["manual", "api_sync"], default: "manual" },
    last_manual_import_at: { type: Date, default: null },
    fund_name: { type: String, required: true, trim: true, index: true },
    amc_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFAmc", required: true, index: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFCategory", required: true, index: true },
    plan_type: { type: String, enum: ["Regular", "Direct", ""], default: "" },
    option_type: { type: String, enum: ["Growth", "IDCW", ""], default: "" },
    nav_Current: { type: Number, default: null },
    nav_date: { type: Date, default: null, index: true },
    nav_change: { type: Number, default: null },
    nav_change_percentage: { type: Number, default: null },
    aum: { type: Number, default: null },
    aum_cr: { type: Number, default: null },
    expense_ratio: { type: Number, default: null },
    returns: fundReturnsSchema,
    risk_metrics: {
      sharpe_3y: { type: Number, default: null },
      sharpe_5y: { type: Number, default: null },
      std_dev_3y: { type: Number, default: null },
      std_dev_5y: { type: Number, default: null },
      beta_1y: { type: Number, default: null },
      beta_3y: { type: Number, default: null },
      beta_5y: { type: Number, default: null },
      alpha_1y: { type: Number, default: null },
      alpha_3y: { type: Number, default: null },
      alpha_5y: { type: Number, default: null },
      max_drawdown_5y: { type: Number, default: null },
      max_drawdown_10y: { type: Number, default: null },
      turnover_ratio: { type: Number, default: null },
    },
    fund_manager: { type: String, trim: true, default: "" },
    launch_date: { type: Date, default: null },
    benchmark_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFBenchmark", default: null, index: true },
    benchmark_index_name: { type: String, trim: true, default: "" },
    benchmark_returns_trailing: {
      "1w": { type: Number, default: null },
      "1m": { type: Number, default: null },
      "3m": { type: Number, default: null },
      "6m": { type: Number, default: null },
      "1y": { type: Number, default: null },
      "2y": { type: Number, default: null },
      "3y": { type: Number, default: null },
      "5y": { type: Number, default: null },
      "10y": { type: Number, default: null },
      since_launch: { type: Number, default: null },
      ytd: { type: Number, default: null },
    },
    benchmark_returns_annual: {
      y1: { type: Number, default: null },
      y3: { type: Number, default: null },
      y5: { type: Number, default: null },
      y10: { type: Number, default: null },
    },

    benchmark_inception_return: { type: Number, default: null },
    min_investment: { type: Number, default: null },
    sip_allowed: { type: Boolean, default: true },
    min_sip_investment: { type: Number, default: null },
    lumpsum_allowed: { type: Boolean, default: true },
    min_lumpsum_investment: { type: Number, default: null },
    exit_load: { type: String, trim: true, default: "" },
    is_featured: { type: Boolean, default: false, index: true },
    is_popular: { type: Boolean, default: false, index: true },
    fund_objective: { type: String, trim: true, default: "" },
    investment_strategy: { type: String, trim: true, default: "" },
    domestic_equity_pct: { type: Number, default: null },
    international_equity_pct: { type: Number, default: null },
    debt_pct: { type: Number, default: null },
    other_pct: { type: Number, default: null },
    gold_pct: { type: Number, default: null },
    cash_pct: { type: Number, default: null },
    large_cap_pct: { type: Number, default: null },
    mid_cap_pct: { type: Number, default: null },
    small_cap_pct: { type: Number, default: null },
    tax_type: { type: String, trim: true, default: "" },
    riskometer_label: { type: String, trim: true, default: "" },
    frontend_visibility: {
      type: frontendVisibilitySchema,
      default: () => ({ groups: {}, fields: {} }),
    },
    is_active: { type: Number, default: 1, index: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfFundSchema.index({ category_id: 1, is_active: 1, is_deleted: 1 });
mfFundSchema.index({ amc_id: 1, is_active: 1, is_deleted: 1 });
mfFundSchema.index({ scheme_code: 1, is_deleted: 1 });
mfFundSchema.index({ isin: 1, is_deleted: 1 });
mfFundSchema.index({ "returns.trailing.1y": -1, "returns.trailing.3y": -1 });
mfFundSchema.index({ expense_ratio: 1, aum_cr: -1 });
mfFundSchema.index({ category_id: 1, "returns.trailing.3y": -1 });
mfFundSchema.index({ is_popular: 1, is_active: 1 });
mfFundSchema.index({ is_featured: 1, is_active: 1 });
mfFundSchema.index({ fund_name: "text", fund_manager: "text", fund_objective: "text" });
mfFundSchema.index({ mf_api_scheme_id: 1, is_deleted: 1 });
mfFundSchema.index({ mf_api_external_key: 1, is_deleted: 1 });

const MFFund: Model<IMFFund> =
  (mongoose.models.MFFund as Model<IMFFund>) ||
  (mongoose.models.MFScheme as Model<IMFFund>) ||
  mongoose.model<IMFFund>("MFFund", mfFundSchema, "mfschemes");

export default MFFund;
