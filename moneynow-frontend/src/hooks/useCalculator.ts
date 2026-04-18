import { useState, useCallback } from "react";
import axios from "axios";

export type CalculatorTab =
  | "Lumpsum"
  | "SIP Calculator"
  | "Goal Setting Calculator"
  | "SIP with Annual Increase"
  | "Target Amount SIP Calculator"
  | "Lumpsum Target Calculator"
  | "Become A Crorepati Calculator"
  | "Retirement Planning Calculator"
  | "Car Loan Calculator"
  | "Home Loan Calculator"
  | "SWP Calculator"
  | "Personal Loan EMI Calculator"
  | "Education Loan EMI Calculator"
  | "Future Value Calculator"
  | "Compounding Calculator"
  | "Children Education Planner"
  | "Spending Less Calculator";

// Map frontend tabs to API route params
export const CALCULATOR_ROUTE_MAP: Record<CalculatorTab, string> = {
  Lumpsum: "lumpsum",
  "SIP Calculator": "sip",
  "Goal Setting Calculator": "goal",
  "SIP with Annual Increase": "stepup",
  "Target Amount SIP Calculator": "targetSip",
  "Lumpsum Target Calculator": "targetLumpsum",
  "Become A Crorepati Calculator": "crorepati",
  "Retirement Planning Calculator": "retirement",
  "Car Loan Calculator": "carLoan",
  "Home Loan Calculator": "homeLoan",
  "SWP Calculator": "swp",
  "Personal Loan EMI Calculator": "personalLoan",
  "Education Loan EMI Calculator": "educationLoan",
  "Future Value Calculator": "futureValue",
  "Compounding Calculator": "compounding",
  "Children Education Planner": "childrenEducation",
  "Spending Less Calculator": "spendingLess",
};

export const buildCalculatorPayload = (tab: CalculatorTab, v: any) => {
  let payload: Record<string, any> = {};

  switch (tab) {
    case "Lumpsum":
      payload = {
        lumpsum_amount: v.lumpsum_amount,
        years: v.years,
        expected_return: v.expected_return,
      };
      break;

    case "SIP Calculator":
      payload = {
        sip_amount: v.sip_amount,
        interest_rate: v.interest_rate,
        period: v.period,
      };
      break;

    case "Goal Setting Calculator":
      payload = {
        years: v.years,
        dream_amount: v.dream_amount,
        inflation_rate: v.inflation_rate,
        expected_return: v.expected_return,
        savings_amount: v.savings_amount || 0,
      };
      break;

    case "SIP with Annual Increase":
      payload = {
        sip_amount: v.sip_amount,
        interest_rate: v.interest_rate,
        period: v.period,
        sip_stepup_value: v.sip_stepup_value || 0,
      };
      break;

    case "Target Amount SIP Calculator":
      payload = {
        wealth_amount: v.wealth_amount,
        inflation_rate: v.inflation_rate,
        expected_return: v.expected_return,
        period: v.period,
      };
      break;

    case "Lumpsum Target Calculator":
      payload = {
        target_amount: v.target_amount,
        expected_return: v.expected_return,
        years: v.years,
      };
      break;

    case "Become A Crorepati Calculator":
    case "Retirement Planning Calculator":
      payload = {
        current_age: v.current_age,
        retirement_age: v.retirement_age,
        wealth_amount: v.wealth_amount,
        inflation_rate: v.inflation_rate,
        expected_return: v.expected_return,
        savings_amount: v.savings_amount || 0,
      };
      break;

    case "Car Loan Calculator":
    case "Home Loan Calculator":
    case "Personal Loan EMI Calculator":
    case "Education Loan EMI Calculator":
      payload = {
        loan_amount: v.loan_amount,
        interest_rate: v.interest_rate,
        loan_tenure_type: "year",
        loan_tenure: v.loan_tenure,
      };
      break;

    case "SWP Calculator":
      payload = {
        lumpsum_amount: v.lumpsum_amount,
        withdrawal_amount: v.withdrawal_amount,
        interest_rate: v.interest_rate,
        lumpsum_period: v.lumpsum_period || 0,
        period: v.period || 5,
      };
      break;

    case "Future Value Calculator":
      payload = {
        current_cost: v.current_cost,
        inflation_rate: v.inflation_rate,
        no_years: v.no_years || v.years,
      };
      break;

    case "Compounding Calculator":
      payload = {
        principal_amount: v.principal_amount,
        interest_rate: v.interest_rate,
        compound_interval: v.compound_interval || "Yearly",
        period: v.period || v.years,
      };
      break;

    case "Children Education Planner": {
      const childrenData: Record<string, any> = {};
      if (v.children && v.children.length > 0) {
        v.children.forEach((child: any, index: number) => {
          const num = index + 1;
          childrenData[`child${num}_name`] = child.name || `Child ${num}`;
          childrenData[`child${num}_current_age`] = child.currentAge;
          childrenData[`child${num}_education_age`] = child.educationAge;
          childrenData[`child${num}_education_amount`] = child.educationAmount;
        });
      }

      payload = {
        ...childrenData,
        inflation_rate: v.inflation_rate,
        expected_return: v.expected_return,
        savings_amount: v.savings_amount || 0,
      };
      break;
    }

    case "Spending Less Calculator":
      payload = {
        current_age: v.current_age,
        retire_age: v.retire_age,
        savings_interest_rate: v.savings_interest_rate,
        income_tax_rate: v.income_tax_rate,
        inflation_rate: v.inflation_rate,
        house_flat_value: v.house_flat_value,
        home_loan_emi_value: v.home_loan_emi_value,
        new_car_value: v.new_car_value,
        eating_out_value: v.eating_out_value,
        lifestyle_spending_value: v.lifestyle_spending_value,
        holidays_value: v.holidays_value,
        transport_value: v.transport_value,
        credit_card_interest_value: v.credit_card_interest_value,
        personal_loan_value: v.personal_loan_value,
        shopping_value: v.shopping_value,
      };
      break;
  }

  return payload;
};

export async function requestCalculatorResult(tab: CalculatorTab, values: any) {
  const payload = buildCalculatorPayload(tab, values);
  const { data } = await axios.post(
    `/api/calc/${CALCULATOR_ROUTE_MAP[tab]}`,
    payload,
  );

  if (!data) {
    throw new Error("No response received");
  }

  return data;
}

export const useCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (tab: CalculatorTab, v: any) => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestCalculatorResult(tab, v);
      setResult(data);
    } catch (err: any) {
      console.error(
        "Calculation error:",
        err?.response?.data || err.message || err,
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          err.message ||
          "Network Error",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { calculate, result, loading, error };
};
