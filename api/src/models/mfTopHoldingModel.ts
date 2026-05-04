import mongoose, { Document, Model, Schema } from "mongoose";

const topHoldingEntrySchema = new Schema(
  {
    name: { type: String, trim: true, default: "" },
    net_assets_pct: { type: Number, default: null },
    market_value: { type: Number, default: null },
    share_amount: { type: Number, default: null },
    share_change: { type: Number, default: null },
    security_type: { type: String, trim: true, default: "" },
    sector: { type: String, trim: true, default: "" },
    maturity: { type: String, trim: true, default: "" },
    credit_quality_india: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

export interface IMFTopHoldingEntry {
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

export interface IMFTopHolding extends Document {
  fund_id?: mongoose.Types.ObjectId | null;
  scheme_code?: string;
  scheme_identity?: string;
  fund_name: string;
  source_standard_name?: string;
  source_isin?: string;
  portfolio_date?: Date | null;
  prev_portfolio_date?: Date | null;
  stock_holdings?: number | null;
  bond_holdings?: number | null;
  assets_top_10_holdings_pct?: number | null;
  turnover_pct?: number | null;
  top_holdings_summary?: string[];
  holdings: IMFTopHoldingEntry[];
  holdings_count: number;
  is_latest: boolean;
  upload_batch_id?: string;
  uploaded_at?: Date;
  snapshot_hash?: string;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mfTopHoldingSchema = new Schema<IMFTopHolding>(
  {
    fund_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MFFund",
      default: null,
      index: true,
    },
    scheme_code: { type: String, trim: true, default: "", index: true },
    scheme_identity: { type: String, trim: true, default: "", index: true },
    fund_name: { type: String, required: true, trim: true, index: true },
    source_standard_name: { type: String, trim: true, default: "" },
    source_isin: { type: String, trim: true, default: "" },
    portfolio_date: { type: Date, default: null, index: true },
    prev_portfolio_date: { type: Date, default: null },
    stock_holdings: { type: Number, default: null },
    bond_holdings: { type: Number, default: null },
    assets_top_10_holdings_pct: { type: Number, default: null },
    turnover_pct: { type: Number, default: null },
    top_holdings_summary: [{ type: String, trim: true }],
    holdings: { type: [topHoldingEntrySchema], default: [] },
    holdings_count: { type: Number, default: 0, index: true },
    is_latest: { type: Boolean, default: false, index: true },
    upload_batch_id: { type: String, trim: true, default: "", index: true },
    uploaded_at: { type: Date, default: Date.now, index: true },
    snapshot_hash: { type: String, trim: true, default: "", index: true },
    is_active: { type: Number, default: 1, index: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfTopHoldingSchema.index({ fund_name: "text", scheme_code: "text", source_standard_name: "text" });
mfTopHoldingSchema.index({ fund_id: 1, portfolio_date: -1, is_deleted: 1 });
mfTopHoldingSchema.index({ scheme_code: 1, portfolio_date: -1, is_deleted: 1 });
mfTopHoldingSchema.index({ scheme_identity: 1, portfolio_date: -1, uploaded_at: -1, _id: -1 });
mfTopHoldingSchema.index({ scheme_identity: 1, is_latest: 1, is_active: 1, is_deleted: 1 });
mfTopHoldingSchema.index({ scheme_identity: 1, portfolio_date: 1, snapshot_hash: 1, is_deleted: 1 });

const MFTopHolding: Model<IMFTopHolding> =
  (mongoose.models.MFTopHolding as Model<IMFTopHolding>) ||
  mongoose.model<IMFTopHolding>("MFTopHolding", mfTopHoldingSchema, "mf_top_holdings");

export default MFTopHolding;
