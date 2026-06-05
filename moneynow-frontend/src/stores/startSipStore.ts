// "use client";

// import { create } from "zustand";
// import { devtools } from "zustand/middleware";
// import {
//   CalculatorTab,
//   requestCalculatorResult,
// } from "@/hooks/useCalculator";

// export type StartSipCalculatorId =
//   | "sip-starter"
//   | "step-up-sip"
//   | "target-based-sip"
//   | "crore-journey"
//   | "sip-returns";

// export interface StartSipCalculatorItem {
//   id: StartSipCalculatorId;
//   title: string;
//   tab?: CalculatorTab;
//   isInteractive: boolean;
// }

// export type StartSipResult = Partial<{
//   years: number;
//   target_amount: number;
//   target_wealth: number;
//   invested_amount: number;
//   target_savings: number;
//   savings_amount: number;
//   growth_value: number;
//   stepup_growth_value: number;
//   growth_amount: number;
//   maturity_amount: number;
//   stepup_maturity_amount: number;
//   stepup_invested_amount: number;
//   sip_amount: number;
//   monthly_savings: number;
//   total_earnings: number;
// }>;

// export type StartSipChartState =
//   | {
//       type: "goal";
//       data: Array<{ label: string; target: number; savings: number }>;
//     }
//   | {
//       type: "sip";
//       barData: Array<{
//         label: string;
//         invested: number;
//         growth: number;
//         totalValue: number;
//       }>;
//       pieData: Array<{ label: string; value: number; color: string }>;
//     }
//   | null;

// export const START_SIP_CALCULATORS: StartSipCalculatorItem[] = [
//   {
//     id: "sip-starter",
//     title: "SIP STARTER (CORE) - Calculator",
//     tab: "SIP Calculator",
//     isInteractive: true,
//   },
//   {
//     id: "step-up-sip",
//     title: "Step Up SIP - Calculator",
//     tab: "SIP with Annual Increase",
//     isInteractive: true,
//   },
//   {
//     id: "target-based-sip",
//     title: "TARGET-BASED SIP",
//     tab: "Target Amount SIP Calculator",
//     isInteractive: true,
//   },
//   {
//     id: "crore-journey",
//     title: "₹1 CRORE JOURNEY",
//     tab: "Become A Crorepati Calculator",
//     isInteractive: true,
//   },
//   {
//     id: "sip-returns",
//     title: "SIP RETURNS BY CATEGORY (inside Learn)",
//     isInteractive: false,
//   },
// ];

// export const START_SIP_DEFAULT_VALUES = {
//   sip_amount: 25000,
//   lumpsum_amount: 500000,
//   interest_rate: 12,
//   expected_return: 12,
//   years: 10,
//   period: 120,
//   inflation_rate: 6,
//   dream_amount: 9754439,
//   wealth_amount: 10000000,
//   current_age: 30,
//   retirement_age: 55,
//   savings_amount: 0,
//   sip_stepup_value: 10,
//   loan_amount: 1000000,
//   loan_tenure_type: "year",
//   loan_tenure: 5,
//   withdrawal_amount: 10000,
//   lumpsum_period: 10,
//   target_amount: 5000000,
//   current_cost: 100000,
//   no_years: 5,
//   principal_amount: 2500000,
//   compound_interval: "Yearly",
//   retire_age: 60,
//   savings_interest_rate: 12,
//   income_tax_rate: 7,
//   house_flat_value: 500000,
//   home_loan_emi_value: 30000,
//   new_car_value: 300000,
//   eating_out_value: 25000,
//   lifestyle_spending_value: 25000,
//   holidays_value: 10000,
//   transport_value: 10000,
//   credit_card_interest_value: 30000,
//   personal_loan_value: 20000,
//   shopping_value: 10000,
//   children: [
//     {
//       name: "Child 1",
//       currentAge: 2,
//       educationAge: 18,
//       educationAmount: 500000,
//     },
//     {
//       name: "Child 2",
//       currentAge: 8,
//       educationAge: 20,
//       educationAmount: 500000,
//     },
//   ],
// };

// export type StartSipValues = typeof START_SIP_DEFAULT_VALUES;

// const currentYear = new Date().getFullYear();

// const formatCurrency = (value?: number) =>
//   `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

// export function buildStartSipChartData(
//   activeCalculatorId: string,
//   values: StartSipValues,
//   result: StartSipResult | null,
// ): StartSipChartState {
//   if (!result) return null;

