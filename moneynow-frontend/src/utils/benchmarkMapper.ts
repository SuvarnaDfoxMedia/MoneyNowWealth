export interface StandardizedReturns {
  "1w": number | null;
  "1m": number | null;
  "3m": number | null;
  "6m": number | null;
  "1y": number | null;
  "2y": number | null;
  "3y": number | null;
  "5y": number | null;
  "10y": number | null;
  since_launch: number | null;
  ytd: number | null;
}

export interface StandardizedBenchmarkResult {
  benchmarkName: string;
  benchmarkReturnsTrailing: StandardizedReturns;
  benchmarkReturnsAnnual: {
    y1: number | null;
    y3: number | null;
    y5: number | null;
    y10: number | null;
  };
  benchmarkInceptionReturn: number | null;
}

export const getStandardizedBenchmark = (fund: any): StandardizedBenchmarkResult => {
  const hasBenchmark = !!fund?.benchmark_id;

  const defaultTrailing = {
    "1w": null,
    "1m": null,
    "3m": null,
    "6m": null,
    "1y": null,
    "2y": null,
    "3y": null,
    "5y": null,
    "10y": null,
    since_launch: null,
    ytd: null,
  };

  const defaultAnnual = {
    y1: null,
    y3: null,
    y5: null,
    y10: null,
  };

  if (!hasBenchmark) {
    return {
      benchmarkName: "",
      benchmarkReturnsTrailing: defaultTrailing,
      benchmarkReturnsAnnual: defaultAnnual,
      benchmarkInceptionReturn: null,
    };
  }

  const mfApi = fund?.mf_api_scheme_id || {};
  const latestInfoRaw = mfApi?.latest_info_raw || {};
  const rawPayload = mfApi?.raw_payload || {};
  
  const perfList = Array.isArray(latestInfoRaw?.scheme_performance_list)
    ? latestInfoRaw.scheme_performance_list
    : Array.isArray(mfApi?.scheme_performance_list)
    ? mfApi.scheme_performance_list
    : Array.isArray(rawPayload?.scheme_performance_list)
    ? rawPayload.scheme_performance_list
    : [];

  const dbBenchmarkName = fund.benchmark_index_name || mfApi?.scheme_benchmark || latestInfoRaw?.scheme_benchmark || "";
  let resolvedBenchmarkName = dbBenchmarkName;

  if (perfList.length > 0) {
    const fundRow = perfList.find((r: any) =>
      String(r?.scheme_name || "").toLowerCase().includes(String(fund.fund_name || "").toLowerCase().slice(0, 10))
    ) || perfList[0] || {};

    const looksLikeCategory = (row: any): boolean => {
      const name = String(row?.scheme_name || "").toLowerCase().trim();
      const catName = String(fund.category_id?.name || fund.category || latestInfoRaw?.category || "").toLowerCase().trim();
      return (
        name.includes(":") ||
        name === catName ||
        name.includes("category average") ||
        name.includes("category avg")
      );
    };

    const benchmarkRow = perfList.find((r: any) => r !== fundRow && !looksLikeCategory(r)) || perfList[1] || {};
    if (benchmarkRow?.scheme_name) {
      resolvedBenchmarkName = benchmarkRow.scheme_name;
    }
  }

  const benchmarkName = resolvedBenchmarkName || "Benchmark";
  const trailing = fund.benchmark_returns_trailing
    ? {
        "1w": fund.benchmark_returns_trailing["1w"] ?? null,
        "1m": fund.benchmark_returns_trailing["1m"] ?? null,
        "3m": fund.benchmark_returns_trailing["3m"] ?? null,
        "6m": fund.benchmark_returns_trailing["6m"] ?? null,
        "1y": fund.benchmark_returns_trailing["1y"] ?? null,
        "2y": fund.benchmark_returns_trailing["2y"] ?? null,
        "3y": fund.benchmark_returns_trailing["3y"] ?? null,
        "5y": fund.benchmark_returns_trailing["5y"] ?? null,
        "10y": fund.benchmark_returns_trailing["10y"] ?? null,
        since_launch: fund.benchmark_returns_trailing.since_launch ?? null,
        ytd: fund.benchmark_returns_trailing.ytd ?? null,
      }
    : defaultTrailing;

  const annual = fund.benchmark_returns_annual
    ? {
        y1: fund.benchmark_returns_annual.y1 ?? null,
        y3: fund.benchmark_returns_annual.y3 ?? null,
        y5: fund.benchmark_returns_annual.y5 ?? null,
        y10: fund.benchmark_returns_annual.y10 ?? null,
      }
    : defaultAnnual;

  const resolvedInception =
    fund.benchmark_inception_return ?? trailing.since_launch ?? null;

  return {
    benchmarkName,
    benchmarkReturnsTrailing: trailing,
    benchmarkReturnsAnnual: annual,
    benchmarkInceptionReturn: resolvedInception,
  };
};

