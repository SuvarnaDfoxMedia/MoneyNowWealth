


"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCalculator, CalculatorTab } from "@/hooks/useCalculator";
import CalculatorInputs from "@/components/home/CalculatorInputs";
import CalculatorResults from "@/components/home/CalculatorResults";

const TABS: CalculatorTab[] = [
  "SIP Growth",
  "Step-Up SIP",
  "Lumpsum",
  "Goal Planner",
  "Retirement Planner",
];

export default function HomeCalculators() {
  const [activeTab, setActiveTab] = useState<CalculatorTab>("SIP Growth");

  const [values, setValuesState] = useState({
    sip_amount: 25000,
    lumpsum_amount: 250000,
    dream_amount: 500000,
    wealth_amount: 5000000,
    years: 10,
    expected_return: 12.5,
    inflation_rate: 8,
    sip_stepup_value: 10,
    retirement_age: 60,
    current_age: 30,
    savings_amount: 2500000,
  });

  const setValues = (key: string, value: number) =>
    setValuesState((prev) => ({ ...prev, [key]: value }));

  const { calculate, result, loading } = useCalculator();

  /* ---------- DEBOUNCE CALCULATION ---------- */
  const debounceRef = useRef<number | null>(null);

  const runCalculation = useCallback(() => {
    calculate(activeTab, values);
  }, [
    activeTab,
    values.sip_amount,
    values.lumpsum_amount,
    values.dream_amount,
    values.wealth_amount,
    values.years,
    values.expected_return,
    values.inflation_rate,
    values.sip_stepup_value,
    values.retirement_age,
    values.current_age,
    values.savings_amount,
    calculate,
  ]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      runCalculation();
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runCalculation]);
  /* ------------------------------------------- */

  /* ---------- SAFE FALLBACK VALUES ---------- */
  const invested =
    result?.invested_amount ??
    result?.stepup_invested_amount ??
    result?.lumpsum_amount ??
    result?.savings_amount ??
    values.sip_amount * values.years * 12;

  const returns =
    result?.growth_value ??
    result?.stepup_growth_value ??
    result?.total_earnings ??
    0;

  const future =
    result?.maturity_amount ??
    result?.stepup_maturity_amount ??
    result?.target_amount ??
    result?.future_amount ??
    0;

  return (
    <div className="bg-[#F4F9FF] py-10">
      <div className="container mx-auto px-4">
      <h2 className="text-[32px] font-bold text-center mb-2 font-poppins">
  See What's Possible with Your Money
</h2>

<p className="text-[18px] text-[#6A6A6A] mb-5 text-center">Mullam varius turpis et commodo pharetra est eros bibendum eli nec luctus magnafelis </p>

        {/* Tabs */}
        <div className="flex border-b border-[#D9D9D9] mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-12 py-3 text-[18px] font-semibold whitespace-nowrap ${
                activeTab === tab
                  ? "text-[#043F79]  font-bold border-b-4 border-[#043F79]"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <CalculatorInputs
          activeTab={activeTab}
          values={values}
          setValues={setValues}
        />

        {/* Results */}
        <CalculatorResults
          activeTab={activeTab}
          result={result}
          invested={invested}
          returns={returns}
          future={future}
          currentAge={values.current_age}
          retirementAge={values.retirement_age}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