//   if (activeCalculatorId === "crore-journey") {
//     const years = Math.max(
//       1,
//       Number(result.years || values.retirement_age - values.current_age || 1),
//     );
//     const target = Number(result.target_amount || result.target_wealth || 0);
//     const savings = Number(
//       result.invested_amount ||
//         result.target_savings ||
//         result.savings_amount ||
//         0,
//     );

//     return {
//       type: "goal",
//       data: Array.from({ length: years }, (_, index) => ({
//         label: `${currentYear + index}`,
//         target: Math.round(target * ((index + 1) / years)),
//         savings: Math.round(savings * ((index + 1) / years)),
//       })),
//     };
//   }

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
//       result.total_earnings ||
//       0,
//   );
//   const maturity = Number(
//     result.maturity_amount ||
//       result.stepup_maturity_amount ||
//       result.target_wealth ||
//       result.target_amount ||
//       0,
//   );

//   return {
//     type: "sip",
//     barData: Array.from({ length: years }, (_, index) => {
//       const progress = (index + 1) / years;
//       const investedValue = Math.round(invested * progress);
//       const growthValue = Math.round(growth * progress);

//       return {
//         label: `${currentYear + index}`,
//         invested: investedValue,
//         growth: growthValue,
//         totalValue: investedValue + growthValue,
//       };
//     }),
//     pieData: [
//       { label: "Total SIP Amount Invested", value: invested, color: "#48A8C8" },
//       {
//         label: "Total Growth",
//         value: growth || Math.max(maturity - invested, 0),
//         color: "#34A853",
//       },
//     ],
//   };
// }

// export function buildStartSipResultRows(
//   activeCalculatorId: string,
//   values: StartSipValues,
//   result: StartSipResult | null,
// ) {
//   if (!result) return [];

//   switch (activeCalculatorId) {
//     case "step-up-sip":
//       return [
//         [
//           "Total SIP Amount Invested",
//           formatCurrency(
//             result.stepup_invested_amount || result.invested_amount,
//           ),
//         ],
//         [
//           "Total Growth",
//           formatCurrency(result.stepup_growth_value || result.growth_value),
//         ],
//         [
//           "Total Future Value",
//           formatCurrency(
//             result.stepup_maturity_amount || result.maturity_amount,
//           ),
//         ],
//       ];
//     case "target-based-sip":
//       return [
//         [
//           "Target Wealth",
//           formatCurrency(result.target_wealth || values.wealth_amount),
//         ],
//         ["Required SIP Amount", formatCurrency(result.sip_amount)],
//         ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
//         ["Total Growth", formatCurrency(result.growth_amount)],
//       ];
//     case "crore-journey":
//       return [
//         [
//           "Target Corpus",
//           formatCurrency(result.target_amount || result.target_wealth),
//         ],
//         ["Monthly Savings Required", formatCurrency(result.monthly_savings)],
//         ["Total Amount Invested", formatCurrency(result.invested_amount)],
//         ["Total Growth", formatCurrency(result.total_earnings)],
//       ];
//     default:
//       return [
//         ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
//         ["Total Growth", formatCurrency(result.growth_value)],
//         ["Total Future Value", formatCurrency(result.maturity_amount)],
//       ];
//   }
// }

// interface StartSipStore {
//   activeCalculatorId: StartSipCalculatorId;
//   values: StartSipValues;
//   result: any;
//   loading: boolean;
//   error: string | null;
//   setActiveCalculator: (id: StartSipCalculatorId) => void;
//   setFieldValue: (field: string, value: any) => void;
//   resetValues: () => void;
//   calculate: () => Promise<void>;
// }

// const getActiveCalculator = (id: StartSipCalculatorId) =>
//   START_SIP_CALCULATORS.find((item) => item.id === id) || START_SIP_CALCULATORS[0];

// const buildUiAwareValues = (
//   id: StartSipCalculatorId,
//   values: typeof START_SIP_DEFAULT_VALUES,
// ) => {
//   if (id === "sip-starter" || id === "step-up-sip") {
//     return {
//       ...values,
//       interest_rate: values.expected_return || values.interest_rate,
//       period: Math.max(12, Number(values.years || 1) * 12),
//     };
//   }

//   if (id === "target-based-sip") {
//     return {
//       ...values,
//       period: Math.max(1, Number(values.years || 1)),
//     };
//   }

//   if (id === "crore-journey") {
//     return {
//       ...values,
//       wealth_amount: 10000000,
//     };
//   }

//   return values;
// };

