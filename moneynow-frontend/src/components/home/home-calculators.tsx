// "use client";

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useCalculator, CalculatorTab } from "@/hooks/useCalculator";
// import CalculatorInputs from "@/components/home/CalculatorInputs";
// import CalculatorResults from "@/components/home/CalculatorResults";

// const TABS: CalculatorTab[] = [
//   "SIP Growth",
//   "Step-Up SIP",
//   "Lumpsum",
//   "Goal Planner",
//   "Retirement Planner",
// ];

// export default function HomeCalculators() {
//   const [activeTab, setActiveTab] = useState<CalculatorTab>("SIP Growth");

//   const [values, setValuesState] = useState({
//     sip_amount: 25000,
//     lumpsum_amount: 250000,
//     dream_amount: 500000,
//     wealth_amount: 5000000,
//     years: 10,
//     expected_return: 12.5,
//     inflation_rate: 8,
//     sip_stepup_value: 10,
//     retirement_age: 60,
//     current_age: 30,
//     savings_amount: 2500000,
//   });

//   const setValues = (key: string, value: number) =>
//     setValuesState((prev) => ({ ...prev, [key]: value }));

//   const { calculate, result, loading } = useCalculator();

//   // ---------------- DEBOUNCE CALCULATION ----------------
//   const debounceRef = useRef<number | null>(null);

//   const runCalculation = useCallback(() => {
//     calculate(activeTab, values);
//   }, [activeTab, calculate, values]);

//   useEffect(() => {
//     if (debounceRef.current) clearTimeout(debounceRef.current);

//     debounceRef.current = window.setTimeout(() => {
//       runCalculation();
//     }, 400);

//     return () => {
//       if (debounceRef.current) clearTimeout(debounceRef.current);
//     };
//   }, [runCalculation]);
//   // ------------------------------------------------------

//   const invested = result?.invested_amount ?? 0;
//   const returns = result?.returns ?? 0;
//   const future = result?.future_amount ?? 0;

//   return (
//     <div className="bg-[#F4F9FF] py-10">
//       <div className="container mx-auto px-4">
//         <h2 className="text-[32px] font-bold text-center mb-2 font-poppins">
//           See What's Possible with Your Money
//         </h2>

//         <p className="text-[18px] text-[#6A6A6A] mb-5 text-center">
//           Mullam varius turpis et commodo pharetra est eros bibendum eli nec
//           luctus magnafelis
//         </p>

//         {/* Tabs */}
//         <div className="flex border-b border-[#D9D9D9] mb-6 overflow-x-auto">
//           {TABS.map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`px-12 py-3 text-[18px] font-semibold whitespace-nowrap ${
//                 activeTab === tab
//                   ? "text-[#043F79] font-bold border-b-4 border-[#043F79]"
//                   : "text-gray-500"
//               }`}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {/* Inputs */}
//         <CalculatorInputs
//           activeTab={activeTab}
//           values={values}
//           setValues={setValues}
//         />

//         {/* Results */}
//         <CalculatorResults
//           activeTab={activeTab}
//           result={result}
//           invested={invested}
//           returns={returns}
//           future={future}
//           currentAge={values.current_age}
//           retirementAge={values.retirement_age}
//           isLoading={loading}
//         />
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCalculator, CalculatorTab } from "@/hooks/useCalculator";
import CalculatorInputs from "@/components/home/CalculatorInputs";
import CalculatorResults from "@/components/home/CalculatorResults";

const TABS: CalculatorTab[] = [
  "Lumpsum",
  "SIP Calculator",
  "Goal Setting Calculator",
  "SIP with Annual Increase",
  // "Target Amount SIP Calculator",
  // "Lumpsum Target Calculator",
  // "Become A Crorepati Calculator",
  "Retirement Planning Calculator",
  // "Car Loan Calculator",
  // "Home Loan Calculator",
  // "SWP Calculator",
  // "Personal Loan EMI Calculator",
  // "Education Loan EMI Calculator",
  // "Future Value Calculator",
  // "Compounding Calculator",
  // "Children Education Planner",
  // "Spending Less Calculator",
];

export default function HomeCalculators() {
  const [activeTab, setActiveTab] = useState<CalculatorTab>("SIP Calculator");

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

    // Spending Less
    retire_age: 60,
    savings_interest_rate: 12,
    income_tax_rate: 7,
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

  // ---------------- DEBOUNCE CALCULATION ----------------
  const debounceRef = useRef<number | null>(null);

  const runCalculation = useCallback(() => {
    calculate(activeTab, values);
  }, [activeTab, calculate, values]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      runCalculation();
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runCalculation]);

  return (
    <div className="bg-[#F4F9FF] py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-[32px] font-bold text-center mb-2 font-poppins">
          See What's Possible with Your Money
        </h2>

        <p className="text-[18px] text-[#6A6A6A] mb-5 text-center">
          Mullam varius turpis et commodo pharetra est eros bibendum eli nec
          luctus magnafelis
        </p>

        {/* Tabs - Scrollable for all 17 calculators */}
        <div className="flex border-b border-[#D9D9D9] mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-3 text-[18px] font-semibold whitespace-nowrap ${
                activeTab === tab
                  ? "text-[#043F79] font-bold border-b-4 border-[#043F79]"
                  : "text-gray-500 hover:text-[#043F79]"
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
          values={values}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
