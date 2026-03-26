import mongoose, { Document, Schema, Model } from "mongoose";
import { capitalizePlugin } from "../plugins/capitalize.plugin";

/* ===============================
   Interface: Financial Assessment
   =============================== */
export interface IFinancialAssessment extends Document {
  // Lead Info
  name: string;
  email: string;
  phone: string;

  // User Inputs
  gender?: string;
  age?: number;
  monthly_income?: number;
  monthly_expenses?: number;
  loans?: number;
  investments?: number;
  goals?: string[];

  // Calculated Metrics
  savings?: number;
  savings_ratio?: number;
  loan_ratio?: number;

  // Result
  score: number;
  category: "Needs Attention" | "Average" | "Good" | "Excellent";

  // Report (4 Pillars)
  wealth_creation: string;
  wealth_protection: string;
  wealth_restructuring: string;
  wealth_distribution: string;

  // Chart Data (for graphs)
  chart_data?: {
    savings_score: number;
    investment_score: number;
    protection_score: number;
    distribution_score: number;
  };

  // PDF
  pdf_file?: string;
  pdf_generated: boolean;

  // Tracking
  lead_source: string;
  is_contacted: boolean;

  // Audit
  is_active: boolean;
  is_deleted: boolean;
  deleted_at?: Date;

  created_at: Date;
  updated_at: Date;
}

/* ===============================
   Schema Definition
   =============================== */
const financialAssessmentSchema = new Schema<IFinancialAssessment>(
  {
    // Lead Info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // User Inputs
    gender: {
      type: String,
      trim: true,
    },

    age: {
      type: Number,
    },

    monthly_income: {
      type: Number,
    },

    monthly_expenses: {
      type: Number,
    },

    loans: {
      type: Number,
      default: 0,
    },

    investments: {
      type: Number,
      default: 0,
    },

    goals: [
      {
        type: String,
        trim: true,
      },
    ],

    // Calculated Metrics
    savings: {
      type: Number,
      default: 0,
    },

    savings_ratio: {
      type: Number,
      default: 0,
    },

    loan_ratio: {
      type: Number,
      default: 0,
    },

    // Result
    score: {
      type: Number,
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: ["Needs Attention", "Average", "Good", "Excellent"],
      required: true,
      index: true,
    },

    // Report (4 pillars)
    wealth_creation: {
      type: String,
      default: "",
    },

    wealth_protection: {
      type: String,
      default: "",
    },

    wealth_restructuring: {
      type: String,
      default: "",
    },

    wealth_distribution: {
      type: String,
      default: "",
    },

    // Chart Data
    chart_data: {
      savings_score: { type: Number, default: 0 },
      investment_score: { type: Number, default: 0 },
      protection_score: { type: Number, default: 0 },
      distribution_score: { type: Number, default: 0 },
    },

    // PDF
    pdf_file: {
      type: String,
      trim: true,
    },

    pdf_generated: {
      type: Boolean,
      default: false,
    },

    // Tracking
    lead_source: {
      type: String,
      default: "financial_assessment",
      index: true,
    },

    is_contacted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Soft delete
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },

    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ===============================
   Capitalization Plugin
   =============================== */
financialAssessmentSchema.plugin(capitalizePlugin, {
  except: [
    "email",
    "phone",

    "monthly_income",
    "monthly_expenses",
    "loans",
    "investments",

    "savings",
    "savings_ratio",
    "loan_ratio",

    "score",
    "chart_data",

    "pdf_file",
    "pdf_generated",

    "is_contacted",
    "is_active",
    "is_deleted",

    "created_at",
    "updated_at",
    "deleted_at",

    "_id",
    "__v",
  ],
  descriptionFields: [
    "wealth_creation",
    "wealth_protection",
    "wealth_restructuring",
    "wealth_distribution",
  ],
});

/* ===============================
   Virtual: Public PDF URL
   =============================== */
financialAssessmentSchema.virtual("pdf_url").get(function () {
  if (!this.pdf_file) return null;
  return `/uploads/financial-reports/${this.pdf_file}`;
});

/* ===============================
   Virtual: Is High Quality Lead
   =============================== */
financialAssessmentSchema.virtual("is_high_value").get(function () {
  return this.score >= 70;
});

/* ===============================
   Indexes for performance
   =============================== */
financialAssessmentSchema.index({ email: 1, created_at: -1 });
financialAssessmentSchema.index({ score: -1 });
financialAssessmentSchema.index({ is_deleted: 1, is_active: 1 });
financialAssessmentSchema.index({ lead_source: 1, created_at: -1 });

/* ===============================
   Model Export
   =============================== */
const FinancialAssessment: Model<IFinancialAssessment> =
  mongoose.models.FinancialAssessment ||
  mongoose.model<IFinancialAssessment>(
    "FinancialAssessment",
    financialAssessmentSchema,
  );

export default FinancialAssessment;