// export const useStartSipStore = create<StartSipStore>()(
//   devtools((set, get) => ({
//     activeCalculatorId: "sip-starter",
//     values: START_SIP_DEFAULT_VALUES,
//     result: null,
//     loading: false,
//     error: null,

//     setActiveCalculator: (id) =>
//       set({
//         activeCalculatorId: id,
//         result: null,
//         error: null,
//       }),

//     setFieldValue: (field, value) =>
//       set((state) => ({
//         values: {
//           ...state.values,
//           [field]: value,
//         },
//       })),

//     resetValues: () =>
//       set({
//         values: START_SIP_DEFAULT_VALUES,
//         result: null,
//         error: null,
//       }),

//     calculate: async () => {
//       const { activeCalculatorId, values } = get();
//       const calculator = getActiveCalculator(activeCalculatorId);

//       if (!calculator.isInteractive || !calculator.tab) {
//         set({
//           error: "This section is part of Learn and is not an interactive calculator.",
//           result: null,
//         });
//         return;
//       }

//       try {
//         set({ loading: true, error: null });

//         const uiValues = buildUiAwareValues(activeCalculatorId, values);
//         const data = await requestCalculatorResult(calculator.tab, uiValues);

//         set({
//           result: data,
//           loading: false,
//         });
//       } catch (error: any) {
//         set({
//           loading: false,
//           result: null,
//           error:
//             error?.response?.data?.message ||
//             error?.response?.data?.msg ||
//             error?.message ||
//             "Calculation failed",
//         });
//       }
//     },
//   })),
// );




"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  CalculatorTab,
  requestCalculatorResult,
} from "@/hooks/useCalculator";

export type StartSipCalculatorId =
  | "lumpsum-calculator"
  | "sip-starter"
  | "goal-setting"
  | "step-up-sip"
  | "target-based-sip"
  | "lumpsum-target"
  | "crore-journey"
  | "retirement-planning"
  | "car-loan"
  | "home-loan"
  | "swp-calculator"
  | "education-loan"
  | "personal-loan"
  | "future-value-inflation"
  | "compounding-calculator"
  | "children-education-planner"
  | "spending-less"
  | "sip-returns";

export interface StartSipCalculatorItem {
  id: StartSipCalculatorId;
  title: string;
  tab?: CalculatorTab;
  isInteractive: boolean;
}

export type StartSipResult = Partial<{
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
  future_amount: number;
  dream_amount_inflation: number;
  growth_savings_amount: number;
  final_target_amount: number;
  required_sip_amount: number;
  total_interest: number;
  total_payment: number;
  monthly_emi: number;
  total_withdrawal: number;
  final_balance: number;
  future_cost: number;
  compound_maturity: number;
  total_gain: number;
  total_savings_value: number;
}>;

export type StartSipChartState =
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

export const START_SIP_CALCULATORS: StartSipCalculatorItem[] = [
  {
    id: "lumpsum-calculator",
    title: "Lumpsum Calculator",
    tab: "Lumpsum",
    isInteractive: true,
  },
  {
    id: "sip-starter",
    title: "SIP Calculator",
    tab: "SIP Calculator",
    isInteractive: true,
  },
  {
    id: "goal-setting",
    title: "Goal Setting Calculator",
    tab: "Goal Setting Calculator",
    isInteractive: true,
  },
  {
    id: "step-up-sip",
    title: "SIP with Annual Increase Calculator",
    tab: "SIP with Annual Increase",
    isInteractive: true,
  },
  {
    id: "target-based-sip",
    title: "Target Amount SIP Calculator",
    tab: "Target Amount SIP Calculator",
    isInteractive: true,
  },
  {
    id: "lumpsum-target",
    title: "Lumpsum Target Calculator",
    tab: "Lumpsum Target Calculator",
    isInteractive: true,
  },
  {
    id: "crore-journey",
    title: "Become A Crorepati Calculator",
    tab: "Become A Crorepati Calculator",
    isInteractive: true,
  },
  {
    id: "retirement-planning",
    title: "Retirement Planning Calculator",
    tab: "Retirement Planning Calculator",
    isInteractive: true,
  },
  {
    id: "car-loan",
    title: "Car Loan Calculator",
    tab: "Car Loan Calculator",
    isInteractive: true,
  },
  {
    id: "home-loan",
    title: "Home Loan Calculator",
    tab: "Home Loan Calculator",
    isInteractive: true,
  },
  {
    id: "swp-calculator",
    title: "SWP Calculator",
    tab: "SWP Calculator",
    isInteractive: true,
  },
  {
    id: "education-loan",
    title: "Education Loan EMI Calculator",
    tab: "Education Loan EMI Calculator",
    isInteractive: true,
  },
  {
    id: "personal-loan",
    title: "Personal Loan EMI Calculator",
    tab: "Personal Loan EMI Calculator",
    isInteractive: true,
  },
  {
    id: "future-value-inflation",
    title: "Future Value Inflation Calculator",
    tab: "Future Value Calculator",
    isInteractive: true,
  },
  {
    id: "compounding-calculator",
    title: "Compounding Calculator",
    tab: "Compounding Calculator",
    isInteractive: true,
  },
  {
    id: "children-education-planner",
    title: "Children Education Planner",
    tab: "Children Education Planner",
    isInteractive: true,
  },
  {
    id: "spending-less",
    title: "Spending Less Calculator",
    tab: "Spending Less Calculator",
    isInteractive: true,
  },
  {
    id: "sip-returns",
    title: "SIP RETURNS BY CATEGORY (inside Learn)",
    isInteractive: false,
  },
];

