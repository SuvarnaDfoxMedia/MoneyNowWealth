"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importStar(require("mongoose"));
var yearValueMapField = { type: Map, of: Number, default: function () { return ({}); } };
var trailingReturnsSchema = new mongoose_1.Schema({
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
}, { _id: false });
var annualReturnsSchema = new mongoose_1.Schema({
    ytd: { type: Number, default: null },
    yearly_returns: yearValueMapField,
}, { _id: false });
var fundReturnsSchema = new mongoose_1.Schema({
    d1: { type: Number, default: null },
    since_inception: { type: Number, default: null },
    trailing: { type: trailingReturnsSchema, default: function () { return ({}); } },
    annual: { type: annualReturnsSchema, default: function () { return ({}); } },
}, { _id: false });
var frontendVisibilitySchema = new mongoose_1.Schema({
    groups: {
        type: mongoose_1.Schema.Types.Mixed,
        default: function () { return ({}); },
    },
    fields: {
        type: mongoose_1.Schema.Types.Mixed,
        default: function () { return ({}); },
    },
}, { _id: false });
var mfFundSchema = new mongoose_1.Schema({
    scheme_code: { type: String, trim: true, default: "", index: true },
    isin: { type: String, trim: true, default: "", index: true },
    isin_number: { type: String, trim: true, default: "", index: true },
    mf_api_scheme_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "MfApiScheme",
        default: null,
        index: true,
    },
    mf_api_external_key: { type: String, trim: true, default: "", index: true },
    mf_api_synced_at: { type: Date, default: null },
    data_source: { type: String, enum: ["manual", "api_sync"], default: "manual" },
    last_manual_import_at: { type: Date, default: null },
    fund_name: { type: String, required: true, trim: true, index: true },
    amc_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "MFAmc", required: true, index: true },
    category_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "MFCategory", required: true, index: true },
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
        sortino: { type: Number, default: null },
        yield_to_maturity: { type: Number, default: null },
        average_maturity: { type: Number, default: null },
    },
    fund_manager: { type: String, trim: true, default: "" },
    launch_date: { type: Date, default: null },
    benchmark_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "MFBenchmark", default: null, index: true },
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
    rating: { type: String, trim: true, default: "" },
    rating_value: { type: Number, default: null },
    upmarket_capture_ratio: { type: Number, default: null },
    downmarket_capture_ratio: { type: Number, default: null },
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
        default: function () { return ({ groups: {}, fields: {} }); },
    },
    is_active: { type: Number, default: 1, index: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
}, {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});
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
var MFFund = mongoose_1.default.models.MFFund ||
    mongoose_1.default.models.MFScheme ||
    mongoose_1.default.model("MFFund", mfFundSchema, "mfschemes");
exports.default = MFFund;
