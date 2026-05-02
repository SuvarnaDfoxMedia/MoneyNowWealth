"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  CalculatorTab,
  requestCalculatorResult,
} from "@/hooks/useCalculator";

export type StartSipCalculatorId =
  | "sip-starter"
  | "step-up-sip"
  | "target-based-sip"
  | "crore-journey"
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
    id: "sip-starter",
    title: "SIP STARTER (CORE) - Calculator",
    tab: "SIP Calculator",
    isInteractive: true,
  },
  {
    id: "step-up-sip",
    title: "Step Up SIP - Calculator",
    tab: "SIP with Annual Increase",
    isInteractive: true,
  },
  {
    id: "target-based-sip",
    title: "TARGET-BASED SIP",
    tab: "Target Amount SIP Calculator",
    isInteractive: true,
  },
  {
    id: "crore-journey",
    title: "₹1 CRORE JOURNEY",
    tab: "Become A Crorepati Calculator",
    isInteractive: true,
  },
  {
    id: "sip-returns",
    title: "SIP RETURNS BY CATEGORY (inside Learn)",
    isInteractive: false,
  },
];

export const START_SIP_DEFAULT_VALUES = {
  sip_amount: 25000,
  lumpsum_amount: 500000,
  interest_rate: 12,
  expected_return: 12,
  years: 10,
  period: 120,
  inflation_rate: 6,
  dream_amount: 9754439,
  wealth_amount: 10000000,
  current_age: 30,
  retirement_age: 55,
  savings_amount: 0,
  sip_stepup_value: 10,
  loan_amount: 1000000,
  loan_tenure_type: "year",
  loan_tenure: 5,
  withdrawal_amount: 10000,
  lumpsum_period: 10,
  target_amount: 5000000,
  current_cost: 100000,
  no_years: 5,
  principal_amount: 2500000,
  compound_interval: "Yearly",
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
      result.total_earnings ||
      0,
  );
  const maturity = Number(
    result.maturity_amount ||
      result.stepup_maturity_amount ||
      result.target_wealth ||
      result.target_amount ||
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

export function buildStartSipResultRows(
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
  if (id === "sip-starter" || id === "step-up-sip") {
    return {
      ...values,
      interest_rate: values.expected_return || values.interest_rate,
      period: Math.max(12, Number(values.years || 1) * 12),
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
