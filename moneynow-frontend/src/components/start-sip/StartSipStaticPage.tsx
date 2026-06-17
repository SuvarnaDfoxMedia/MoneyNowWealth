"use client";

import { useEffect, useMemo, useRef } from "react";
import DonutChart from "@/components/all charts/DonutandPieChart";
import StackedBarLineChart from "@/components/all charts/StackedBarLineChart";
import ComparisonBarChart from "@/components/all charts/ComparisonBarChart";
import StartSipReportDownload from "./charts-sub-components/StartSipReportDownload";
import {
  START_SIP_CALCULATORS,
  buildStartSipChartData,
  buildStartSipResultRows,
  StartSipResult,
  useStartSipStore,
} from "@/stores/startSipStore";

// ─── Field config per calculator ──────────────────────────────────────────────

const FIELD_CONFIG = {
  "lumpsum-calculator": [
    { key: "lumpsum_amount", label: "Lumpsum Amount", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "years", label: "Years", type: "number" },
  ],
  "sip-starter": [
    { key: "sip_amount", label: "Monthly SIP", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "period", label: "Period (Months)", type: "number" },
  ],
  "goal-setting": [
    { key: "dream_amount", label: "Dream Amount", type: "number" },
    { key: "years", label: "Years", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "savings_amount", label: "Current Savings", type: "number" },
  ],
  "step-up-sip": [
    { key: "sip_amount", label: "Monthly SIP", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "period", label: "Period (Months)", type: "number" },
    { key: "sip_stepup_value", label: "Annual Step-Up (%)", type: "number" },
  ],
  "target-based-sip": [
    { key: "wealth_amount", label: "Target Amount", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "period", label: "Period (Years)", type: "number" },
  ],
  "lumpsum-target": [
    { key: "target_amount", label: "Target Amount", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "years", label: "Years", type: "number" },
  ],
  "crore-journey": [
    { key: "current_age", label: "Current Age", type: "number" },
    { key: "retirement_age", label: "Retirement Age", type: "number" },
    { key: "wealth_amount", label: "Desired Wealth", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "savings_amount", label: "Current Savings", type: "number" },
  ],
  "retirement-planning": [
    { key: "current_age", label: "Current Age", type: "number" },
    { key: "retirement_age", label: "Retirement Age", type: "number" },
    { key: "wealth_amount", label: "Desired Wealth", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "savings_amount", label: "Current Savings", type: "number" },
  ],
  "car-loan": [
    { key: "loan_amount", label: "Loan Amount", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "loan_tenure", label: "Tenure", type: "number" },
  ],
  "home-loan": [
    { key: "loan_amount", label: "Loan Amount", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "loan_tenure", label: "Tenure", type: "number" },
  ],
  "education-loan": [
    { key: "loan_amount", label: "Loan Amount", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "loan_tenure", label: "Tenure", type: "number" },
  ],
  "personal-loan": [
    { key: "loan_amount", label: "Loan Amount", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "loan_tenure", label: "Tenure", type: "number" },
  ],
  "swp-calculator": [
    { key: "lumpsum_amount", label: "Lumpsum Invested", type: "number" },
    { key: "withdrawal_amount", label: "Monthly Withdrawal", type: "number" },
    { key: "interest_rate", label: "Expected Return (%)", type: "number" },
    { key: "lumpsum_period", label: "Start After (Years)", type: "number" },
    { key: "period", label: "SWP Duration (Years)", type: "number" },
  ],
  "future-value-inflation": [
    { key: "current_cost", label: "Current Cost", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "no_years", label: "Number of Years", type: "number" },
  ],
  "compounding-calculator": [
    { key: "principal_amount", label: "Principal Amount", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "period", label: "Period (Years)", type: "number" },
  ],
  "children-education-planner": [
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "savings_amount", label: "Current Savings", type: "number" },
  ],
  "spending-less": [
    { key: "current_age", label: "Current Age", type: "number" },
    { key: "retire_age", label: "Retirement Age", type: "number" },
    { key: "savings_interest_rate", label: "Savings Interest Rate (%)", type: "number" },
    { key: "income_tax_rate", label: "Income Tax Rate (%)", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "house_flat_value", label: "House / Flat Value", type: "number" },
    { key: "home_loan_emi_value", label: "Home Loan EMI", type: "number" },
    { key: "new_car_value", label: "New Car Value", type: "number" },
    { key: "eating_out_value", label: "Eating Out", type: "number" },
    { key: "lifestyle_spending_value", label: "Lifestyle Spending", type: "number" },
    { key: "holidays_value", label: "Holidays", type: "number" },
    { key: "transport_value", label: "Transport", type: "number" },
    { key: "credit_card_interest_value", label: "Credit Card Interest", type: "number" },
    { key: "personal_loan_value", label: "Personal Loan", type: "number" },
    { key: "shopping_value", label: "Shopping", type: "number" },
  ],
} as const;

