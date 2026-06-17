import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Sub-schema for individual holding entries ────────────────────────────────

const mfApiTopHoldingEntrySchema = new Schema(
  {
    name:                 { type: String, trim: true, default: "" },
    net_assets_pct:       { type: Number, default: null },
    market_value:         { type: Number, default: null },
    share_amount:         { type: Number, default: null },
    share_change:         { type: Number, default: null },
    security_type:        { type: String, trim: true, default: "" },
    sector:               { type: String, trim: true, default: "" },
    maturity:             { type: String, trim: true, default: "" },
    credit_quality_india: { type: String, trim: true, default: "" },
    country:              { type: String, trim: true, default: "" },
  },
  { _id: false },
);

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IMfApiTopHoldingEntry {
  name?: string;
  net_assets_pct?: number | null;
  market_value?: number | null;
  share_amount?: number | null;
  share_change?: number | null;
  security_type?: string;
  sector?: string;
  maturity?: string;
  credit_quality_india?: string;
  country?: string;
}

export interface IMfApiTopHolding extends Document {
  mf_api_scheme_id: mongoose.Types.ObjectId;
  external_key: string;
  scheme_name: string;
  portfolio_date?: Date | null;
  prev_portfolio_date?: Date | null;
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
  holdings: IMfApiTopHoldingEntry[];
  holdings_count: number;
  is_latest: boolean;
  upload_batch_id?: string;
  uploaded_at?: Date;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const mfApiTopHoldingSchema = new Schema<IMfApiTopHolding>(
  {
    mf_api_scheme_id: { type: Schema.Types.ObjectId, ref: "MfApiScheme", required: true, index: true },
    external_key:     { type: String, trim: true, default: "", index: true },
    scheme_name:      { type: String, required: true, trim: true, index: true },
    portfolio_date:   { type: Date, default: null, index: true },
    prev_portfolio_date: { type: Date, default: null },
    stock_holdings:   { type: Number, default: null },
    bond_holdings:    { type: Number, default: null },
    assets_top_10_holdings_pct: { type: Number, default: null },
    turnover_pct:     { type: Number, default: null },
    asset_allocation: {
      domestic_equity_pct:     { type: Number, default: null },
      international_equity_pct:{ type: Number, default: null },
      debt_pct:                { type: Number, default: null },
      other_pct:               { type: Number, default: null },
      gold_pct:                { type: Number, default: null },
      cash_pct:                { type: Number, default: null },
    },
    market_cap_allocation: {
      large_cap_pct: { type: Number, default: null },
      mid_cap_pct:   { type: Number, default: null },
      small_cap_pct: { type: Number, default: null },
    },
    snapshot_month: { type: Number, default: null, index: true },
    snapshot_year:  { type: Number, default: null, index: true },
    holdings:       { type: [mfApiTopHoldingEntrySchema], default: [] },
    holdings_count: { type: Number, default: 0, index: true },
    is_latest:      { type: Boolean, default: false, index: true },
    upload_batch_id:{ type: String, trim: true, default: "", index: true },
    uploaded_at:    { type: Date, default: Date.now, index: true },
    is_active:      { type: Number, default: 1, index: true },
    is_deleted:     { type: Boolean, default: false, index: true },
    deleted_at:     { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfApiTopHoldingSchema.index({ mf_api_scheme_id: 1, portfolio_date: -1, is_deleted: 1 });
mfApiTopHoldingSchema.index({ external_key: 1, portfolio_date: -1, is_deleted: 1 });
mfApiTopHoldingSchema.index({ mf_api_scheme_id: 1, is_latest: 1, is_active: 1, is_deleted: 1 });

const MfApiTopHolding: Model<IMfApiTopHolding> =
  mongoose.models.MfApiTopHolding ||
  mongoose.model<IMfApiTopHolding>(
    "MfApiTopHolding",
    mfApiTopHoldingSchema,
    "mf_api_top_holdings",
  );

export default MfApiTopHolding;
