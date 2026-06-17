


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
  // {
  //   id: "sip-returns",
  //   title: "SIP RETURNS BY CATEGORY (inside Learn)",
  //   isInteractive: false,
  // },
];

export const START_SIP_DEFAULT_VALUES = {
  // Lumpsum Calculator
  lumpsum_amount: 500000,
  expected_return: 12,
  years: 10,

  // SIP Calculator
  sip_amount: 25000,
  interest_rate: 12.5,
  period: 120,

  // Goal Setting Calculator
  dream_amount: 9754439,
  savings_amount: 0,
  inflation_rate: 6,

  // SIP with Annual Increase Calculator (uses same sip_amount, interest_rate, period, sip_stepup_value)
  sip_stepup_value: 10,

  // Target Amount SIP Calculator
  wealth_amount: 2500000,

  // Lumpsum Target Calculator
  target_amount: 5000000,

  // Become A Crorepati / Retirement Planning Calculator
  current_age: 30,
  retirement_age: 60,

  // Spending Less Calculator
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

  // Loan Calculators
  loan_amount: 1000000,
  loan_tenure: 5,
  loan_tenure_type: "year",

  // SWP Calculator
  withdrawal_amount: 10000,
  lumpsum_period: 10,

  // Future Value Inflation Calculator
  current_cost: 100000,
  no_years: 5,

  // Compounding Calculator
  principal_amount: 2500000,
  compound_interval: "Yearly",

  // Children Education Planner
  children: [
    {
      name: "Child 1",
      currentAge: 2,
      educationAge: 4,
      educationAmount: 50000,
    },
  ],
};


export type StartSipValues = typeof START_SIP_DEFAULT_VALUES;

const currentYear = new Date().getFullYear();

