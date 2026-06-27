"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Primitive = string | number | boolean | null | undefined;
type AnyObject = Record<string, unknown>;

type SchemeListItem = {
  scheme_company?: string | null;
  scheme_advisorkhoj_category?: string | null;
  scheme_amfi?: string | null;
  scheme_amfi_code?: string | null;
  scheme_isin?: string | null;
};

type AllSchemesResponse = {
  scheme_list?: SchemeListItem[] | null;
};

type FundCard = {
  id: string;
  schemeName: string;
  loading: boolean;
  error: string | null;
  data: AnyObject | null;
};

const DEFAULT_HIDDEN_KEYS = new Set([
  "status",
  "status_msg",
  "msg",
  "scheme_performance_list",
  "risk_statistics_list",
  "scheme_peer_comparision_list",
]);

const safeText = (value: unknown, fallback = "N/A") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
};

const isPrimitive = (value: unknown): value is Primitive => {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
};

const isObject = (value: unknown): value is AnyObject => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const toTitle = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toCellValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString("en-IN") : "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(num) ? num : null;
};

const formatCurrencyInr = (value: unknown, fractionDigits = 2) => {
  const num = toNumber(value);
  if (num === null) return "N/A";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
};

const formatPercent = (value: unknown, digits = 2, withSign = false) => {
  const num = toNumber(value);
  if (num === null) return "—";
  const n = withSign && num > 0 ? `+${num.toFixed(digits)}` : num.toFixed(digits);
  return `${n}%`;
};

const riskBadgeClass = (risk: string) => {
  const val = risk.toLowerCase();
  if (val.includes("very high")) return "bg-red-100 text-red-700 border-red-200";
  if (val.includes("high")) return "bg-orange-100 text-orange-700 border-orange-200";
  if (val.includes("moderate")) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (val.includes("low")) return "bg-green-100 text-green-700 border-green-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const stars = (value: unknown) => {
  const n = Math.max(0, Math.min(5, Math.floor(toNumber(value) ?? 0)));
  return `${"★".repeat(n)}${"☆".repeat(5 - n)}`;
};

const pickObjectFromResponse = (json: unknown): AnyObject | null => {
  if (!isObject(json)) return null;

  const arr = (json as { scheme_info?: unknown }).scheme_info;
  if (Array.isArray(arr) && arr.length > 0 && isObject(arr[0])) {
    return arr[0] as AnyObject;
  }

  if ("scheme_name" in json || "scheme_amfi_code" in json || "scheme_category" in json) {
    return json;
  }

  return null;
};

const getListFields = (data: AnyObject | null) => {
  if (!data) return [] as Array<{ key: string; items: AnyObject[] }>;

  return Object.entries(data)
    .filter(([, value]) => Array.isArray(value) && value.length > 0 && value.every((v) => isObject(v)))
    .map(([key, value]) => ({ key, items: value as AnyObject[] }));
};

const getScalarFields = (data: AnyObject | null) => {
  if (!data) return [] as Array<{ key: string; value: Primitive }>;

  return Object.entries(data)
    .filter(([key, value]) => !DEFAULT_HIDDEN_KEYS.has(key) && isPrimitive(value))
    .map(([key, value]) => ({ key, value }));
};