export const mapLocalFundToAdviserKhojShape = (fund: any): any => {
  const {
    benchmarkName,
    benchmarkReturnsTrailing,
    benchmarkInceptionReturn,
  } = getStandardizedBenchmark(fund);

  const category = fund?.category_id || {};
  // Prioritize category_returns (manual) over category_average_returns (computed)
  const categoryReturns = category.category_returns || category.category_average_returns || {};

  const formatRow = (name: string, source: any) => ({
    scheme_name: name,
    one_week_return: source?.trailing?.["1w"] ?? source?.["1w"] ?? null,
    one_month_return: source?.trailing?.["1m"] ?? source?.["1m"] ?? null,
    three_month_return: source?.trailing?.["3m"] ?? source?.["3m"] ?? null,
    six_month_return: source?.trailing?.["6m"] ?? source?.["6m"] ?? null,
    one_year_return: source?.trailing?.["1y"] ?? source?.["1y"] ?? null,
    two_year_return: source?.trailing?.["2y"] ?? source?.["2y"] ?? null,
    three_year_return: source?.trailing?.["3y"] ?? source?.["3y"] ?? null,
    five_year_return: source?.trailing?.["5y"] ?? source?.["5y"] ?? null,
    ten_year_return: source?.trailing?.["10y"] ?? source?.["10y"] ?? null,
    inception_year_return:
      source?.since_inception ??
      source?.trailing?.since_launch ??
      source?.since_launch ??
      null,
    ytd_return:
      source?.annual?.ytd ?? source?.trailing?.ytd ?? source?.ytd ?? null,
  });

  const scheme_performance_list = [
    formatRow(fund.fund_name || "Fund", fund.returns || {}),
    ...(benchmarkName
      ? [
          formatRow(benchmarkName, {
            trailing: benchmarkReturnsTrailing,
            since_launch: benchmarkInceptionReturn,
          }),
        ]
      : []),
    formatRow(category.name || "Category Avg", {
      trailing: categoryReturns?.trailing || {},
      annual: categoryReturns?.annual || {},
      since_launch:
        categoryReturns?.since_launch ??
        categoryReturns?.trailing?.since_launch ??
        null,
      ytd: categoryReturns?.ytd ?? null,
    }),
  ];

  const formatDateString = (dateVal: any) => {
    if (!dateVal) return "—";
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateVal;
    }
  };

  return {
    scheme_name: fund.fund_name,
    scheme_company: fund.amc_id?.name || "",
    scheme_category: fund.category_id?.name || "",
    nav: fund.nav_Current,
    nav_date: formatDateString(fund.nav_date),
    nav_change: fund.nav_change,
    nav_change_percentage: fund.nav_change_percentage,
    rating_value: fund.rating_value,
    rating: fund.rating,
    sip_minimum_amount: fund.min_sip_investment,
    scheme_benchmark: benchmarkName,
    scheme_inception_date: formatDateString(fund.launch_date),
    scheme_manager: fund.fund_manager,
    scheme_objective: fund.fund_objective,
    market_cap_largecap_percent: fund.large_cap_pct,
    market_cap_midcap_percent: fund.mid_cap_pct,
    market_cap_smallcap_percent: fund.small_cap_pct,
    risk_statistics_list: fund.mf_api_scheme_id?.risk_statistics_list || [],
    scheme_peer_comparision_list:
      fund.mf_api_scheme_id?.scheme_peer_comparision_list || [],
    scheme_performance_list,
  };
};
