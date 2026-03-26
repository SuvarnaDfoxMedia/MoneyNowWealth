

// const TABS: CalculatorTab[] = [
//   "SIP Growth",
//   "Step-Up SIP",
//   "Lumpsum",
//   "Goal Planner",
//   "Retirement Planner",
// ];

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CalculatorTab } from "@/hooks/useCalculator";
import { useCalculator } from "@/hooks/useCalculator";
import CalculatorInputs from "@/components/home/CalculatorInputs";
import CalculatorResults from "@/components/home/CalculatorResults";

const TABS: CalculatorTab[] = [
  "SIP Calculator",
  "SIP with Annual Increase",
  "Lumpsum",
  "Goal Setting Calculator",
  "Retirement Planning Calculator",
];

interface PremiumCalculatorsProps {
  calculator?: string;
}

const CALCULATOR_SLUG_MAP: Record<string, CalculatorTab> = {
  sip: "SIP Calculator",
  stepup: "SIP with Annual Increase",
  lumpsum: "Lumpsum",
  goal: "Goal Setting Calculator",
  retirement: "Retirement Planning Calculator",
};

export default function PremiumCalculators({
  calculator,
}: PremiumCalculatorsProps) {
  const initialTab = calculator ? CALCULATOR_SLUG_MAP[calculator] : undefined;
  const [activeTab, setActiveTab] = useState<CalculatorTab>(
    initialTab ?? "SIP Calculator",
  );

  const [values, setValuesState] = useState({
    // SIP / Step-up
    sip_amount: 25000,
    period: 120,
    interest_rate: 12.5,
    sip_stepup_value: 10,

    // Lumpsum / Goal / Retirement
    lumpsum_amount: 250000,
    dream_amount: 500000,
    wealth_amount: 5000000,
    years: 10,
    expected_return: 12.5,
    inflation_rate: 8,
    retirement_age: 60,
    current_age: 30,
    savings_amount: 2500000,
  });

  const setValues = (key: string, value: number) =>
    setValuesState((prev) => ({ ...prev, [key]: value }));

  const { calculate, result, loading } = useCalculator();

  /* ---------- DEBOUNCE ---------- */
  const debounceRef = useRef<number | null>(null);

  const runCalculation = useCallback(() => {
    calculate(activeTab, values);
  }, [activeTab, values, calculate]);

  useEffect(() => {
    if (!calculator) return;
    const mappedTab = CALCULATOR_SLUG_MAP[calculator];
    if (mappedTab && mappedTab !== activeTab) {
      setActiveTab(mappedTab);
    }
  }, [calculator, activeTab]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(runCalculation, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runCalculation]);

  return (
    <div className="bg-[#F4F9FF] py-10 overflow-x-hidden">
      <div className="container mx-auto px-4 max-w-7xl min-w-0">
        <h2 className="text-[28px] md:text-[32px] font-bold text-center mb-2 font-poppins">
          Premium Investment Calculator
        </h2>

        <p className="text-[16px] md:text-[18px] text-[#6A6A6A] mb-5 text-center">
          Advanced insights for premium investors
        </p>

        {/* Tabs */}
        <div className="flex border-b border-[#D9D9D9] mb-6 overflow-x-auto overflow-y-hidden min-w-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 md:px-8 lg:px-12 py-3 text-[16px] md:text-[18px] font-semibold whitespace-nowrap shrink-0 ${
                activeTab === tab
                  ? "text-[#043F79] border-b-4 border-[#043F79]"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SAME INPUT UI */}
        <CalculatorInputs
          activeTab={activeTab}
          values={values}
          setValues={setValues}
        />

        {/* SAME RESULT UI */}
        <CalculatorResults
          activeTab={activeTab}
          result={result}
          values={values}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
