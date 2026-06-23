import { WorkbookDTO } from "../../types/mfImportDto";
import { parseCategoryPath } from "../../utils/categoryParser";
import { normalizeDateOnly } from "../navCalculationService";

export class MfApiTransformer {
  static transformScheme(apiScheme: any): Partial<WorkbookDTO> {
    const dto: Partial<WorkbookDTO> = {
      funds: [],
      amcs: [],
      categories: [],
      benchmarks: [],
      benchmarkReturns: [],
      mainCategories: []
    };

    const toN = (v: any) => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(String(v).replace(/,/g, "").replace(/%/g, "").trim());
      return Number.isFinite(n) ? n : null;
    };

    const toD = (v: any) => {
      if (!v) return null;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const tr = apiScheme.trailing_returns || {};
    const rm = apiScheme.risk_metrics || {};
    const mc = apiScheme.market_cap || {};
    const br = apiScheme.benchmark_returns || {};
    const cr = apiScheme.category_avg_returns || {};

    const amcName = String(apiScheme.amc_name || apiScheme.amc || "").trim();
    if (amcName) {
      dto.amcs!.push({ name: amcName });
    }

    const categoryName = String(apiScheme.category || "").trim();
    if (categoryName) {
      const parsed = parseCategoryPath(categoryName);
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
        mainCategoryName: parsed.mainCategoryName,
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
        dto.benchmarkReturns!.push({
          benchmarkIndexName,
          date: normalizeDateOnly(toD(apiScheme.latest_date) || new Date()),
          trailing: {
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
          }
        });
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
        plan_type,
        option_type,
        amcName,
        categoryName,
        benchmarkIndexName,
        nav_Current: toN(apiScheme.latest_nav),
        nav_date: toD(apiScheme.latest_date),
        aum_cr: toN(apiScheme.scheme_assets),
        expense_ratio: toN(apiScheme.expense_ratio_percentage),
        fund_manager: String(apiScheme.scheme_manager || "").trim(),
        fund_objective: String(apiScheme.scheme_objective || "").trim(),
        launch_date: toD(apiScheme.scheme_inception_date),
        exit_load: String(apiScheme.exit_load || "").trim(),
        min_investment: toN(apiScheme.minimum_investment),
        minimum_sip_investment: toN(apiScheme.sip_minimum_amount),
        riskometer_label: String(apiScheme.riskometer_value || "").trim(),
        
        large_cap_pct: toN(mc.large_cap_pct ?? apiScheme.market_cap_largecap_percent),
        mid_cap_pct: toN(mc.mid_cap_pct ?? apiScheme.market_cap_midcap_percent),
        small_cap_pct: toN(mc.small_cap_pct ?? apiScheme.market_cap_smallcap_percent),
        
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
