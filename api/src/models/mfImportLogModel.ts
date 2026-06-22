import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMfImportLog extends Omit<mongoose.Document, "errors"> {
  source: "manual_import" | "api_sync";
  entity: string;          // e.g. "full-workbook", "funds", "top-holdings"
  file_name?: string;      // original workbook filename (manual only)
  started_at: Date;
  completed_at?: Date | null;
  duration_ms?: number | null;
  sheets_processed: string[];
  rows_processed: number;
  summary: {
    mainCategories?: { inserted: number; updated: number; skipped: number; errors: number };
    categories?:     { inserted: number; updated: number; skipped: number; errors: number };
    amcs?:           { inserted: number; updated: number; skipped: number; errors: number };
    funds?:          { inserted: number; updated: number; skipped: number; errors: number };
    benchmarks?:     { inserted: number; updated: number; skipped: number; errors: number };
    benchmarkReturns?: { inserted: number; updated: number; skipped: number; errors: number };
    nfos?:           { inserted: number; updated: number; skipped: number; errors: number };
    indexSnapshots?: { inserted: number; updated: number; skipped: number; errors: number };
    topHoldings?:    { inserted: number; updated: number; skipped: number; errors: number };
  };
  error_count: number;
  skip_count: number;
  errors: Array<{ sheet: string; row: number; message: string; identifier?: string }>;
  skips:  Array<{ sheet: string; row: number; reason: string;  identifier?: string }>;
  validate_only: boolean;
  force_manual_top_holdings?: boolean;
  triggered_by?: string; // user ID or "api_sync_job"
  created_at: Date;
  updated_at: Date;
}

const sectionSchema = new Schema(
  {
    inserted: { type: Number, default: 0 },
    updated:  { type: Number, default: 0 },
    skipped:  { type: Number, default: 0 },
    errors:   { type: Number, default: 0 },
  },
  { _id: false },
);

const mfImportLogSchema = new Schema<IMfImportLog>(
  {
    source:     { type: String, enum: ["manual_import", "api_sync"], required: true, index: true },
    entity:     { type: String, required: true, index: true },
    file_name:  { type: String, trim: true, default: "" },
    started_at: { type: Date, required: true, index: true },
    completed_at: { type: Date, default: null },
    duration_ms:  { type: Number, default: null },
    sheets_processed: [{ type: String }],
    rows_processed:   { type: Number, default: 0 },
    summary: {
      mainCategories:  { type: sectionSchema, default: () => ({}) },
      categories:      { type: sectionSchema, default: () => ({}) },
      amcs:            { type: sectionSchema, default: () => ({}) },
      funds:           { type: sectionSchema, default: () => ({}) },
      benchmarks:      { type: sectionSchema, default: () => ({}) },
      benchmarkReturns:{ type: sectionSchema, default: () => ({}) },
      nfos:            { type: sectionSchema, default: () => ({}) },
      indexSnapshots:  { type: sectionSchema, default: () => ({}) },
      topHoldings:     { type: sectionSchema, default: () => ({}) },
    },
    error_count: { type: Number, default: 0, index: true },
    skip_count:  { type: Number, default: 0 },
    errors: [
      {
        sheet:      { type: String },
        row:        { type: Number },
        message:    { type: String },
        identifier: { type: String },
        _id: false,
      },
    ],
    skips: [
      {
        sheet:      { type: String },
        row:        { type: Number },
        reason:     { type: String },
        identifier: { type: String },
        _id: false,
      },
    ],
    validate_only:               { type: Boolean, default: false },
    force_manual_top_holdings:   { type: Boolean, default: false },
    triggered_by: { type: String, trim: true, default: "" },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

mfImportLogSchema.index({ source: 1, started_at: -1 });
mfImportLogSchema.index({ entity: 1, started_at: -1 });

const MfImportLog: Model<IMfImportLog> =
  mongoose.models.MfImportLog ||
  mongoose.model<IMfImportLog>("MfImportLog", mfImportLogSchema, "mfimportlogs");

export default MfImportLog;

