import mongoose, { Document, Schema, Model } from "mongoose";

const yearValueMapField = {
  type: Map,
  of: Number,
  default: () => ({}),
};

const fundReturnsSchema = new Schema(
  {
    d1: { type: Number, default: null },
    w1: { type: Number, default: null },
    m1: { type: Number, default: null },
    m3: { type: Number, default: null },
    m6: { type: Number, default: null },
    y1: { type: Number, default: null },
    y3_cagr: { type: Number, default: null },
    y5_cagr: { type: Number, default: null },
    y10_cagr: { type: Number, default: null },
    ytd: { type: Number, default: null },
    since_inception: { type: Number, default: null },
    annual: yearValueMapField,
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
  fund_name: string;
  amc_id: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  plan_type?: "Regular" | "Direct" | "";
  option_type?: "Growth" | "IDCW" | "";
  nav_Current?: number | null;
  nav_date?: Date | null;
  aum?: number | null;
  aum_cr?: number | null;
  expense_ratio?: number | null;
  returns?: {
    d1?: number | null;
    w1?: number | null;
    m1?: number | null;
    m3?: number | null;
    m6?: number | null;
    y1?: number | null;
    y3_cagr?: number | null;
    y5_cagr?: number | null;
    y10_cagr?: number | null;
    ytd?: number | null;
    since_inception?: number | null;
    annual?: Map<string, number | null> | Record<string, number | null>;
  };
  risk_metrics?: {
    sharpe_3y?: number | null;
    sharpe_5y?: number | null;
    std_dev_3y?: number | null;
    std_dev_5y?: number | null;
    beta_3y?: number | null;
    beta_5y?: number | null;
    alpha_3y?: number | null;
    alpha_5y?: number | null;
    max_drawdown_5y?: number | null;
    max_drawdown_10y?: number | null;
    turnover_ratio?: number | null;
  };
  fund_manager?: string;
  launch_date?: Date | null;
  benchmark_id?: mongoose.Types.ObjectId | null;
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
  top_holdings?: string[];
  asset_allocation?: {
    domestic_equity_pct?: number | null;
    international_equity_pct?: number | null;
    equity_pct?: number | null;
    debt_pct?: number | null;
    other_pct?: number | null;
    gold_pct?: number | null;
    cash_pct?: number | null;
  };
  equity_allocation?: {
    large_cap_pct?: number | null;
    mid_cap_pct?: number | null;
    small_cap_pct?: number | null;
  };
  tax_type?: string;
  riskometer_label?: string;
  frontend_visibility?: {
    groups?: Map<string, boolean> | Record<string, boolean>;
    fields?: Map<string, boolean> | Record<string, boolean>;
  };
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
    fund_name: { type: String, required: true, trim: true, index: true },
    amc_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFAmc", required: true, index: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFCategory", required: true, index: true },
    plan_type: { type: String, enum: ["Regular", "Direct", ""], default: "" },
    option_type: { type: String, enum: ["Growth", "IDCW", ""], default: "" },
    nav_Current: { type: Number, default: null },
    nav_date: { type: Date, default: null, index: true },
    aum: { type: Number, default: null },
    aum_cr: { type: Number, default: null },
    expense_ratio: { type: Number, default: null },
    returns: { type: fundReturnsSchema, default: () => ({}) },
    risk_metrics: {
      sharpe_3y: { type: Number, default: null },
      sharpe_5y: { type: Number, default: null },
      std_dev_3y: { type: Number, default: null },
      std_dev_5y: { type: Number, default: null },
      beta_3y: { type: Number, default: null },
      beta_5y: { type: Number, default: null },
      alpha_3y: { type: Number, default: null },
      alpha_5y: { type: Number, default: null },
      max_drawdown_5y: { type: Number, default: null },
      max_drawdown_10y: { type: Number, default: null },
      turnover_ratio: { type: Number, default: null },
    },
    fund_manager: { type: String, trim: true, default: "" },
    launch_date: { type: Date, default: null },
    benchmark_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFBenchmark", default: null, index: true },
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
    top_holdings: [{ type: String, trim: true }],
    asset_allocation: {
      domestic_equity_pct: { type: Number, default: null },
      international_equity_pct: { type: Number, default: null },
      equity_pct: { type: Number, default: null },
      debt_pct: { type: Number, default: null },
      other_pct: { type: Number, default: null },
      gold_pct: { type: Number, default: null },
      cash_pct: { type: Number, default: null },
    },
    equity_allocation: {
      large_cap_pct: { type: Number, default: null },
      mid_cap_pct: { type: Number, default: null },
      small_cap_pct: { type: Number, default: null },
    },
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
mfFundSchema.index({ "returns.y1": -1, "returns.y3_cagr": -1 });
mfFundSchema.index({ expense_ratio: 1, aum_cr: -1 });
mfFundSchema.index({ category_id: 1, "returns.y3_cagr": -1 });
mfFundSchema.index({ is_popular: 1, is_active: 1 });
mfFundSchema.index({ is_featured: 1, is_active: 1 });
mfFundSchema.index({ fund_name: "text", fund_manager: "text", fund_objective: "text" });

const MFFund: Model<IMFFund> =
  (mongoose.models.MFFund as Model<IMFFund>) ||
  (mongoose.models.MFScheme as Model<IMFFund>) ||
  mongoose.model<IMFFund>("MFFund", mfFundSchema, "mfschemes");

export default MFFund;
