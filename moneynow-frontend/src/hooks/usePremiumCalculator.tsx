import { useState, useCallback } from "react";
import axios from "axios";

/* ------------------ Premium Calculator Tabs ------------------ */
export type PremiumCalculatorTab =
  | "Advanced SIP"
  | "Advanced Step-Up SIP"
  | "Advanced Goal Planner"
  | "Advanced Retirement Planner";

/* ------------------ API Route Mapping ------------------ */
const PREMIUM_TAB_MAP: Record<PremiumCalculatorTab, string> = {
  "Advanced SIP": "sip-advanced",
  "Advanced Step-Up SIP": "stepup-advanced",
  "Advanced Goal Planner": "goal-advanced",
  "Advanced Retirement Planner": "retirement-advanced",
};

/* ------------------ Hook ------------------ */
export const usePremiumCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const calculatePremium = useCallback(
    async (tab: PremiumCalculatorTab, v: any) => {
      try {
        setLoading(true);
        setError(null);

        let payload: any = {};

        switch (tab) {
          case "Advanced SIP":
            payload = {
              sip_amount: v.sip_amount,
              interest_rate: v.expected_return,
              period: v.years * 12,
              inflation_rate: v.inflation_rate,
            };
            break;

          case "Advanced Step-Up SIP":
            payload = {
              sip_amount: v.sip_amount,
              interest_rate: v.expected_return,
              period: v.years * 12,
              sip_stepup_value: v.sip_stepup_value,
              inflation_rate: v.inflation_rate,
            };
            break;

          case "Advanced Goal Planner":
            payload = {
              dream_amount: v.dream_amount,
              years: v.years,
              inflation_rate: v.inflation_rate,
              expected_return: v.expected_return,
              savings_amount: v.savings_amount || 0,
            };
            break;

          case "Advanced Retirement Planner":
            payload = {
              current_age: v.current_age,
              retirement_age: v.retirement_age,
              wealth_amount: v.wealth_amount,
              inflation_rate: v.inflation_rate,
              expected_return: v.expected_return,
              savings_amount: v.savings_amount || 0,
            };
            break;
        }

        const token = localStorage.getItem("token"); // or from auth context

        const { data } = await axios.post(
          `/api/premium/calc/${PREMIUM_TAB_MAP[tab]}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (data?.result !== undefined) {
          setResult(data.result);
        } else if (data?.status === 200) {
          setResult(data);
        } else {
          setResult(null);
          setError(
            data?.msg ||
              data?.error ||
              "Premium calculation failed. Please try again."
          );
        }
      } catch (err: any) {
        console.error(
          "Premium Calculation Error:",
          err.response?.data || err.message
        );

        if (err.response?.status === 403) {
          setError("This calculator is available for premium users only.");
        } else if (err.response?.status === 401) {
          setError("Please login to access premium calculators.");
        } else {
          setError(
            err.response?.data?.msg ||
              err.response?.data?.error ||
              err.message ||
              "Network Error"
          );
        }

        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    calculatePremium,
    result,
    loading,
    error,
  };
};