export const START_SIP_DEFAULT_VALUES = {
  // Lumpsum Calculator
  lumpsum_amount: 5000000,
  interest_rate: 12,
  lumpsum_period: 26,

  // SIP Calculator
  sip_amount: 10000,
  expected_return: 12,
  years: 10,
  period: 299,

  // Goal Setting Calculator
  dream_amount: 10000000,
  savings_amount: 1000000,
  inflation_rate: 5,
  goal_years: 30,

  // SIP with Annual Increase Calculator
  stepup_sip_amount: 25000,
  stepup_years: 25,
  stepup_return: 12.4,
  sip_stepup_value: 10,

  // Target Amount SIP Calculator
  target_amount: 5000000,

  // Lumpsum Target Calculator
  target_wealth: 10000000,

  // Become A Crorepati Calculator
  wealth_amount: 10000000,

  // Retirement Planning Calculator
  current_age: 30,
  retirement_age: 55,
  retire_age: 60,
  retirement_inflation: 6,
  savings_interest_rate: 12,

  // Loan Calculators
  loan_amount: 1000000,
  loan_tenure: 5,
  loan_tenure_type: "year",

  // Home Loan Calculator
  house_flat_value: 500000,
  home_loan_emi_value: 30000,
  home_down_payment: 100000,

  // Car Loan Calculator
  new_car_value: 300000,
  car_down_payment: 50000,

  // SWP Calculator
  withdrawal_amount: 10000,

  // Future Value Inflation Calculator
  current_cost: 100000,
  no_years: 5,

  // Compounding Calculator
  principal_amount: 2500000,
  compound_interval: "Yearly",

  // Education Loan EMI Calculator
  education_cost: 1000000,

  // Personal Loan EMI Calculator
  personal_loan_value: 20000,

  // Spending Less Calculator
  eating_out_value: 25000,
  lifestyle_spending_value: 25000,
  holidays_value: 10000,
  transport_value: 10000,
  credit_card_interest_value: 30000,
  shopping_value: 10000,

  // Miscellaneous
  income_tax_rate: 7,

  // Additional fields used in chart/result logic
  invested_amount: 0,
  growth_amount: 0,
  growth_value: 0,
  maturity_amount: 0,
  future_amount: 0,
  monthly_savings: 0,
  total_earnings: 0,
  total_interest: 0,
  total_payment: 0,
  monthly_emi: 0,
  total_withdrawal: 0,
  final_balance: 0,
  future_cost: 0,
  compound_maturity: 0,
  total_gain: 0,
  total_savings_value: 0,
  required_sip_amount: 0,
  dream_amount_inflation: 0,
  growth_savings_amount: 0,
  final_target_amount: 0,

  // Children Education Planner
  children: [
    {
      name: "Child 1",
      currentAge: 2,
      educationAge: 18,
      educationAmount: 500000,
    },
    {
      name: "Child 2",
      currentAge: 8,
      educationAge: 20,
      educationAmount: 500000,
    },
  ],
};


export type StartSipValues = typeof START_SIP_DEFAULT_VALUES;

const currentYear = new Date().getFullYear();