const formatCurrency = (value?: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

export function buildStartSipChartData(
  activeCalculatorId: string,
  values: StartSipValues,
  result: StartSipResult | null,
): StartSipChartState {
  if (!result) return null;

  // Determine years
  let years = Math.max(1, Number(values.years || values.lumpsum_period || values.stepup_years || values.loan_tenure || result.years || 1));
  if (activeCalculatorId === "children-education-planner" && values.children && values.children.length > 0) {
    years = Math.max(...values.children.map((c: any) => Math.max(Number(c.educationAge - c.currentAge) || 1, 1)), 1);
  } else if (activeCalculatorId === "crore-journey" || activeCalculatorId === "goal-setting" || activeCalculatorId === "retirement-planning") {
    years = Math.max(
      1,
      Number(result.years || values.goal_years || values.retirement_age - values.current_age || 1),
    );
  }

  // Loan Chart Mapping Variations
  const isLoan = ["car-loan", "home-loan", "education-loan", "personal-loan"].includes(activeCalculatorId);

  let invested = 0;
  if (isLoan) {
    invested = Number(result.invested_amount || values.loan_amount || 0);
  } else if (activeCalculatorId === "children-education-planner") {
    invested = Number(result.total_savings_amount || 0);
  } else if (activeCalculatorId === "spending-less") {
    invested = Number(result.savings_amount || 0);
  } else if (activeCalculatorId === "crore-journey" || activeCalculatorId === "goal-setting" || activeCalculatorId === "retirement-planning") {
    invested = Number(
      result.invested_amount ||
        result.target_savings ||
        result.savings_amount ||
        result.growth_savings_amount ||
        result.total_savings_amount ||
        0,
    );
  } else {
    invested = Number(
      result.invested_amount ||
        result.stepup_invested_amount ||
        values.sip_amount * years * 12 ||
        values.lumpsum_amount ||
        0,
    );
  }

  let growth = 0;
  if (isLoan) {
    growth = Number(result.total_interest || result.growth_amount || 0);
  } else if (activeCalculatorId === "children-education-planner") {
    growth = Number((result.total_inflation_adjust_education_amount || 0) - (result.total_savings_amount || 0));
  } else if (activeCalculatorId === "spending-less") {
    growth = Number((result.savings_maturity_amount || 0) - (result.savings_amount || 0));
  } else if (activeCalculatorId === "crore-journey" || activeCalculatorId === "goal-setting" || activeCalculatorId === "retirement-planning") {
    const target = Number(result.target_amount || result.target_wealth || result.dream_amount_inflation || 0);
    growth = Math.max(target - invested, 0);
  } else {
    growth = Number(
      result.growth_value ||
        result.stepup_growth_value ||
        result.growth_amount ||
        result.total_earnings ||
        result.total_gain ||
        0,
    );
  }

  let maturity = 0;
  if (activeCalculatorId === "children-education-planner") {
    maturity = Number(result.total_inflation_adjust_education_amount || 0);
  } else if (activeCalculatorId === "spending-less") {
    maturity = Number(result.savings_maturity_amount || 0);
  } else if (activeCalculatorId === "crore-journey" || activeCalculatorId === "goal-setting" || activeCalculatorId === "retirement-planning") {
    maturity = Number(result.target_amount || result.target_wealth || result.dream_amount_inflation || 0);
  } else {
    maturity = Number(
      result.maturity_amount ||
        result.stepup_maturity_amount ||
        result.target_wealth ||
        result.target_amount ||
        result.future_amount ||
        result.compound_maturity ||
        result.total_payment ||
        0,
    );
  }

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
        ["Lumpsum Amount", formatCurrency(result.lumpsum_amount)],
        ["Expected Return", `${result.expected_return ?? values.expected_return}%`],
        ["Time Period", `${result.years} Years`],
        ["Future Amount", formatCurrency(result.future_amount)],
      ];
    case "sip-starter":
      return [
        ["Monthly SIP Amount", formatCurrency(result.sip_amount)],
        ["Interest Rate", `${result.interest_rate}%`],
        ["Period in Months", `${result.period}`],
        ["Invested Amount", formatCurrency(result.invested_amount)],
        ["Growth Value", formatCurrency(result.growth_value)],
        ["Maturity Amount", formatCurrency(result.maturity_amount)],
      ];
    case "goal-setting":
      return [
        ["No of Years", `${result.years}`],
        ["Dream Amount", formatCurrency(result.dream_amount)],
        ["Inflation Rate", `${result.inflation_rate}%`],
        ["Expected Return", `${result.expected_return}%`],
        ["Savings Amount", formatCurrency(result.savings_amount)],
        ["Target Dream Amount", formatCurrency(result.target_dream_amount)],
        ["Target Savings Amount", formatCurrency(result.target_savings_amount)],
        ["Target Amount", formatCurrency(result.target_amount)],
        ["Monthly Savings", formatCurrency(result.monthly_savings)],
        ["Invested Amount", formatCurrency(result.invested_amount)],
        ["Total Earnings", formatCurrency(result.total_earnings)],
      ];
    case "step-up-sip":
      return [
        ["Monthly SIP Amount", formatCurrency(result.sip_amount)],
        ["Interest Rate", `${result.interest_rate}%`],
        ["Period in Months", `${result.period}`],
        ["SIP Step Up Value", `${result.sip_stepup_value}%`],
        ["Invested Amount", formatCurrency(result.invested_amount)],
        ["Growth Value", formatCurrency(result.growth_value)],
        ["Maturity Amount", formatCurrency(result.maturity_amount)],
        ["Step-Up Invested Amount", formatCurrency(result.stepup_invested_amount)],
        ["Step-Up Growth Value", formatCurrency(result.stepup_growth_value)],
        ["Step-Up Maturity Amount", formatCurrency(result.stepup_maturity_amount)],
      ];
    case "target-based-sip":
      return [
        ["Target Amount", formatCurrency(result.wealth_amount)],
        ["Inflation Rate", `${result.inflation_rate}%`],
        ["Expected Return", `${result.expected_return}%`],
        ["Investment Period", `${result.period} Years`],
        ["Target Wealth", formatCurrency(result.target_wealth)],
        ["SIP Amount", formatCurrency(result.sip_amount)],
        ["Invested Amount", formatCurrency(result.invested_amount)],
        ["Growth Amount", formatCurrency(result.growth_amount)],
      ];
    case "lumpsum-target":
      return [
        ["Target Amount", formatCurrency(result.target_amount)],
        ["Expected Return", `${result.expected_return}%`],
        ["Investment Period", `${result.years} Years`],
        ["Lumpsum Amount", formatCurrency(result.lumpsum_amount)],
      ];
    case "crore-journey":
      return [
        ["Current Age (Years)", `${result.current_age}`],
        ["Retirement Age (Years)", `${result.retirement_age}`],
        ["Wealth Amount", formatCurrency(result.wealth_amount)],
        ["Inflation Rate", `${result.inflation_rate}%`],
        ["Expected Return", `${result.expected_return}%`],
        ["Savings Amount", formatCurrency(result.savings_amount)],
        ["Target Wealth", formatCurrency(result.target_wealth)],
        ["Target Savings", formatCurrency(result.target_savings)],
        ["Target Amount", formatCurrency(result.target_amount)],
        ["Years", `${result.years}`],
        ["Monthly Savings", formatCurrency(result.monthly_savings)],
        ["Invested Amount", formatCurrency(result.invested_amount)],
        ["Total Earnings", formatCurrency(result.total_earnings)],
      ];
    case "retirement-planning":
      return [
        ["Current Age (Years)", `${result.current_age}`],
        ["Retirement Age (Years)", `${result.retirement_age}`],
        ["Wealth Amount", formatCurrency(result.wealth_amount)],
        ["Inflation Rate", `${result.inflation_rate}%`],
        ["Expected Return", `${result.expected_return}%`],
        ["Savings Amount", formatCurrency(result.savings_amount)],
        ["Target Wealth", formatCurrency(result.target_wealth)],
        ["Target Savings", formatCurrency(result.target_savings)],
        ["Target Amount", formatCurrency(result.target_amount)],
        ["Years", `${result.years}`],
        ["Monthly Savings", formatCurrency(result.monthly_savings)],
        ["Invested Amount", formatCurrency(result.invested_amount)],
        ["Total Earnings", formatCurrency(result.total_earnings)],
      ];
    case "car-loan":
    case "home-loan":
    case "education-loan":
    case "personal-loan":
      return [
        ["Loan Amount", formatCurrency(result.loan_amount)],
        ["Interest Rate", `${result.interest_rate}%`],
        ["Loan Tenure Type", `${result.loan_tenure_type}`],
        ["Loan Tenure", `${result.loan_tenure}`],
        ["EMI", formatCurrency(result.emi)],
        ["Total Interest", formatCurrency(result.total_interest)],
        ["Total Amount", formatCurrency(result.total_amount)],
      ];
    case "swp-calculator":
      return [
        ["Invested Amount", formatCurrency(result.invested_amount)],
        ["SWP Tenure", `${result.swp_tenure} Years`],
        ["Total Withdrawal Amount", formatCurrency(result.total_withdrawal_amount)],
        ["Terminal Value", formatCurrency(result.terminal_value)],
      ];
    case "future-value-inflation":
      return [
        ["Current Cost", formatCurrency(result.current_cost)],
        ["Inflation Rate", `${result.inflation_rate}%`],
        ["No of Years", `${result.no_years}`],
        ["Future Amount", formatCurrency(result.future_amount)],
      ];
    case "compounding-calculator":
      return [
        ["Principal Amount", formatCurrency(result.principal_amount)],
        ["Interest Rate", `${result.interest_rate}%`],
        ["Compound Interval", `${result.compound_interval}`],
        ["Period", `${result.period}`],
        ["Maturity Amount", formatCurrency(result.maturity_amount)],
      ];
    case "spending-less":
      return [
        ["Current Age (Years)", `${result.current_age}`],
        ["Retirement Age (Years)", `${result.retire_age}`],
        ["Savings Interest Rate", `${result.savings_interest_rate}%`],
        ["Income Tax Rate", `${result.income_tax_rate}%`],
        ["Inflation Rate", `${result.inflation_rate}%`],
        ["Savings Amount", formatCurrency(result.savings_amount)],
        ["Years", `${result.years} Years`],
        ["Savings Maturity Amount", formatCurrency(result.savings_maturity_amount)],
      ];
    case "children-education-planner": {
      const rows: [string, string][] = [];
      if (result.child1_name && result.child1_name !== "") {
        rows.push(
          [`${result.child1_name}'s Current Age`, `${result.child1_current_age} Years`],
          [`${result.child1_name}'s Education Age`, `${result.child1_education_age} Years`],
          [`${result.child1_name}'s Education Amount`, formatCurrency(result.child1_education_amount)],
          [`${result.child1_name}'s Inflation Adjusted Amount`, formatCurrency(result.child1_inflation_adjust_education_amount)],
          [`${result.child1_name}'s Savings Amount`, formatCurrency(result.child1_savings_amount)],
          [`${result.child1_name}'s Monthly Savings`, formatCurrency(result.child1_monthly_savings)]
        );
      }
      if (result.child2_name && result.child2_name !== "") {
        rows.push(
          [`${result.child2_name}'s Current Age`, `${result.child2_current_age} Years`],
          [`${result.child2_name}'s Education Age`, `${result.child2_education_age} Years`],
          [`${result.child2_name}'s Education Amount`, formatCurrency(result.child2_education_amount)],
          [`${result.child2_name}'s Inflation Adjusted Amount`, formatCurrency(result.child2_inflation_adjust_education_amount)],
          [`${result.child2_name}'s Savings Amount`, formatCurrency(result.child2_savings_amount)],
          [`${result.child2_name}'s Monthly Savings`, formatCurrency(result.child2_monthly_savings)]
        );
      }
      rows.push(
        ["Inflation Rate", `${result.inflation_rate}%`],
        ["Expected Return", `${result.expected_return}%`],
        ["Total Savings Amount", formatCurrency(result.total_savings_amount)],
        ["Total Monthly Savings", formatCurrency(result.total_monthly_savings)],
        ["Total Education Amount", formatCurrency(result.total_education_amount)],
        ["Total Inflation Adjusted Amount", formatCurrency(result.total_inflation_adjust_education_amount)]
      );
      return rows;
    }
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

// buildUiAwareValues now delegates to buildCalculatorPayload from useCalculator
// to ensure the API payload exactly matches FreeCalculators behavior.
import { buildCalculatorPayload } from "@/hooks/useCalculator";

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

        // Use buildCalculatorPayload directly so the API payload always matches FreeCalculators
        const payload = buildCalculatorPayload(calculator.tab, values);
        const { data } = await (await import("axios")).default.post(
          `/api/calc/${(await import("@/hooks/useCalculator")).CALCULATOR_ROUTE_MAP[calculator.tab]}`,
          payload,
        );
        const processedData = data;

        set({
          result: processedData,
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

