"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCalculator, CalculatorTab } from "@/hooks/useCalculator";
import CalculatorInputs from "@/components/home/CalculatorInputs";
import CalculatorResults from "@/components/home/CalculatorResults";

/* ----------------------------------------
   SIDEBAR → CALCULATOR TAB MAPPING
---------------------------------------- */
const CALCULATOR_MAP: Record<string, CalculatorTab> = {
  "Lumpsum Calculator": "Lumpsum",
  "SIP Calculator": "SIP Calculator",
  "Goal Setting Calculator": "Goal Setting Calculator",
  "SIP with Annual Increase Calculator": "SIP with Annual Increase",
  "Target Amount SIP Calculator": "Target Amount SIP Calculator",
  "Lumpsum Target Calculator": "Lumpsum Target Calculator",
  "Become A Crorepati Calculator": "Become A Crorepati Calculator",
  "Retirement Planning Calculator": "Retirement Planning Calculator",
  "Car Loan Calculator": "Car Loan Calculator",
  "Home Loan Calculator": "Home Loan Calculator",
  "SWP Calculator": "SWP Calculator",
  "Personal Loan EMI Calculator": "Personal Loan EMI Calculator",
  "Education Loan EMI Calculator": "Education Loan EMI Calculator",
  "Future Value Calculator": "Future Value Calculator",
  "Compounding Calculator": "Compounding Calculator",
  "Children Education Planner": "Children Education Planner",
  "Spending Less Calculator": "Spending Less Calculator",
};

/* ----------------------------------------
   FREE CALCULATORS
---------------------------------------- */
type Item = {
  name: string;
  type: "Free";
};

const otherCalculators: Item[] = [
  { name: "Lumpsum Calculator", type: "Free" },
  { name: "SIP Calculator", type: "Free" },
  { name: "Goal Setting Calculator", type: "Free" },
  { name: "SIP with Annual Increase Calculator", type: "Free" },
  { name: "Target Amount SIP Calculator", type: "Free" },
  { name: "Lumpsum Target Calculator", type: "Free" },
  { name: "Become A Crorepati Calculator", type: "Free" },
  { name: "Retirement Planning Calculator", type: "Free" },
  { name: "Car Loan Calculator", type: "Free" },
  { name: "Home Loan Calculator", type: "Free" },
  { name: "SWP Calculator", type: "Free" },
  { name: "Personal Loan EMI Calculator", type: "Free" },
  { name: "Education Loan EMI Calculator", type: "Free" },
  { name: "Future Value Calculator", type: "Free" },
  { name: "Compounding Calculator", type: "Free" },
  { name: "Children Education Planner", type: "Free" },
  { name: "Spending Less Calculator", type: "Free" },
];

/* ----------------------------------------
   COMPONENT
---------------------------------------- */
export default function FreeCalculators() {
  const [activeItem, setActiveItem] = useState<Item>(otherCalculators[0]);
  const [activeTab, setActiveTab] = useState<CalculatorTab>(
    CALCULATOR_MAP[otherCalculators[0].name],
  );

  /* ----------------------------------------
     INPUT VALUES
  ---------------------------------------- */
  const [values, setValuesState] = useState({
    // Common
    sip_amount: 25000,
    lumpsum_amount: 500000,
    interest_rate: 12.5,
    expected_return: 12,
    years: 10,
    period: 120,
    inflation_rate: 6,

    // Goal & Retirement
    dream_amount: 9754439,
    wealth_amount: 2500000,
    current_age: 30,
    retirement_age: 60,
    savings_amount: 0,

    // Step-Up
    sip_stepup_value: 10,

    // Loans
    loan_amount: 1000000,
    loan_tenure: 5,

    // SWP
    withdrawal_amount: 10000,
    lumpsum_period: 10,

    // Target
    target_amount: 5000000,

    // Future Value
    current_cost: 100000,
    no_years: 5,

    // Compounding
    principal_amount: 2500000,
    compound_interval: "Yearly",

    // Children Education - dynamic array
    children: [
      {
        name: "Child 1",
        currentAge: 2,
        educationAge: 4,
        educationAmount: 50000,
      },
    ],

    // Spending Less (separate keys so it doesn't clash)
    current_age_spending: 25,
    retire_age: 60,
    savings_interest_rate: 12,
    income_tax_rate: 7,
    inflation_rate_spending: 5,
    house_flat_value: 500000,
    home_loan_emi_value: 30000,
    new_car_value: 300000,
    eating_out_value: 25000,
    lifestyle_spending_value: 25000,
    holidays_value: 10000,
    transport_value: 10000,
    credit_card_interest_value: 30000,
    personal_loan_value: 20000,
    shopping_value: 10000,
  });

  const setValues = (key: string, value: any) =>
    setValuesState((prev) => ({ ...prev, [key]: value }));

  const { calculate, result, loading } = useCalculator();

  /* ----------------------------------------
     SIDEBAR CLICK
  ---------------------------------------- */
  const handleSelect = (item: Item) => {
    setActiveItem(item);
    const mappedTab = CALCULATOR_MAP[item.name];
    if (mappedTab) setActiveTab(mappedTab);
  };

  /* ----------------------------------------
     DEBOUNCED CALCULATION
  ---------------------------------------- */
  const debounceRef = useRef<number | null>(null);

  const runCalculation = useCallback(() => {
    calculate(activeTab, values);
  }, [activeTab, values, calculate]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      runCalculation();
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runCalculation]);

  /* ----------------------------------------
     UI
  ---------------------------------------- */
  return (
    <section className="w-full py-6 font-inter">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-[28px] text-center font-semibold mb-6 border-[#E8e8e8] border-b pb-4">
          Calculators
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 border-r pr-6 border-[#E8e8e8] space-y-4">
              <p className="text-[18px] font-semibold text-[#043F79] mb-2">
                All Calculators
              </p>

              <ul className="divide-y divide-[#E8E8E8]">
                {otherCalculators.map((item) => (
                  <li key={item.name} className="py-3">
                    <button
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left ${
                        activeItem.name === item.name
                          ? "text-[#043F79] font-bold"
                          : "hover:text-[#043F79] text-gray-700"
                      }`}
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <main className="lg:col-span-9 space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-6">{activeItem.name}</h2>

              <CalculatorInputs
                activeTab={activeTab}
                values={values}
                setValues={setValues}
              />

              <CalculatorResults
                activeTab={activeTab}
                result={result}
                values={values}
                isLoading={loading}
              />
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}
