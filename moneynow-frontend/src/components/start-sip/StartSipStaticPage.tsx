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

// const FIELD_CONFIG = {
//   "sip-starter": [
//     { key: "sip_amount", label: "Monthly SIP Amount (Rs.)", type: "number" },
//     { key: "years", label: "Investment Duration (Years)", type: "number" },
//     { key: "expected_return", label: "Expected Return (%)", type: "number" },
//   ],
//   "step-up-sip": [
//     { key: "sip_amount", label: "Monthly SIP Amount (Rs.)", type: "number" },
//     { key: "years", label: "Investment Duration (Years)", type: "number" },
//     { key: "expected_return", label: "Expected Return (%)", type: "number" },
//     { key: "sip_stepup_value", label: "Annual Step Up (%)", type: "number" },
//   ],
//   "target-based-sip": [
//     { key: "wealth_amount", label: "Target Amount (Rs.)", type: "number" },
//     { key: "years", label: "Investment Duration (Years)", type: "number" },
//     { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
//     { key: "expected_return", label: "Expected Return (%)", type: "number" },
//   ],
//   "crore-journey": [
//     { key: "current_age", label: "Current Age", type: "number" },
//     { key: "retirement_age", label: "Target Age", type: "number" },
//     { key: "expected_return", label: "Expected Return (%)", type: "number" },
//     { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
//     { key: "savings_amount", label: "Current Savings (Rs.)", type: "number" },
//   ],
// } as const;

const FIELD_CONFIG = {
  "lumpsum-calculator": [
    { key: "lumpsum_amount", label: "Lumpsum Amount (Rs.)", type: "number" },
    { key: "interest_rate", label: "Expected Return (%)", type: "number" },
    { key: "lumpsum_period", label: "Investment Period (Years)", type: "number" },
  ],

  "sip-starter": [
    { key: "sip_amount", label: "Monthly SIP Amount (Rs.)", type: "number" },
    { key: "years", label: "Investment Duration (Years)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
  ],

  "goal-setting": [
    { key: "dream_amount", label: "Dream Amount (Rs.)", type: "number" },
    { key: "savings_amount", label: "Current Savings (Rs.)", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "goal_years", label: "Years", type: "number" },
  ],

  "step-up-sip": [
    { key: "stepup_sip_amount", label: "Monthly SIP Amount (Rs.)", type: "number" },
    { key: "stepup_years", label: "Investment Duration (Years)", type: "number" },
    { key: "stepup_return", label: "Expected Return (%)", type: "number" },
    { key: "sip_stepup_value", label: "Annual Step Up (%)", type: "number" },
  ],

  "target-based-sip": [
    { key: "target_amount", label: "Target Amount (Rs.)", type: "number" },
    { key: "years", label: "Investment Duration (Years)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
  ],

  "lumpsum-target": [
    { key: "target_wealth", label: "Target Wealth (Rs.)", type: "number" },
    { key: "years", label: "Investment Duration (Years)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
  ],

  "crore-journey": [
    { key: "current_age", label: "Current Age", type: "number" },
    { key: "retirement_age", label: "Target Age", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "savings_amount", label: "Current Savings (Rs.)", type: "number" },
  ],

  "retirement-planning": [
    { key: "current_age", label: "Current Age", type: "number" },
    { key: "retirement_age", label: "Retirement Age", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "savings_interest_rate", label: "Expected Return (%)", type: "number" },
  ],

  "car-loan": [
    { key: "loan_amount", label: "Loan Amount (Rs.)", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "loan_tenure", label: "Loan Tenure (Years)", type: "number" },
  ],

  "home-loan": [
    { key: "loan_amount", label: "Loan Amount (Rs.)", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "loan_tenure", label: "Loan Tenure (Years)", type: "number" },
  ],

  "education-loan": [
    { key: "loan_amount", label: "Loan Amount (Rs.)", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "loan_tenure", label: "Loan Tenure (Years)", type: "number" },
  ],

  "personal-loan": [
    { key: "loan_amount", label: "Loan Amount (Rs.)", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "loan_tenure", label: "Loan Tenure (Years)", type: "number" },
  ],

  "swp-calculator": [
    { key: "lumpsum_amount", label: "Investment Amount (Rs.)", type: "number" },
    { key: "withdrawal_amount", label: "Monthly Withdrawal (Rs.)", type: "number" },
    { key: "expected_return", label: "Expected Return (%)", type: "number" },
  ],

  "future-value-inflation": [
    { key: "current_cost", label: "Current Cost (Rs.)", type: "number" },
    { key: "inflation_rate", label: "Inflation Rate (%)", type: "number" },
    { key: "no_years", label: "Years", type: "number" },
  ],

  "compounding-calculator": [
    { key: "principal_amount", label: "Principal Amount (Rs.)", type: "number" },
    { key: "interest_rate", label: "Interest Rate (%)", type: "number" },
    { key: "years", label: "Years", type: "number" },
  ],

  "children-education-planner": [],

  "spending-less": [
    { key: "eating_out_value", label: "Eating Out", type: "number" },
    { key: "lifestyle_spending_value", label: "Lifestyle", type: "number" },
    { key: "holidays_value", label: "Holidays", type: "number" },
    { key: "transport_value", label: "Transport", type: "number" },
    { key: "credit_card_interest_value", label: "Credit Card Interest", type: "number" },
    { key: "shopping_value", label: "Shopping", type: "number" },
  ],
} as const;

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
    () => buildStartSipResultRows(activeCalculatorId, values, result),
    [activeCalculatorId, values, result],
  );

  const chartData = useMemo(
    () => buildStartSipChartData(activeCalculatorId, values, result),
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
  (values as Record<string, any>)[field.key] ?? ""
}
                     onChange={(event) => {
  const value =
    field.type === "number"
      ? Number(event.target.value)
      : event.target.value;

  setFieldValue(field.key, value);
}}
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
                          <div className="border-r border-[#DADADA] px-4 py-4 text-[20px] font-semibold">
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
                            <div className="border-r border-[#DADADA] px-4 py-3">
                              {label}
                            </div>
                            <div className="px-4 py-3">{value}</div>
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