export default function PaidCalPage() {
  const [allSchemes, setAllSchemes] = useState<SchemeListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cards, setCards] = useState<FundCard[]>([]);
  const [listSelections, setListSelections] = useState<Record<string, Record<string, number>>>({});
  const [cardUiState, setCardUiState] = useState<Record<string, { risk: boolean; peers: boolean; objective: boolean }>>({});

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    const loadSchemes = async () => {
      setListLoading(true);
      setListError(null);
      try {
        const response = await fetch("/api/mf-schemes?type=all");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json: AllSchemesResponse = await response.json();
        const list = (json.scheme_list ?? []).filter((item) => safeText(item.scheme_amfi, "") !== "");
        if (!cancelled) setAllSchemes(list);
      } catch (error) {
        if (!cancelled) {
          setListError(error instanceof Error ? error.message : "Unable to load schemes");
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    };

    loadSchemes();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return allSchemes.filter((item) => (item.scheme_amfi ?? "").toLowerCase().includes(q)).slice(0, 15);
  }, [allSchemes, debouncedQuery]);

  const fetchSchemeInfo = useCallback(async (schemeName: string, cardId: string) => {
    try {
      const response = await fetch(`/api/mf-schemes?type=scheme&scheme=${encodeURIComponent(schemeName)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = (await response.json()) as unknown;
      const info = pickObjectFromResponse(json);

      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId
            ? { ...card, loading: false, data: info, error: info ? null : "No scheme data returned" }
            : card,
        ),
      );
    } catch (error) {
      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId
            ? {
                ...card,
                loading: false,
                data: null,
                error: error instanceof Error ? error.message : "Unable to fetch scheme details",
              }
            : card,
        ),
      );
    }
  }, []);

  const addFund = useCallback(
    (inputName: string) => {
      const schemeName = inputName.trim();
      if (!schemeName) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setCards((prev) => [{ id, schemeName, loading: true, error: null, data: null }, ...prev]);
      fetchSchemeInfo(schemeName, id);
      setQuery("");
      setDebouncedQuery("");
    },
    [fetchSchemeInfo],
  );

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
    setListSelections((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCardUiState((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Mutual Fund Scheme Explorer</h1>
        <p className="mt-1 text-sm text-slate-600">Search a scheme and add it as a full-detail card.</p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFund(query);
                }
              }}
              placeholder="Search by scheme name"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
              list="scheme-suggestions"
            />
            <datalist id="scheme-suggestions">
              {allSchemes.slice(0, 5000).map((item, idx) => (
                <option key={`${item.scheme_amfi_code ?? idx}-${item.scheme_amfi}`} value={item.scheme_amfi ?? ""} />
              ))}
            </datalist>

            {debouncedQuery && suggestions.length > 0 ? (
              <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.scheme_amfi_code ?? idx}-${item.scheme_amfi}`}
                    type="button"
                    className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => addFund(item.scheme_amfi ?? "")}
                  >
                    <div className="font-medium text-slate-800">{safeText(item.scheme_amfi)}</div>
                    <div className="text-xs text-slate-500">
                      {safeText(item.scheme_company)} | {safeText(item.scheme_advisorkhoj_category)}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => addFund(query)}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Add Fund
          </button>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          {listLoading
            ? "Loading all schemes..."
            : listError
              ? `Scheme list error: ${listError}`
              : `${allSchemes.length} schemes loaded`}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const data = card.data;
          const perfList = Array.isArray(data?.scheme_performance_list) ? (data.scheme_performance_list as AnyObject[]) : [];
          const fundPerf = perfList[0] ?? null;
          const benchmarkPerf = perfList[1] ?? null;
          const categoryPerf = perfList[2] ?? null;
          const riskStats = Array.isArray(data?.risk_statistics_list)
            ? ((data.risk_statistics_list as AnyObject[])[0] ?? null)
            : null;
          const peers = Array.isArray(data?.scheme_peer_comparision_list)
            ? (data.scheme_peer_comparision_list as AnyObject[])
            : [];
          const ui = cardUiState[card.id] ?? { risk: false, peers: false, objective: false };
          const navChange = toNumber(data?.nav_change);
          const navPct = toNumber(data?.nav_change_percentage);
          const navPositive = (navChange ?? 0) >= 0;
          const riskText = safeText(data?.riskometer_value, "N/A");
          const objective = safeText(data?.scheme_objective, "");
          const objectiveShort = objective.length > 120 && !ui.objective ? `${objective.slice(0, 120)}...` : objective;
          const largeCap = Math.max(0, toNumber(data?.market_cap_largecap_percent) ?? 0);
          const midCap = Math.max(0, toNumber(data?.market_cap_midcap_percent) ?? 0);
          const smallCap = Math.max(0, toNumber(data?.market_cap_smallcap_percent) ?? 0);
          const capTotal = largeCap + midCap + smallCap;
          const capLargeWidth = capTotal > 0 ? (largeCap / capTotal) * 100 : 0;
          const capMidWidth = capTotal > 0 ? (midCap / capTotal) * 100 : 0;
          const capSmallWidth = capTotal > 0 ? (smallCap / capTotal) * 100 : 0;
          const periods: Array<{ label: string; key: string }> = [
            { label: "1W", key: "one_week_return" },
            { label: "1M", key: "one_month_return" },
            { label: "3M", key: "three_month_return" },
            { label: "6M", key: "six_month_return" },
            { label: "1Y", key: "one_year_return" },
            { label: "2Y", key: "two_year_return" },
            { label: "3Y", key: "three_year_return" },
            { label: "5Y", key: "five_year_return" },
            { label: "10Y", key: "ten_year_return" },
            { label: "YTD", key: "ytd_return" },
          ];
          const sortedPeers = [...peers].sort((a, b) => (toNumber(b.three_year_return) ?? -9999) - (toNumber(a.three_year_return) ?? -9999));

          return (
            <article key={card.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-indigo-700 px-4 py-3 text-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-bold text-white">{safeText(data?.scheme_name ?? card.schemeName)}</h2>
                    <p className="mt-0.5 text-xs opacity-80">{safeText(data?.scheme_company)}</p>
                    <span className="mt-1 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                      {safeText(data?.scheme_category)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCard(card.id)}
                    className="rounded-md border border-white/50 px-2 py-0.5 text-xs text-white hover:bg-white/10"
                  >
                    X
                  </button>
                </div>
              </div>

              {card.loading ? (
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="h-20 animate-pulse rounded bg-slate-100" />
                </div>
              ) : null}
              {card.error ? (
                <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <span className="mr-2">✕</span>
                  {card.error}
                </div>
              ) : null}

              {!card.loading && !card.error && data ? (
                <div className="space-y-4 p-4 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrencyInr(data?.nav)}</div>
                        <div className="text-xs text-slate-500">NAV Date: {safeText(data?.nav_date)}</div>
                      </div>
                      <div className={`text-right ${navPositive ? "text-green-600" : "text-red-600"}`}>
                        <div className="text-sm font-semibold">
                          {navPositive ? "▲" : "▼"} {formatCurrencyInr(Math.abs(navChange ?? 0))}
                        </div>
                        <div className="text-xs">{formatPercent(Math.abs(navPct ?? 0), 2)} </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-amber-500">{stars(data?.rating_value)}</div>
                        <div className="text-xs text-slate-600">{safeText(data?.rating)}</div>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${riskBadgeClass(riskText)}`}>{riskText}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-slate-200 p-2">
                      <div className="text-slate-500">AUM</div>
                      <div className="font-semibold text-slate-800">{formatCurrencyInr(data?.scheme_assets, 0)} Cr</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <div className="text-slate-500">Expense Ratio</div>
                      <div className="font-semibold text-slate-800">{formatPercent(data?.expense_ratio_percentage)}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <div className="text-slate-500">Risk</div>
                      <div className="font-semibold text-slate-800">{riskText}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2" title={safeText(data?.exit_load)}>
                      <div className="text-slate-500">Exit Load</div>
                      <div className="truncate font-semibold text-slate-800">
                        {`${safeText(data?.exit_load).slice(0, 30)}${safeText(data?.exit_load).length > 30 ? "..." : ""}`}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <div className="text-slate-500">Min Investment</div>
                      <div className="font-semibold text-slate-800">{formatCurrencyInr(data?.minimum_investment, 0)}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <div className="text-slate-500">SIP Min</div>
                      <div className="font-semibold text-slate-800">{formatCurrencyInr(data?.sip_minimum_amount, 0)}</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                      Performance Returns (%)
                    </div>
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-2 py-2 text-left">Period</th>
                          <th className="px-2 py-2 text-right">Fund</th>
                          <th className="px-2 py-2 text-right">Benchmark</th>
                          <th className="px-2 py-2 text-right">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map((p, idx) => {
                          const f = toNumber(fundPerf?.[p.key]);
                          const b = toNumber(benchmarkPerf?.[p.key]);
                          const c = toNumber(categoryPerf?.[p.key]);
                          const fundColor = f === null ? "text-slate-400" : f >= (b ?? f) ? "text-green-600" : "text-red-500";
                          const benchColor = b === null ? "text-slate-400" : "text-slate-700";
                          const catColor = c === null ? "text-slate-400" : "text-slate-700";
                          return (
                            <tr key={p.key} className={idx % 2 === 1 ? "bg-slate-50" : ""}>
                              <td className="px-2 py-1.5 font-medium text-slate-700">{p.label}</td>
                              <td className={`px-2 py-1.5 text-right ${fundColor}`}>{f === null ? "—" : `${f.toFixed(2)}%`}</td>
                              <td className={`px-2 py-1.5 text-right ${benchColor}`}>{b === null ? "—" : `${b.toFixed(2)}%`}</td>
                              <td className={`px-2 py-1.5 text-right ${catColor}`}>{c === null ? "—" : `${c.toFixed(2)}%`}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-4 divide-x divide-slate-200 rounded-lg border border-slate-200">
                    <div className="p-2">
                      <div className="text-xs text-slate-500">Fund Manager</div>
                      <div className="truncate text-xs font-semibold text-slate-800">{safeText(data?.scheme_manager).slice(0, 25)}</div>
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-slate-500">Benchmark</div>
                      <div className="truncate text-xs font-semibold text-slate-800">{safeText(data?.scheme_benchmark)}</div>
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-slate-500">Inception</div>
                      <div className="text-xs font-semibold text-slate-800">{safeText(data?.scheme_inception_date)}</div>
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-slate-500">Rating</div>
                      <div className="text-xs font-semibold text-amber-500">{stars(data?.rating_value)}</div>
                      <div className="truncate text-[11px] text-slate-600">{safeText(data?.rating)}</div>
                    </div>
                  </div>

                  {safeText(data?.asset_class, "").toLowerCase() === "equity" ? (
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="mb-2 text-xs font-semibold text-slate-700">Market Cap Allocation</div>
                      <div className="flex h-3 overflow-hidden rounded-full bg-slate-200">
                        <div className="bg-blue-500" style={{ width: `${capLargeWidth}%` }} />
                        <div className="bg-purple-500" style={{ width: `${capMidWidth}%` }} />
                        <div className="bg-pink-500" style={{ width: `${capSmallWidth}%` }} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />Large {largeCap.toFixed(2)}%</span>
                        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-purple-500" />Mid {midCap.toFixed(2)}%</span>
                        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-pink-500" />Small {smallCap.toFixed(2)}%</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        setCardUiState((prev) => ({
                          ...prev,
                          [card.id]: { ...ui, risk: !ui.risk },
                        }))
                      }
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-slate-700"
                    >
                      Risk Statistics <span>{ui.risk ? "▾" : "▸"}</span>
                    </button>
                    {ui.risk ? (
                      <div className="grid grid-cols-3 gap-2 border-t border-slate-200 p-3 text-xs">
                        <div><div className="text-slate-500">Volatility (3Y)</div><div className="font-bold text-slate-800">{toCellValue(riskStats?.volatility_cm_3year)}</div></div>
                        <div><div className="text-slate-500">Sharpe Ratio (3Y)</div><div className="font-bold text-slate-800">{toCellValue(riskStats?.sharpratio_cm_3year)}</div></div>
                        <div><div className="text-slate-500">Alpha (1Y)</div><div className="font-bold text-slate-800">{toCellValue(riskStats?.alpha_cm_1year)}</div></div>
                        <div><div className="text-slate-500">Beta (1Y)</div><div className="font-bold text-slate-800">{toCellValue(riskStats?.beta_cm_1year)}</div></div>
                        <div><div className="text-slate-500">Upside Capture</div><div className="font-bold text-slate-800">{formatPercent(data?.upmarket_capture_ratio)}</div></div>
                        <div><div className="text-slate-500">Downside Capture</div><div className="font-bold text-slate-800">{formatPercent(data?.downmarket_capture_ratio)}</div></div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        setCardUiState((prev) => ({
                          ...prev,
                          [card.id]: { ...ui, peers: !ui.peers },
                        }))
                      }
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-slate-700"
                    >
                      Peer Comparison ({peers.length} funds) <span>{ui.peers ? "▾" : "▸"}</span>
                    </button>
                    {ui.peers ? (
                      <div className="overflow-x-auto border-t border-slate-200">
                        <table className="min-w-full text-xs">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-2 py-2 text-left">Scheme Name</th>
                              <th className="px-2 py-2 text-right">1Y</th>
                              <th className="px-2 py-2 text-right">3Y</th>
                              <th className="px-2 py-2 text-right">5Y</th>
                              <th className="px-2 py-2 text-right">AUM (Cr)</th>
                              <th className="px-2 py-2 text-right">Expense</th>
                              <th className="px-2 py-2 text-right">Rating</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedPeers.map((peer, idx) => {
                              const isCurrent = safeText(peer.scheme_name).toLowerCase() === safeText(data?.scheme_name).toLowerCase();
                              const y1 = toNumber(peer.one_year_return);
                              const y3 = toNumber(peer.three_year_return);
                              const y5 = toNumber(peer.five_year_return);
                              return (
                                <tr key={`${safeText(peer.scheme_name)}-${idx}`} className={isCurrent ? "bg-blue-50 font-semibold" : idx % 2 ? "bg-slate-50" : ""}>
                                  <td className="max-w-[180px] break-words px-2 py-1.5 text-left text-slate-700">{safeText(peer.scheme_name)}</td>
                                  <td className={`px-2 py-1.5 text-right ${y1 !== null && y1 >= 0 ? "text-green-600" : y1 !== null ? "text-red-500" : "text-slate-400"}`}>{y1 === null ? "—" : `${y1.toFixed(2)}%`}</td>
                                  <td className={`px-2 py-1.5 text-right ${y3 !== null && y3 >= 0 ? "text-green-600" : y3 !== null ? "text-red-500" : "text-slate-400"}`}>{y3 === null ? "—" : `${y3.toFixed(2)}%`}</td>
                                  <td className={`px-2 py-1.5 text-right ${y5 !== null && y5 >= 0 ? "text-green-600" : y5 !== null ? "text-red-500" : "text-slate-400"}`}>{y5 === null ? "—" : `${y5.toFixed(2)}%`}</td>
                                  <td className="px-2 py-1.5 text-right text-slate-700">{toCellValue(peer.scheme_assets)}</td>
                                  <td className="px-2 py-1.5 text-right text-slate-700">{formatPercent(peer.expense_ratio_percentage)}</td>
                                  <td className="px-2 py-1.5 text-right text-amber-500">{stars(peer.rating_value)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-slate-600">
                    <div className="mb-1 font-semibold text-slate-700">Scheme Objective</div>
                    <p className="break-words">{objectiveShort || "N/A"}</p>
                    {objective.length > 120 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCardUiState((prev) => ({
                            ...prev,
                            [card.id]: { ...ui, objective: !ui.objective },
                          }))
                        }
                        className="mt-1 text-xs text-blue-600"
                      >
                        {ui.objective ? "Show less" : "Show more"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}
