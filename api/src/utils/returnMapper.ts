export const toNumberOrNull = (val: any): number | null => {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const parsed = Number(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const normalizeYearValueMap = (value: any) => {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value).map(([year, rawValue]) => [year, toNumberOrNull(rawValue)]),
  );
};

export const normalizeTrailingReturns = (value: any) => ({
  "1w": toNumberOrNull(value?.trailing?.["1w"] ?? value?.w1 ?? value?.return_1w ?? value?.benchmark_trailing_1w),
  "1m": toNumberOrNull(value?.trailing?.["1m"] ?? value?.m1 ?? value?.return_1m ?? value?.benchmark_trailing_1m),
  "3m": toNumberOrNull(value?.trailing?.["3m"] ?? value?.m3 ?? value?.return_3m ?? value?.benchmark_trailing_3m),
  "6m": toNumberOrNull(value?.trailing?.["6m"] ?? value?.m6 ?? value?.return_6m ?? value?.benchmark_trailing_6m),
  "1y": toNumberOrNull(value?.trailing?.["1y"] ?? value?.y1 ?? value?.return_1y ?? value?.benchmark_trailing_1y),
  "2y": toNumberOrNull(value?.trailing?.["2y"] ?? value?.y2 ?? value?.return_2y ?? value?.benchmark_trailing_2y),
  "3y": toNumberOrNull(value?.trailing?.["3y"] ?? value?.y3_cagr ?? value?.return_3y ?? value?.benchmark_trailing_3y),
  "5y": toNumberOrNull(value?.trailing?.["5y"] ?? value?.y5_cagr ?? value?.return_5y ?? value?.benchmark_trailing_5y),
  "10y": toNumberOrNull(value?.trailing?.["10y"] ?? value?.y10_cagr ?? value?.return_10y ?? value?.benchmark_trailing_10y),
  since_launch: toNumberOrNull(value?.trailing?.since_launch ?? value?.since_inception ?? value?.return_since_inception),
});

export const normalizeAnnualReturns = (value: any) => ({
  ytd: toNumberOrNull(value?.annual?.ytd ?? value?.ytd ?? value?.return_ytd ?? value?.bench_YTD ?? value?.bench_ytd ?? value?.trailing?.ytd),
  yearly_returns: normalizeYearValueMap(value?.annual?.yearly_returns ?? value?.annual),
});

export const normalizeReturnsObject = (value: any) => ({
  trailing: normalizeTrailingReturns(value),
  annual: normalizeAnnualReturns(value),
});
