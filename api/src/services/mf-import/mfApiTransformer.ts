import { WorkbookDTO } from "../../types/mfImportDto";
import { parseCategoryPath } from "../../utils/categoryParser";
import { normalizeDateOnly } from "../navCalculationService";

type MfPrimitive = string | number | boolean | Date | null | undefined;
type MfDatePrimitive = string | number | Date | null | undefined;

interface MfApiReturnBucket {
  d1?: MfPrimitive;
  "1w"?: MfPrimitive;
  "1m"?: MfPrimitive;
  "3m"?: MfPrimitive;
  "6m"?: MfPrimitive;
  "1y"?: MfPrimitive;
  "2y"?: MfPrimitive;
  "3y"?: MfPrimitive;
  "5y"?: MfPrimitive;
  "10y"?: MfPrimitive;
  since_launch?: MfPrimitive;
  ytd?: MfPrimitive;
  benchmark_name?: string;
}

interface MfApiSchemeRow {
  scheme_name?: string;
  scheme_code?: string;
  isin?: string;
  amc_name?: string;
  amc?: string;
  category?: string;
  scheme_benchmark?: string;
  plan_type?: string;
  option_type?: string;
  latest_nav?: MfPrimitive;
  latest_date?: MfDatePrimitive;
  nav_change?: MfPrimitive;
  nav_change_percentage?: MfPrimitive;
  scheme_assets?: MfPrimitive;
  expense_ratio_percentage?: MfPrimitive;
  scheme_manager?: string;
  scheme_objective?: string;
  scheme_inception_date?: MfDatePrimitive;
  exit_load?: string;
  rating?: string;
  rating_value?: MfPrimitive;
  upmarket_capture_ratio?: MfPrimitive;
  downmarket_capture_ratio?: MfPrimitive;
  scheme_turnover?: MfPrimitive;
  minimum_investment?: MfPrimitive;
  sip_minimum_amount?: MfPrimitive;
  minimum_topup?: MfPrimitive;
  riskometer_value?: string;
  market_cap_largecap_percent?: MfPrimitive;
  market_cap_midcap_percent?: MfPrimitive;
  market_cap_smallcap_percent?: MfPrimitive;
  scheme_inception_return?: MfPrimitive;
  benchmark_inception_return?: MfPrimitive;
  latest_info?: unknown;
  trailing_returns?: unknown;
  risk_metrics?: unknown;
  market_cap?: unknown;
  benchmark_returns?: unknown;
  category_avg_returns?: unknown;
  scheme_performance_list?: unknown;
  risk_statistics_list?: unknown;
  scheme_peer_comparision_list?: unknown;
}

type MfApiKnownReturns = MfApiReturnBucket;

interface MfApiKnownRiskMetrics {
    sharpe_3y?: MfPrimitive;
    alpha_1y?: MfPrimitive;
    beta_1y?: MfPrimitive;
    volatility_3y?: MfPrimitive;
    turnover_ratio?: MfPrimitive;
    sortino?: MfPrimitive;
    yield_to_maturity?: MfPrimitive;
    average_maturity?: MfPrimitive;
}

export class MfApiTransformer {
  static transformScheme(apiScheme: MfApiSchemeRow): Partial<WorkbookDTO> {
    const dto: Partial<WorkbookDTO> = {
      funds: [],
      amcs: [],
      categories: [],
      benchmarks: [],
      benchmarkReturns: [],
      mainCategories: []
    };

    const toN = (v: MfPrimitive) => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(String(v).replace(/,/g, "").replace(/%/g, "").trim());
      return Number.isFinite(n) ? n : null;
    };

