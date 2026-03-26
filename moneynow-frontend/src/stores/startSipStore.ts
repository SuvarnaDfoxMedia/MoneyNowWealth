"use client";

import axios from "axios";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  buildCalculatorPayload,
  CALCULATOR_ROUTE_MAP,
  CalculatorTab,
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

interface StartSipStore {
  activeCalculatorId: StartSipCalculatorId;
  values: typeof START_SIP_DEFAULT_VALUES;
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
        const payload = buildCalculatorPayload(calculator.tab, uiValues);
        const { data } = await axios.post(
          `/api/calc/${CALCULATOR_ROUTE_MAP[calculator.tab]}`,
          payload,
        );

        if (!data) {
          throw new Error("No response received");
        }

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
