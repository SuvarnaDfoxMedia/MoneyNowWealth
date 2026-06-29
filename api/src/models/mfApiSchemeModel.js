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
// ─── Structured sub-schemas (extracted from raw API response) ────────────────
var mfApiTrailingReturnsSchema = new mongoose_1.Schema({
    "1w": { type: Number, default: null },
    "1m": { type: Number, default: null },
    "3m": { type: Number, default: null },
    "6m": { type: Number, default: null },
    "1y": { type: Number, default: null },
    "2y": { type: Number, default: null }, // from API (new vs old system)
    "3y": { type: Number, default: null },
    "5y": { type: Number, default: null },
    "10y": { type: Number, default: null },
    since_launch: { type: Number, default: null },
    ytd: { type: Number, default: null },
    // d1 (1-day) is NOT provided by AdvisorKhoj API — kept null
    d1: { type: Number, default: null },
}, { _id: false });
var mfApiYearlyReturnsSchema = new mongoose_1.Schema({
    ytd: { type: Number, default: null },
    // yearly_returns: populated by manual import only — AdvisorKhoj does not provide
    yearly_returns: { type: Map, of: Number, default: function () { return ({}); } },
}, { _id: false });
var mfApiBenchmarkReturnsSchema = new mongoose_1.Schema({
    benchmark_name: { type: String, default: "" },
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
var mfApiCategoryAvgReturnsSchema = new mongoose_1.Schema({
    category_name: { type: String, default: "" },
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
var mfApiRiskMetricsSchema = new mongoose_1.Schema({
    volatility_3y: { type: Number, default: null }, // from volatility_cm_3year
    sharpe_3y: { type: Number, default: null }, // from sharpratio_cm_3year
    alpha_1y: { type: Number, default: null }, // from alpha_cm_1year
    beta_1y: { type: Number, default: null }, // from beta_cm_1year
    sortino: { type: Number, default: null }, // from shortino_ratio
    yield_to_maturity: { type: Number, default: null },
    average_maturity: { type: Number, default: null },
    turnover_ratio: { type: Number, default: null },
}, { _id: false });
var mfApiMarketCapSchema = new mongoose_1.Schema({
    large_cap_pct: { type: Number, default: null },
    mid_cap_pct: { type: Number, default: null },
    small_cap_pct: { type: Number, default: null },
}, { _id: false });
// ─── Schema ──────────────────────────────────────────────────────────────────
var mfApiSchemeSchema = new mongoose_1.Schema({
    external_key: { type: String, required: true, trim: true, index: true, unique: true },
    external_scheme_id: { type: String, trim: true, index: true, default: "" },
    scheme_name: { type: String, required: true, trim: true, index: true },
    amc_name: { type: String, trim: true, default: "", index: true },
    scheme_code: { type: String, trim: true, default: "", index: true },
    isin: { type: String, trim: true, default: "", index: true },
    plan_type: { type: String, trim: true, default: "" },
    option_type: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    sub_category: { type: String, trim: true, default: "" },
    latest_nav: { type: Number, default: null },
    latest_date: { type: Date, default: null },
    latest_info: { type: mongoose_1.Schema.Types.Mixed, default: null },
    latest_info_raw: { type: mongoose_1.Schema.Types.Mixed, default: null },
    scheme_objective: { type: String, trim: true, default: "" },
    scheme_manager: { type: String, trim: true, default: "" },
    riskometer_value: { type: String, trim: true, default: "" },
    scheme_inception_date: { type: Date, default: null },
    asset_class: { type: String, trim: true, default: "" },
    scheme_benchmark: { type: String, trim: true, default: "" },
    scheme_status: { type: String, trim: true, default: "" },
    minimum_investment: { type: Number, default: null },
    sip_minimum_amount: { type: Number, default: null },
    minimum_topup: { type: Number, default: null },
    exit_load: { type: String, trim: true, default: "" },
    expense_ratio_percentage: { type: Number, default: null },
    expense_ratio_date: { type: Date, default: null },
    scheme_assets: { type: Number, default: null },
    scheme_asset_date: { type: Date, default: null },
    scheme_turnover: { type: String, trim: true, default: "" },
    rating: { type: String, trim: true, default: "" },
    rating_value: { type: Number, default: null },
    market_cap_largecap_percent: { type: Number, default: null },
    market_cap_midcap_percent: { type: Number, default: null },
    market_cap_smallcap_percent: { type: Number, default: null },
    scheme_inception_return: { type: Number, default: null },
    benchmark_inception_return: { type: Number, default: null },
    upmarket_capture_ratio: { type: Number, default: null },
    downmarket_capture_ratio: { type: Number, default: null },
    is_dividend_scheme: { type: Boolean, default: null },
    // Raw lists kept as-is for backup/inspection
    scheme_performance_list: { type: mongoose_1.Schema.Types.Mixed, default: null },
    risk_statistics_list: { type: mongoose_1.Schema.Types.Mixed, default: null },
    scheme_peer_comparision_list: { type: mongoose_1.Schema.Types.Mixed, default: null },
    raw_payload: { type: mongoose_1.Schema.Types.Mixed, default: null },
    // ─── Structured extracted fields ───────────────────────────────────────
    trailing_returns: { type: mfApiTrailingReturnsSchema, default: function () { return ({}); } },
    annual_returns: { type: mfApiYearlyReturnsSchema, default: function () { return ({}); } },
    benchmark_returns: { type: mfApiBenchmarkReturnsSchema, default: function () { return ({}); } },
    category_avg_returns: { type: mfApiCategoryAvgReturnsSchema, default: function () { return ({}); } },
    risk_metrics: { type: mfApiRiskMetricsSchema, default: function () { return ({}); } },
    market_cap: { type: mfApiMarketCapSchema, default: function () { return ({}); } },
    nav_change: { type: Number, default: null },
    nav_change_percentage: { type: Number, default: null },
    // ─── Sync metadata ─────────────────────────────────────────────────────
    sync_status: { type: String, trim: true, default: "queued", index: true },
    has_returns_data: { type: Boolean, default: null },
    last_synced_at: { type: Date, default: null, index: true },
    last_sync_error: { type: String, trim: true, default: "" },
    is_deleted: { type: Boolean, default: false, index: true },
    is_active: { type: Boolean, default: false, index: true },
    is_new: { type: Boolean, default: true, index: true },
    first_seen_date: { type: Date, default: function () { return new Date(); } },
}, {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});
mfApiSchemeSchema.index({ scheme_name: 1, plan_type: 1, option_type: 1 });
mfApiSchemeSchema.index({ amc_name: 1, scheme_name: 1 });
mfApiSchemeSchema.index({ sync_status: 1, last_synced_at: -1 });
mfApiSchemeSchema.index({ is_active: 1, sync_status: 1 });
var MfApiScheme = mongoose_1.default.models.MfApiScheme ||
    mongoose_1.default.model("MfApiScheme", mfApiSchemeSchema, "mf_api_schemes");
exports.default = MfApiScheme;
