

//   const years = Math.max(1, Number(values.years || result.years || 1));
//   const invested = Number(
//     result.invested_amount ||
//       result.stepup_invested_amount ||
//       values.sip_amount * years * 12 ||
//       0,
//   );
//   const growth = Number(
//     result.growth_value ||
//       result.stepup_growth_value ||
//       result.growth_amount ||
//       0,
//   );
//   const maturity = Number(
//     result.maturity_amount ||
//       result.stepup_maturity_amount ||
//       result.target_wealth ||
//       0,
//   );

"use client";

import { useEffect, useMemo, useRef } from "react";
import DonutChart from "@/components/all charts/DonutChart";
import StackedBarLineChart from "@/components/all charts/StackedBarLineChart";
import ComparisonBarChart from "@/components/all charts/ComparisonBarChart";
import StartSipReportDownload from "./charts-sub-components/StartSipReportDownload";
import {
  START_SIP_CALCULATORS,
  useStartSipStore,
} from "@/stores/startSipStore";

const formatCurrency = (value?: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const currentYear = new Date().getFullYear();

type StartSipValues = ReturnType<typeof useStartSipStore.getState>["values"];

type StartSipResult = Partial<{
  years: number;
  target_amount: number;
  target_wealth: number;
  invested_amount: number;
  target_savings: number;
  savings_amount: number;
  growth_value: number;
  stepup_growth_value: number;
  growth_amount: number;
  maturity_amount: number;
  stepup_maturity_amount: number;
  stepup_invested_amount: number;
  sip_amount: number;
  monthly_savings: number;
  total_earnings: number;
}>;

type ChartState =
  | {
      type: "goal";
      data: Array<{ label: string; target: number; savings: number }>;
    }
  | {
      type: "sip";
      barData: Array<{
        label: string;
        invested: number;
        growth: number;
        totalValue: number;
      }>;
      pieData: Array<{ label: string; value: number; color: string }>;
    }
  | null;

const FIELD_CONFIG = {
  "sip-starter": [
    { key: "sip_amount", label: "Monthly SIP Amount (Rs.)", type: "number" },
    { key: "years", label: "Investment Duration (Years)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
  ],
  "step-up-sip": [
    { key: "sip_amount", label: "Monthly SIP Amount (Rs.)", type: "number" },
    { key: "years", label: "Investment Duration (Years)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "sip_stepup_value", label: "Annual Step Up (%)", type: "number" },
  ],
  "target-based-sip": [
    { key: "wealth_amount", label: "Target Amount (Rs.)", type: "number" },
    { key: "years", label: "Investment Duration (Years)", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
  ],
  "crore-journey": [
    { key: "current_age", label: "Current Age", type: "number" },
    { key: "retirement_age", label: "Target Age", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "savings_amount", label: "Current Savings (Rs.)", type: "number" },
  ],
} as const;

function buildChartData(
  activeCalculatorId: string,
  values: StartSipValues,
  result: StartSipResult | null,
): ChartState {
  if (!result) return null;

  if (activeCalculatorId === "crore-journey") {
    const years = Math.max(
      1,
      Number(result.years || values.retirement_age - values.current_age || 1),
    );
    const target = Number(result.target_amount || result.target_wealth || 0);
    const savings = Number(
      result.invested_amount ||
        result.target_savings ||
        result.savings_amount ||
        0,
    );

    return {
      type: "goal",
      data: Array.from({ length: years }, (_, index) => ({
        label: `${currentYear + index}`,
        target: Math.round(target * ((index + 1) / years)),
        savings: Math.round(savings * ((index + 1) / years)),
      })),
    };
  }

  const years = Math.max(1, Number(values.years || result.years || 1));
  const invested = Number(
    result.invested_amount ||
      result.stepup_invested_amount ||
      values.sip_amount * years * 12 ||
      0,
  );
  const growth = Number(
    result.growth_value ||
      result.stepup_growth_value ||
      result.growth_amount ||
      0,
  );
  const maturity = Number(
    result.maturity_amount ||
      result.stepup_maturity_amount ||
      result.target_wealth ||
      0,
  );

  return {
    type: "sip",
    barData: Array.from({ length: years }, (_, index) => {
      const progress = (index + 1) / years;
      const investedValue = Math.round(invested * progress);
      const growthValue = Math.round(growth * progress);

      return {
        label: `${currentYear + index}`,
        invested: investedValue,
        growth: growthValue,
        totalValue: investedValue + growthValue,
      };
    }),
    pieData: [
      { label: "Total SIP Amount Invested", value: invested, color: "#48A8C8" },
      {
        label: "Total Growth",
        value: growth || Math.max(maturity - invested, 0),
        color: "#34A853",
      },
    ],
  };
}

function buildResultRows(
  activeCalculatorId: string,
  values: StartSipValues,
  result: StartSipResult | null,
) {
  if (!result) return [];

  switch (activeCalculatorId) {
    case "step-up-sip":
      return [
        [
          "Total SIP Amount Invested",
          formatCurrency(
            result.stepup_invested_amount || result.invested_amount,
          ),
        ],
        [
          "Total Growth",
          formatCurrency(result.stepup_growth_value || result.growth_value),
        ],
        [
          "Total Future Value",
          formatCurrency(
            result.stepup_maturity_amount || result.maturity_amount,
          ),
        ],
      ];
    case "target-based-sip":
      return [
        [
          "Target Wealth",
          formatCurrency(result.target_wealth || values.wealth_amount),
        ],
        ["Required SIP Amount", formatCurrency(result.sip_amount)],
        ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.growth_amount)],
      ];
    case "crore-journey":
      return [
        [
          "Target Corpus",
          formatCurrency(result.target_amount || result.target_wealth),
        ],
        ["Monthly Savings Required", formatCurrency(result.monthly_savings)],
        ["Total Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.total_earnings)],
      ];
    default:
      return [
        ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.growth_value)],
        ["Total Future Value", formatCurrency(result.maturity_amount)],
      ];
  }
}

export default function StartSipStaticPage() {
  const activeCalculatorId = useStartSipStore(
    (state) => state.activeCalculatorId,
  );
  const values = useStartSipStore((state) => state.values);
  const result = useStartSipStore(
    (state) => state.result as StartSipResult | null,
  );
  const loading = useStartSipStore((state) => state.loading);
  const error = useStartSipStore((state) => state.error);
  const setActiveCalculator = useStartSipStore(
    (state) => state.setActiveCalculator,
  );
  const setFieldValue = useStartSipStore((state) => state.setFieldValue);
  const calculate = useStartSipStore((state) => state.calculate);

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
    () => buildResultRows(activeCalculatorId, values, result),
    [activeCalculatorId, values, result],
  );

  const chartData = useMemo(
    () => buildChartData(activeCalculatorId, values, result),
    [activeCalculatorId, values, result],
  );

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
    <div
      className="bg-white text-[#111111]"
      style={{ backgroundColor: "#ffffff" }}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-10">
        <div className="grid items-start gap-10 lg:grid-cols-[320px_1fr]">
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

          <div className="min-h-screen">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[22px] font-medium">
                {activeCalculator.title}
              </h2>
              {activeCalculator.isInteractive && !loading && !error ? (
                <StartSipReportDownload
                  activeTab={activeCalculator.tab || ""}
                  result={result}
                  values={values}
                  barChartRef={barChartRef}
                  pieChartRef={pieChartRef}
                  chartType={chartData?.type || null}
                  className="flex items-center justify-center gap-2 rounded-md bg-[#0B3B6E] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#082d54]"
                />
              ) : null}
            </div>

            <div
              className="mt-6 rounded-[8px] border border-[#D8D8D8] p-6 lg:p-10"
              style={{ backgroundColor: "#FAFAFA" }}
            >
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
                      value={
                        values[field.key as keyof typeof values] as
                          | string
                          | number
                      }
                      onChange={(event) =>
                        setFieldValue(field.key, Number(event.target.value))
                      }
                      className="h-[58px] w-full rounded-[4px] border border-[#E2E2E2] bg-white px-4 text-[18px] outline-none transition focus:border-[#0B3B6E]"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-10">
              {loading ? (
                <div className="py-20 text-center text-slate-500">
                  Calculating...
                </div>
              ) : (
                <>
                  {error ? (
                    <div className="mb-6 rounded-[8px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  {!error ? (
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
                  ) : null}

                  {!error && resultRows.length > 0 ? (
                    <div className="mt-5 lg:items-center">
                      <div
                        ref={pieChartRef}
                        className="flex justify-center bg-white p-2"
                        style={{ backgroundColor: "#ffffff" }}
                      >
                        {chartData?.type === "sip" ? (
                          <DonutChart
                            data={chartData.pieData || []}
                            height={360}
                            innerRadius={0}
                            outerRadius={116}
                          />
                        ) : null}
                      </div>

                      <div
                        className="overflow-hidden rounded-[6px] mt-8 border border-[#DADADA]"
                        style={{ backgroundColor: "#ffffff" }}
                      >
                        <div
                          className="grid grid-cols-[1.4fr_0.7fr]"
                          style={{ backgroundColor: "#F7F7F7" }}
                        >
                          <div className="border-r border-[#DADADA] px-4 py-7 text-[20px] font-semibold">
                            Results
                          </div>
                          <div className="px-4 py-4 text-[20px] font-semibold">
                            Amount
                          </div>
                        </div>
                        {resultRows.map(([label, value]) => (
                          <div
                            key={label}
                            className="grid grid-cols-[1.4fr_0.7fr] border-t border-[#DADADA] text-[18px] leading-9"
                          >
                            <div className="border-r border-[#DADADA] px-4 py-8">
                              {label}
                            </div>
                            <div className="px-4 py-8">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
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
