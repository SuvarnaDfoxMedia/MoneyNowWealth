import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMFAlias extends Document {
  entity_type: string; // 'fund', 'amc', 'category', 'main_category', 'benchmark'
  entity_id: mongoose.Types.ObjectId;
  alias: string;
  normalized_alias: string;
  source: string; // 'auto', 'manual', 'system'
  confidence_score: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const mfAliasSchema = new Schema<IMFAlias>(
  {
    entity_type: { type: String, required: true, index: true },
    entity_id: { type: Schema.Types.ObjectId, required: true, index: true },
    alias: { type: String, required: true, trim: true },
    normalized_alias: { type: String, required: true, trim: true, index: true },
    source: { type: String, default: 'auto' },
    confidence_score: { type: Number, default: 100 },
    is_active: { type: Boolean, default: true }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

// Compound index for quick lookup
mfAliasSchema.index({ entity_type: 1, normalized_alias: 1 });
// Unique constraint so we don't have duplicate aliases for the same entity type
mfAliasSchema.index({ entity_type: 1, normalized_alias: 1, entity_id: 1 }, { unique: true });

const MFAlias: Model<IMFAlias> = mongoose.models.MFAlias || mongoose.model<IMFAlias>("MFAlias", mfAliasSchema, "mfaliases");

export default MFAlias;