const formatCurrency = (value?: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export function buildStartSipChartData(
  activeCalculatorId: string,
  values: StartSipValues,
  result: StartSipResult | null,
): StartSipChartState {
  if (!result) return null;

  if (activeCalculatorId === "crore-journey" || activeCalculatorId === "goal-setting") {
    const years = Math.max(
      1,
      Number(result.years || values.goal_years || values.retirement_age - values.current_age || 1),
    );
    const target = Number(result.target_amount || result.target_wealth || result.dream_amount_inflation || 0);
    const savings = Number(
      result.invested_amount ||
        result.target_savings ||
        result.savings_amount ||
        result.growth_savings_amount ||
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

  // Loan Chart Mapping Variations
  const isLoan = ["car-loan", "home-loan", "education-loan", "personal-loan"].includes(activeCalculatorId);
  const years = Math.max(1, Number(values.years || values.lumpsum_period || values.stepup_years || values.loan_tenure || result.years || 1));
  
  const invested = isLoan 
    ? Number(result.invested_amount || values.loan_amount || 0)
    : Number(
        result.invested_amount ||
          result.stepup_invested_amount ||
          values.sip_amount * years * 12 ||
          values.lumpsum_amount ||
          0,
      );

  const growth = isLoan 
    ? Number(result.total_interest || result.growth_amount || 0)
    : Number(
        result.growth_value ||
          result.stepup_growth_value ||
          result.growth_amount ||
          result.total_earnings ||
          result.total_gain ||
          0,
      );

  const maturity = Number(
    result.maturity_amount ||
      result.stepup_maturity_amount ||
      result.target_wealth ||
      result.target_amount ||
      result.future_amount ||
      result.compound_maturity ||
      result.total_payment ||
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
      { 
        label: isLoan ? "Principal Loan Amount" : "Total Amount Invested", 
        value: invested, 
        color: "#48A8C8" 
      },
      {
        label: isLoan ? "Total Interest Payable" : "Total Growth",
        value: growth || Math.max(maturity - invested, 0),
        color: "#34A853",
      },
    ],
  };
}

export function buildStartSipResultRows(
  activeCalculatorId: string,
  values: StartSipValues,
  result: StartSipResult | null,
) {
  if (!result) return [];

  switch (activeCalculatorId) {
    case "lumpsum-calculator":
      return [
        ["Your Lumpsum Amount", formatCurrency(values.lumpsum_amount)],
        ["Number of years to achieve your goal", `${values.lumpsum_period} Years`],
        ["Your Future Amount", formatCurrency(result.maturity_amount || result.future_amount)],
      ];
    case "sip-starter":
      return [
        ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.growth_value)],
        ["Total Future Value", formatCurrency(result.maturity_amount)],
      ];
    case "goal-setting":
      return [
        ["Your targeted Dream Amount (Inflation adjusted)", formatCurrency(result.dream_amount_inflation)],
        ["Growth of your Savings Amount", formatCurrency(result.growth_savings_amount)],
        ["Final Targeted Amount", formatCurrency(result.final_target_amount)],
        ["Number of years to achieve your goal", `${values.goal_years} Years`],
        ["Monthly Savings required", formatCurrency(result.monthly_savings || result.sip_amount)],
        ["Total Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth Amount", formatCurrency(result.growth_amount || result.total_earnings)],
      ];
    case "step-up-sip":
      return [
        ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.growth_value)],
        ["Total Future Value", formatCurrency(result.maturity_amount)],
        ["Total SIP Amount Invested with step up", formatCurrency(result.stepup_invested_amount)],
        ["Total Growth with step up", formatCurrency(result.stepup_growth_value)],
        ["Total Future Value with step up", formatCurrency(result.stepup_maturity_amount)],
      ];
    case "target-based-sip":
      return [
        ["Target Wealth", formatCurrency(result.target_wealth || values.target_amount)],
        ["Required SIP Amount", formatCurrency(result.sip_amount || result.required_sip_amount)],
        ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.growth_amount)],
      ];
    case "lumpsum-target":
      return [
        ["Target Wealth", formatCurrency(values.target_wealth)],
        ["Lumpsum Amount Required", formatCurrency(result.invested_amount)],
        ["Total Growth Amount", formatCurrency(result.growth_amount)],
      ];
    case "crore-journey":
      return [
        ["Target Corpus", formatCurrency(result.target_amount || result.target_wealth || 10000000)],
        ["Monthly Savings Required", formatCurrency(result.monthly_savings)],
        ["Total Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.total_earnings)],
      ];
    case "retirement-planning":
      return [
        ["Target Retirement Corpus", formatCurrency(result.target_amount || result.target_wealth)],
        ["Monthly Savings Required", formatCurrency(result.monthly_savings)],
        ["Total Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth Amount", formatCurrency(result.growth_amount || result.total_earnings)],
      ];
    case "car-loan":
    case "home-loan":
    case "education-loan":
    case "personal-loan":
      return [
        ["Monthly EMI", formatCurrency(result.monthly_emi)],
        ["Principal Loan Amount", formatCurrency(values.loan_amount)],
        ["Total Interest Payable", formatCurrency(result.total_interest)],
        ["Total Payment (Principal + Interest)", formatCurrency(result.total_payment)],
      ];
    case "swp-calculator":
      return [
        ["Total Investment", formatCurrency(result.invested_amount)],
        ["Total Withdrawal", formatCurrency(result.total_withdrawal)],
        ["Final Balance", formatCurrency(result.final_balance)],
      ];
    case "future-value-inflation":
      return [
        ["Current Cost", formatCurrency(values.current_cost)],
        ["Future Cost", formatCurrency(result.future_cost || result.maturity_amount)],
      ];
    case "compounding-calculator":
      return [
        ["Principal Amount", formatCurrency(values.principal_amount)],
        ["Total Gain", formatCurrency(result.total_gain || result.growth_value)],
        ["Maturity Amount", formatCurrency(result.compound_maturity || result.maturity_amount)],
      ];
    case "spending-less":
      return [
        ["Total Potential Monthly Savings", formatCurrency(result.monthly_savings)],
        ["Future Value of Savings", formatCurrency(result.total_savings_value || result.maturity_amount)],
      ];
    default:
      return [
        ["Total Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.growth_value)],
        ["Total Future Value", formatCurrency(result.maturity_amount)],
      ];
  }
}

