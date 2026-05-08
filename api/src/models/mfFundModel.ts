import mongoose, { Document, Schema, Model } from "mongoose";

const yearValueMapField = { type: Map, of: Number, default: () => ({}) };
const trailingReturnsSchema = new Schema(
  {
    "1w": { type: Number, default: null },
    "1m": { type: Number, default: null },
    "3m": { type: Number, default: null },
    "6m": { type: Number, default: null },
    "1y": { type: Number, default: null },
    "3y": { type: Number, default: null },
    "5y": { type: Number, default: null },
    "10y": { type: Number, default: null },
    since_launch: { type: Number, default: null },
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

const MFFund: Model<IMFFund> =
  (mongoose.models.MFFund as Model<IMFFund>) ||
  (mongoose.models.MFScheme as Model<IMFFund>) ||
  mongoose.model<IMFFund>("MFFund", mfFundSchema, "mfschemes");

export default MFFund;