    const toD = (v: MfDatePrimitive) => {
      if (!v) return null;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const tr = (apiScheme.trailing_returns && typeof apiScheme.trailing_returns === "object"
      ? apiScheme.trailing_returns
      : {}) as MfApiKnownReturns;
    const rm = (apiScheme.risk_metrics && typeof apiScheme.risk_metrics === "object"
      ? apiScheme.risk_metrics
      : {}) as MfApiKnownRiskMetrics;
    const mc = (apiScheme.market_cap && typeof apiScheme.market_cap === "object"
      ? apiScheme.market_cap
      : {}) as {
        large_cap_pct?: MfPrimitive;
        mid_cap_pct?: MfPrimitive;
        small_cap_pct?: MfPrimitive;
      };
    const br = (apiScheme.benchmark_returns && typeof apiScheme.benchmark_returns === "object"
      ? apiScheme.benchmark_returns
      : {}) as MfApiKnownReturns;
    const cr = (apiScheme.category_avg_returns && typeof apiScheme.category_avg_returns === "object"
      ? apiScheme.category_avg_returns
      : {}) as MfApiKnownReturns;
    const latestInfo = (apiScheme.latest_info && typeof apiScheme.latest_info === "object"
      ? apiScheme.latest_info
      : null) as { nav_change?: MfPrimitive; nav_change_percentage?: MfPrimitive } | null;

    const amcName = String(apiScheme.amc_name || apiScheme.amc || "").trim();
    if (amcName) {
      dto.amcs!.push({ name: amcName });
    }

    const categoryRaw = String(apiScheme.category || "").trim();
    const parsed = categoryRaw ? parseCategoryPath(categoryRaw) : null;
    // Use the clean sub-category name (e.g. "Ultra Short Duration") not the full path ("Debt: Ultra Short Duration")
    const categoryName = parsed ? parsed.categoryName : "";
    const mainCategoryName = parsed ? parsed.mainCategoryName : "";
    if (categoryName) {
      // Ensure main category exists in the DTO so processWorkbook can resolve it
      if (mainCategoryName && mainCategoryName !== categoryName) {
        dto.mainCategories!.push({ name: mainCategoryName });
      }
      const categoryAvg = {
        trailing: {
          "1w": toN(cr["1w"]),
          "1m": toN(cr["1m"]),
          "3m": toN(cr["3m"]),
          "6m": toN(cr["6m"]),
          "1y": toN(cr["1y"]),
          "2y": toN(cr["2y"]),
          "3y": toN(cr["3y"]),
          "5y": toN(cr["5y"]),
          "10y": toN(cr["10y"]),
          since_launch: toN(cr.since_launch),
          ytd: toN(cr.ytd),
        }
      };
      dto.categories!.push({
        name: categoryName,
        mainCategoryName,
        category_average_returns: categoryAvg,
        category_returns: categoryAvg,
      });
    }

    const benchmarkIndexName = String(apiScheme.scheme_benchmark || br.benchmark_name || "").trim();
    if (benchmarkIndexName) {
      dto.benchmarks!.push({
        benchmark_index_name: benchmarkIndexName,
        categoryName,
        // we omit mainCategoryName because API doesn't provide it reliably
      });

      if (br) {
        const trailing = {
          "1w": toN(br["1w"]),
          "1m": toN(br["1m"]),
          "3m": toN(br["3m"]),
          "6m": toN(br["6m"]),
          "1y": toN(br["1y"]),
          "2y": toN(br["2y"]),
          "3y": toN(br["3y"]),
          "5y": toN(br["5y"]),
          "10y": toN(br["10y"]),
          since_launch: toN(br.since_launch),
          ytd: toN(br.ytd),
        };
        const hasData = Object.values(trailing).some(v => v !== null && v !== undefined);
        if (hasData) {
          dto.benchmarkReturns!.push({
            benchmarkIndexName,
            date: normalizeDateOnly(toD(apiScheme.latest_date) || new Date()),
            trailing,
            annual: {
              ytd: toN(br.ytd),
            }
          });
        }
      }
    }

    const schemeName = String(apiScheme.scheme_name || "").trim();
    if (schemeName) {
      // Determine plan and option types safely
      const plan_type = String(apiScheme.plan_type || "").toLowerCase().includes("direct") ? "Direct" : "Regular";
      let option_type = "Growth";
      const optStr = String(apiScheme.option_type || schemeName).toLowerCase();
      if (optStr.includes("idcw") || optStr.includes("dividend")) option_type = "IDCW";

      dto.funds!.push({
        scheme_code: String(apiScheme.scheme_code || ""),
        fund_name: schemeName,
        isin: String(apiScheme.isin || ""),
        isin_number: String(apiScheme.isin || ""),           // MFFund has both isin and isin_number
        plan_type,
        option_type,
        amcName,
        categoryName,          // now the clean sub-name, e.g. "Ultra Short Duration"
        mainCategoryName,      // needed by Fix 2b: fund upsert category fallback
        benchmarkIndexName,
        nav_Current: toN(apiScheme.latest_nav),
        nav_date: toD(apiScheme.latest_date),
        nav_change: toN(apiScheme.nav_change ?? latestInfo?.nav_change),
        nav_change_percentage: toN(apiScheme.nav_change_percentage ?? latestInfo?.nav_change_percentage),
        aum_cr: toN(apiScheme.scheme_assets),
        expense_ratio: toN(apiScheme.expense_ratio_percentage),
        fund_manager: String(apiScheme.scheme_manager || "").trim(),
        fund_objective: String(apiScheme.scheme_objective || "").trim(),
        launch_date: toD(apiScheme.scheme_inception_date),
        exit_load: String(apiScheme.exit_load || "").trim(),
        rating: String(apiScheme.rating || "").trim(),
        rating_value: toN(apiScheme.rating_value),
        upmarket_capture_ratio: toN(apiScheme.upmarket_capture_ratio),
        downmarket_capture_ratio: toN(apiScheme.downmarket_capture_ratio),
        min_investment: toN(apiScheme.minimum_investment),
        minimum_sip_investment: toN(apiScheme.sip_minimum_amount),
        min_sip_investment: toN(apiScheme.sip_minimum_amount),
        min_lumpsum_investment: toN(apiScheme.minimum_topup),
        sip_allowed: apiScheme.sip_minimum_amount != null ? true : undefined,
        lumpsum_allowed: apiScheme.minimum_investment != null ? true : undefined,
        riskometer_label: String(apiScheme.riskometer_value || "").trim(),
        
        large_cap_pct: toN(mc.large_cap_pct ?? apiScheme.market_cap_largecap_percent),
        mid_cap_pct: toN(mc.mid_cap_pct ?? apiScheme.market_cap_midcap_percent),
        small_cap_pct: toN(mc.small_cap_pct ?? apiScheme.market_cap_smallcap_percent),
        
        scheme_performance_list: apiScheme.scheme_performance_list ?? null,
        risk_statistics_list: apiScheme.risk_statistics_list ?? null,
        scheme_peer_comparision_list: apiScheme.scheme_peer_comparision_list ?? null,
        
        "returns.since_inception": toN(apiScheme.scheme_inception_return),
        "returns.d1": toN(tr.d1),
        "returns.trailing.1w": toN(tr["1w"]),
        "returns.trailing.1m": toN(tr["1m"]),
        "returns.trailing.3m": toN(tr["3m"]),
        "returns.trailing.6m": toN(tr["6m"]),
        "returns.trailing.1y": toN(tr["1y"]),
        "returns.trailing.2y": toN(tr["2y"]),
        "returns.trailing.3y": toN(tr["3y"]),
        "returns.trailing.5y": toN(tr["5y"]),
        "returns.trailing.10y": toN(tr["10y"]),
        "returns.trailing.since_launch": toN(tr.since_launch),
        "returns.annual.ytd": toN(tr.ytd),
        
        "risk_metrics.sharpe_3y": toN(rm.sharpe_3y),
        "risk_metrics.alpha_1y": toN(rm.alpha_1y),
        "risk_metrics.beta_1y": toN(rm.beta_1y),
        "risk_metrics.std_dev_3y": toN(rm.volatility_3y),
        "risk_metrics.turnover_ratio": toN(rm.turnover_ratio),
        "risk_metrics.sortino": toN(rm.sortino),
        "risk_metrics.yield_to_maturity": toN(rm.yield_to_maturity),
        "risk_metrics.average_maturity": toN(rm.average_maturity),
        
        benchmark_inception_return: toN(apiScheme.benchmark_inception_return),
        "benchmark_returns_trailing.1w": toN(br["1w"]),
        "benchmark_returns_trailing.1m": toN(br["1m"]),
        "benchmark_returns_trailing.3m": toN(br["3m"]),
        "benchmark_returns_trailing.6m": toN(br["6m"]),
        "benchmark_returns_trailing.1y": toN(br["1y"]),
        "benchmark_returns_trailing.2y": toN(br["2y"]),
        "benchmark_returns_trailing.3y": toN(br["3y"]),
        "benchmark_returns_trailing.5y": toN(br["5y"]),
        "benchmark_returns_trailing.10y": toN(br["10y"]),
        "benchmark_returns_trailing.since_launch": toN(br.since_launch),
        "benchmark_returns_trailing.ytd": toN(br.ytd)
      });
    }

    return dto;
  }
}