interface StartSipStore {
  activeCalculatorId: StartSipCalculatorId;
  values: StartSipValues;
  result: any;
  loading: boolean;
  error: string | null;
  setActiveCalculator: (id: StartSipCalculatorId) => void;
  setFieldValue: (field: string, value: any) => void;
  resetValues: () => void;
  calculate: () => Promise<void>;
}

const getActiveCalculator = (id: StartSipCalculatorId) =>
  START_SIP_CALCULATORS.find((item) => item.id === id) || START_SIP_CALCULATORS[0];

const buildUiAwareValues = (
  id: StartSipCalculatorId,
  values: typeof START_SIP_DEFAULT_VALUES,
) => {
  // Sync contextual interest rates, periods, and custom payload fields per documentation spec mapping
  if (id === "sip-starter") {
    return {
      ...values,
      interest_rate: values.expected_return,
      period: values.period,
    };
  }

  if (id === "lumpsum-calculator") {
    return {
      ...values,
      period: values.lumpsum_period * 12,
    };
  }

  if (id === "step-up-sip") {
    return {
      ...values,
      sip_amount: values.stepup_sip_amount,
      interest_rate: values.stepup_return,
      period: values.stepup_years * 12,
    };
  }

  if (id === "target-based-sip") {
    return {
      ...values,
      period: Math.max(1, Number(values.years || 1)),
    };
  }

  if (id === "crore-journey") {
    return {
      ...values,
      wealth_amount: 10000000,
    };
  }

  return values;
};

export const useStartSipStore = create<StartSipStore>()(
  devtools((set, get) => ({
    activeCalculatorId: "sip-starter",
    values: START_SIP_DEFAULT_VALUES,
    result: null,
    loading: false,
    error: null,

    setActiveCalculator: (id) =>
      set({
        activeCalculatorId: id,
        result: null,
        error: null,
      }),

    setFieldValue: (field, value) =>
      set((state) => ({
        values: {
          ...state.values,
          [field]: value,
        },
      })),

    resetValues: () =>
      set({
        values: START_SIP_DEFAULT_VALUES,
        result: null,
        error: null,
      }),

    calculate: async () => {
      const { activeCalculatorId, values } = get();
      const calculator = getActiveCalculator(activeCalculatorId);

      if (!calculator.isInteractive || !calculator.tab) {
        set({
          error: "This section is part of Learn and is not an interactive calculator.",
          result: null,
        });
        return;
      }

      try {
        set({ loading: true, error: null });

        const uiValues = buildUiAwareValues(activeCalculatorId, values);
        const data = await requestCalculatorResult(calculator.tab, uiValues);

        set({
          result: data,
          loading: false,
        });
      } catch (error: any) {
        set({
          loading: false,
          result: null,
          error:
            error?.response?.data?.message ||
            error?.response?.data?.msg ||
            error?.message ||
            "Calculation failed",
        });
      }
    },
  })),
);