// ─── Fallback SVG charts (used for PDF capture only) ──────────────────────────

const CHART_COLORS = [
  "#2898C2", "#36B056", "#F79932", "#9B59B6", "#E74C3C", "#1ABC9C",
];

function FallbackBarChart({ rows }: { rows: [string, string][] }) {
  const parsed = rows.map(([label, value]) => ({
    label,
    value: Number(value.replace(/[^0-9.-]/g, "")) || 0,
  }));
  const max = Math.max(...parsed.map((r) => r.value), 1);
  const BAR_WIDTH = 60;
  const GAP = 30;
  const CHART_H = 260;
  const CHART_TOP = 20;
  const LABEL_H = 50;
  const svgW = parsed.length * (BAR_WIDTH + GAP) + GAP;
  const svgH = CHART_H + CHART_TOP + LABEL_H;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ display: "block", margin: "0 auto" }}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = CHART_TOP + CHART_H * (1 - ratio);
        return (
          <line key={ratio} x1={0} y1={y} x2={svgW} y2={y} stroke="#E5E7EB" strokeWidth={1} />
        );
      })}
      {parsed.map((item, i) => {
        const barH = Math.max((item.value / max) * CHART_H, 4);
        const x = GAP + i * (BAR_WIDTH + GAP);
        const y = CHART_TOP + CHART_H - barH;
        const color = CHART_COLORS[i % CHART_COLORS.length];
        const words = item.label.split(" ");
        const lines: string[] = [];
        let current = "";
        words.forEach((w) => {
          if ((current + " " + w).trim().length > 12) {
            lines.push(current.trim());
            current = w;
          } else {
            current = (current + " " + w).trim();
          }
        });
        if (current) lines.push(current);
        return (
          <g key={item.label}>
            <rect x={x} y={y} width={BAR_WIDTH} height={barH} fill={color} rx={3} />
            {lines.map((line, li) => (
              <text
                key={li}
                x={x + BAR_WIDTH / 2}
                y={CHART_TOP + CHART_H + 14 + li * 14}
                textAnchor="middle"
                fontSize={10}
                fill="#374151"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function FallbackPieChart({ rows }: { rows: [string, string][] }) {
  const parsed = rows
    .map(([label, value], i) => ({
      label,
      value: Math.max(Number(value.replace(/[^0-9.-]/g, "")) || 0, 0),
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .filter((r) => r.value > 0);
  const total = parsed.reduce((s, r) => s + r.value, 0) || 1;
  const SIZE = 260;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 100;
  const INNER_R = 50;
  const arcs: { path: string; color: string }[] = [];
  let angle = -Math.PI / 2;
  parsed.forEach((item) => {
    const sweep = (item.value / total) * Math.PI * 2;
    const end = angle + sweep;
    const x1o = CX + R * Math.cos(angle);
    const y1o = CY + R * Math.sin(angle);
    const x2o = CX + R * Math.cos(end);
    const y2o = CY + R * Math.sin(end);
    const x1i = CX + INNER_R * Math.cos(end);
    const y1i = CY + INNER_R * Math.sin(end);
    const x2i = CX + INNER_R * Math.cos(angle);
    const y2i = CY + INNER_R * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    arcs.push({
      path: `M ${x1o} ${y1o} A ${R} ${R} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${INNER_R} ${INNER_R} 0 ${large} 0 ${x2i} ${y2i} Z`,
      color: item.color,
    });
    angle = end;
  });
  const LEGEND_H = 20;
  const legendTotal = parsed.length * LEGEND_H + 10;
  const svgH = SIZE + legendTotal;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={SIZE}
      height={svgH}
      viewBox={`0 0 ${SIZE} ${svgH}`}
      style={{ display: "block", margin: "0 auto" }}
    >
      {arcs.map((arc, i) => (
        <path key={i} d={arc.path} fill={arc.color} />
      ))}
      {parsed.map((item, i) => (
        <g key={i} transform={`translate(10, ${SIZE + 5 + i * LEGEND_H})`}>
          <rect width={12} height={12} fill={item.color} rx={2} />
          <text x={18} y={10} fontSize={10} fill="#374151">{item.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function StartSipStaticPage() {
  const activeCalculatorId = useStartSipStore((s) => s.activeCalculatorId);
  const values = useStartSipStore((s) => s.values);
  const result = useStartSipStore((s) => s.result as StartSipResult | null);
  const loading = useStartSipStore((s) => s.loading);
  const error = useStartSipStore((s) => s.error);
  const setActiveCalculator = useStartSipStore((s) => s.setActiveCalculator);
  const setFieldValue = useStartSipStore((s) => s.setFieldValue);
  const calculate = useStartSipStore((s) => s.calculate);

  const debounceRef = useRef<number | null>(null);
  const barChartRef = useRef<HTMLDivElement | null>(null);
  const pieChartRef = useRef<HTMLDivElement | null>(null);

  const activeCalculator = useMemo(
    () =>
      START_SIP_CALCULATORS.find((item) => item.id === activeCalculatorId) ||
      START_SIP_CALCULATORS[0],
    [activeCalculatorId],
  );

  const fieldConfig =
    FIELD_CONFIG[activeCalculatorId as keyof typeof FIELD_CONFIG] || [];

  const resultRows = useMemo(
    () => buildStartSipResultRows(activeCalculatorId, values, result),
    [activeCalculatorId, values, result],
  );

  const inputRows = useMemo(
    () =>
      fieldConfig.map((field) => [
        field.label,
        String((values as Record<string, unknown>)[field.key] ?? ""),
      ]) as [string, string][],
    [fieldConfig, values],
  );

  const chartData = useMemo(
    () => buildStartSipChartData(activeCalculatorId, values, result),
    [activeCalculatorId, values, result],
  );

  const hasNativeBarChart =
    chartData?.type === "sip" || chartData?.type === "goal";
  const hasNativePieChart = chartData?.type === "sip";

  useEffect(() => {
    if (!activeCalculator.isInteractive) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      calculate();
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [activeCalculatorId, values, activeCalculator.isInteractive, calculate]);

  return (
    <div className="bg-white text-[#111111]" style={{ backgroundColor: "#ffffff" }}>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-10">
        <div className="grid items-start gap-10 lg:grid-cols-[320px_1fr]">

          {/* ── Sidebar ── */}
          <aside
            className="sticky top-25 h-fit overflow-hidden rounded-[10px] border border-[#D8D8D8] bg-white"
            style={{ backgroundColor: "#ffffff" }}
          >
            {START_SIP_CALCULATORS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveCalculator(item.id)}
                className={`block w-full border-b border-[#E1E1E1] p-[16px] text-left text-[16px] leading-[26px] transition-colors ${
                  activeCalculatorId === item.id
                    ? "bg-[#0B3B6E] text-white"
                    : "bg-white text-[#1A1A1A] hover:bg-slate-50"
                } ${item.isInteractive ? "cursor-pointer" : "cursor-default"}`}
                style={
                  activeCalculatorId === item.id
                    ? { backgroundColor: "#0B3B6E", color: "#ffffff" }
                    : { backgroundColor: "#ffffff" }
                }
                type="button"
              >
                {item.title}
              </button>
            ))}
          </aside>

          {/* ── Main content ── */}
          <div className="min-h-screen">

            {/* Title + Download button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[22px] font-medium">{activeCalculator.title}</h2>

              {activeCalculator.isInteractive && !loading && !error ? (
                <StartSipReportDownload
                  title={activeCalculator.title}
                  inputRows={inputRows}
                  resultRows={resultRows}
                  barChartRef={barChartRef}
                  pieChartRef={pieChartRef}
                  chartType={chartData?.type || null}
                  className="flex items-center justify-center gap-2 rounded-md bg-[#0B3B6E] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#082d54]"
                />
              ) : null}
            </div>

            {/* Input fields */}
            <div
              className="mt-6 rounded-[8px] border border-[#D8D8D8] p-6 lg:p-10"
              style={{ backgroundColor: "#FAFAFA" }}
            >
              {/* Children Education Planner special UI */}
              {activeCalculatorId === "children-education-planner" && (
                <div className="mb-6 border-b border-[#D8D8D8] pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[18px] font-semibold text-[#0B3B6E]">Children Details</h4>
                    <button
                      onClick={() => {
                        const newChildren = [
                          ...(values.children || []),
                          {
                            name: `Child ${(values.children || []).length + 1}`,
                            currentAge: 2,
                            educationAge: 18,
                            educationAmount: 500000,
                          },
                        ];
                        setFieldValue("children", newChildren);
                      }}
                      className="px-4 py-2 bg-[#0B3B6E] text-white rounded font-medium text-sm hover:bg-[#082d54]"
                    >
                      + Add Child
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(values.children || []).map((child: any, index: number) => (
                      <div key={index} className="p-4 bg-white rounded border border-[#E2E2E2]">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-semibold text-slate-700">{child.name}</h5>
                          {(values.children || []).length > 1 && (
                            <button
                              onClick={() => {
                                const newChildren = [...(values.children || [])];
                                newChildren.splice(index, 1);
                                setFieldValue("children", newChildren);
                              }}
                              className="text-red-500 text-sm font-semibold hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Name</label>
                            <input
                              type="text"
                              value={child.name}
                              onChange={(e) => {
                                const newChildren = [...(values.children || [])];
                                newChildren[index] = { ...newChildren[index], name: e.target.value };
                                setFieldValue("children", newChildren);
                              }}
                              className="h-[44px] w-full rounded-[4px] border border-[#E2E2E2] bg-white px-3 text-[14px] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Current Age</label>
                            <input
                              type="number"
                              value={child.currentAge}
                              onChange={(e) => {
                                const newChildren = [...(values.children || [])];
                                newChildren[index] = { ...newChildren[index], currentAge: Number(e.target.value) };
                                setFieldValue("children", newChildren);
                              }}
                              className="h-[44px] w-full rounded-[4px] border border-[#E2E2E2] bg-white px-3 text-[14px] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Education Age</label>
                            <input
                              type="number"
                              value={child.educationAge}
                              onChange={(e) => {
                                const newChildren = [...(values.children || [])];
                                newChildren[index] = { ...newChildren[index], educationAge: Number(e.target.value) };
                                setFieldValue("children", newChildren);
                              }}
                              className="h-[44px] w-full rounded-[4px] border border-[#E2E2E2] bg-white px-3 text-[14px] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Education Amount</label>
                            <input
                              type="number"
                              value={child.educationAmount}
                              onChange={(e) => {
                                const newChildren = [...(values.children || [])];
                                newChildren[index] = { ...newChildren[index], educationAmount: Number(e.target.value) };
                                setFieldValue("children", newChildren);
                              }}
                              className="h-[44px] w-full rounded-[4px] border border-[#E2E2E2] bg-white px-3 text-[14px] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`grid gap-6 ${
                  fieldConfig.length > 3 ? "lg:grid-cols-2" : "lg:grid-cols-3"
                }`}
              >
                {fieldConfig.map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-4 block text-[16px] font-medium">
                      {field.label}
                    </span>
                    <input
                      type={field.type}
                      value={(values as Record<string, unknown>)[field.key] ?? ""}
                      onChange={(e) => {
                        const val =
                          field.type === "number"
                            ? Number(e.target.value)
                            : e.target.value;
                        setFieldValue(field.key, val);
                      }}
                      className="h-[58px] w-full rounded-[4px] border border-[#E2E2E2] bg-white px-4 text-[18px] outline-none transition focus:border-[#0B3B6E]"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Results area */}
            <div className="mt-10">
              {loading ? (
                <div className="py-20 text-center text-slate-500">Calculating...</div>
              ) : (
                <>
                  {error ? (
                    <div className="mb-6 rounded-[8px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  {!error ? (
                    <>
                      {/* ── Bar chart (visible for sip/goal, off-screen fallback for PDF) ── */}
                      {hasNativeBarChart ? (
                        <div
                          ref={barChartRef}
                          className="bg-white p-2"
                          style={{ backgroundColor: "#ffffff" }}
                        >
                          {chartData?.type === "sip" ? (
                            <StackedBarLineChart
                              data={chartData.barData || []}
                              height={440}
                            />
                          ) : null}
                          {chartData?.type === "goal" ? (
                            <ComparisonBarChart
                              data={chartData.data || []}
                              height={440}
                            />
                          ) : null}
                        </div>
                      ) : (
                        /* Off-screen — captured by html2canvas for PDF only */
                        <div
                          ref={barChartRef}
                          style={{
                            position: "absolute",
                            left: "-9999px",
                            top: 0,
                            width: "700px",
                            backgroundColor: "#ffffff",
                            padding: "24px",
                          }}
                          aria-hidden="true"
                        >
                          {resultRows.length > 0 && (
                            <FallbackBarChart rows={resultRows} />
                          )}
                        </div>
                      )}

                      {resultRows.length > 0 ? (
                        <div className="mt-5">
                          {/* ── Pie chart (visible for sip, off-screen fallback for PDF) ── */}
                          {hasNativePieChart ? (
                            <div
                              ref={pieChartRef}
                              className="flex justify-center bg-white p-2"
                              style={{ backgroundColor: "#ffffff" }}
                            >
                              <DonutChart
                                data={chartData!.pieData || []}
                                height={360}
                                innerRadius={0}
                                outerRadius={116}
                              />
                            </div>
                          ) : (
                            <div
                              ref={pieChartRef}
                              style={{
                                position: "absolute",
                                left: "-9999px",
                                top: 0,
                                width: "300px",
                                backgroundColor: "#ffffff",
                                padding: "16px",
                              }}
                              aria-hidden="true"
                            >
                              <FallbackPieChart rows={resultRows} />
                            </div>
                          )}

                          {/* ── Results table — always visible, no data cut off ── */}
                          <div
                            className="overflow-hidden rounded-[6px] mt-8 border border-[#DADADA]"
                            style={{ backgroundColor: "#ffffff" }}
                          >
                            {/* Table header */}
                            <div
                              className="flex"
                              style={{ backgroundColor: "#F7F7F7" }}
                            >
                              <div className="flex-1 border-r border-[#DADADA] px-4 py-4 text-[18px] font-semibold">
                                Results
                              </div>
                              <div className="w-[220px] px-4 py-4 text-[18px] font-semibold">
                                Amount
                              </div>
                            </div>

                            {/* Table rows — label wraps, value highlighted */}
                            {resultRows.map(([label, value]) => (
                              <div
                                key={label}
                                className="flex border-t border-[#DADADA] text-[15px]"
                              >
                                <div className="flex-1 border-r border-[#DADADA] px-4 py-3 leading-6 break-words">
                                  {label}
                                </div>
                                <div className="w-[220px] px-4 py-3 font-semibold text-[#0B3B6E] leading-6 break-all">
                                  {value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}