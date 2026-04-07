import mongoose, { Document, Schema, Model } from "mongoose";

export interface IMFFund extends Document {
  scheme_code?: string;
  fund_name: string;
  amc_id: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  plan_type?: "Regular" | "Direct" | "";
  option_type?: "Growth" | "IDCW" | "";
  aum_cr?: number | null;
  expense_ratio?: number | null;
  returns?: {
    d1?: number | null;
    m1?: number | null;
    m3?: number | null;
    m6?: number | null;
    y1?: number | null;
    y3_cagr?: number | null;
    y5_cagr?: number | null;
    y10_cagr?: number | null;
  };
  risk_metrics?: {
    sharpe_3y?: number | null;
    std_dev_3y?: number | null;
    beta_3y?: number | null;
    alpha_3y?: number | null;
    max_drawdown_5y?: number | null;
    turnover_ratio?: number | null;
  };
  fund_manager?: string;
  launch_date?: Date | null;
  benchmark_index_name?: string;
  benchmark_returns_trailing?: {
    d1?: number | null;
    m1?: number | null;
    m3?: number | null;
    m6?: number | null;
    y1?: number | null;
    y3?: number | null;
    y5?: number | null;
    y10?: number | null;
  };
  benchmark_returns_annual?: {
    y1?: number | null;
    y3?: number | null;
    y5?: number | null;
    y10?: number | null;
  };
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
    equity_pct?: number | null;
    debt_pct?: number | null;
    other_pct?: number | null;
  };
  tax_type?: string;
  riskometer_label?: string;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mfFundSchema = new Schema<IMFFund>(
  {
    scheme_code: { type: String, trim: true, default: "", index: true },
    fund_name: { type: String, required: true, trim: true, index: true },
    amc_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFAmc", required: true, index: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "MFCategory", required: true, index: true },
    plan_type: { type: String, enum: ["Regular", "Direct", ""], default: "" },
    option_type: { type: String, enum: ["Growth", "IDCW", ""], default: "" },
    aum_cr: { type: Number, default: null },
    expense_ratio: { type: Number, default: null },
    returns: {
      d1: { type: Number, default: 0 },
      m1: { type: Number, default: 0 },
      m3: { type: Number, default: 0 },
      m6: { type: Number, default: 0 },
      y1: { type: Number, default: null },
      y3_cagr: { type: Number, default: null },
      y5_cagr: { type: Number, default: null },
      y10_cagr: { type: Number, default: null },
    },
    risk_metrics: {
      sharpe_3y: { type: Number, default: null },
      std_dev_3y: { type: Number, default: null },
      beta_3y: { type: Number, default: null },
      alpha_3y: { type: Number, default: null },
      max_drawdown_5y: { type: Number, default: null },
      turnover_ratio: { type: Number, default: null },
    },
    fund_manager: { type: String, trim: true, default: "" },
    launch_date: { type: Date, default: null },
    benchmark_index_name: { type: String, trim: true, default: "" },
    benchmark_returns_trailing: {
      d1: { type: Number, default: 0 },
      m1: { type: Number, default: 0 },
      m3: { type: Number, default: 0 },
      m6: { type: Number, default: 0 },
      y1: { type: Number, default: null },
      y3: { type: Number, default: null },
      y5: { type: Number, default: null },
      y10: { type: Number, default: null },
    },
    benchmark_returns_annual: {
      y1: { type: Number, default: null },
      y3: { type: Number, default: null },
      y5: { type: Number, default: null },
      y10: { type: Number, default: null },
    },
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
      equity_pct: { type: Number, default: null },
      debt_pct: { type: Number, default: null },
      other_pct: { type: Number, default: null },
    },
    tax_type: { type: String, trim: true, default: "" },
    riskometer_label: { type: String, trim: true, default: "" },
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
