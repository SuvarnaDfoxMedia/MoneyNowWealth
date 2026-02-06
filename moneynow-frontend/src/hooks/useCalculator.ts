// // hooks/useCalculator.ts
// import { useState, useCallback } from "react";
// import axios from "axios";

// export type CalculatorTab =
//   | "SIP Growth"
//   | "Step-Up SIP"
//   | "Lumpsum"
//   | "Goal Planner"
//   | "Retirement Planner";

// // Map frontend tabs to API route params
// const TAB_MAP: Record<CalculatorTab, string> = {
//   "SIP Growth": "sip",
//   "Step-Up SIP": "stepup",
//   Lumpsum: "lumpsum",
//   "Goal Planner": "goal",
//   "Retirement Planner": "retirement",
// };

// export const useCalculator = () => {
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   const calculate = useCallback(async (tab: CalculatorTab, v: any) => {
//     try {
//       setLoading(true);
//       setError(null);

//       let payload: Record<string, any> = {};

//       // Prepare payload according to API requirements
//       switch (tab) {
//         case "SIP Growth":
//           payload = {
//             sip_amount: v.sip_amount,
//             interest_rate: v.expected_return,
//             period: v.years * 12,
//           };
//           break;

//         case "Step-Up SIP":
//           payload = {
//             sip_amount: v.sip_amount,
//             interest_rate: v.expected_return,
//             period: v.years * 12,
//             sip_stepup_value: v.sip_stepup_value || 0,
//           };
//           break;

//         case "Lumpsum":
//           payload = {
//             lumpsum_amount: v.lumpsum_amount,
//             years: v.years,
//             expected_return: v.expected_return,
//           };
//           break;

//         case "Goal Planner":
//           payload = {
//             dream_amount: v.dream_amount,
//             years: v.years,
//             inflation_rate: v.inflation_rate,
//             expected_return: v.expected_return,
//             savings_amount: v.savings_amount || 0,
//           };
//           break;

//         case "Retirement Planner":
//           payload = {
//             current_age: v.current_age || 30,
//             retirement_age: v.retirement_age,
//             wealth_amount: v.wealth_amount,
//             inflation_rate: v.inflation_rate,
//             expected_return: v.expected_return,
//             savings_amount: v.savings_amount || 0,
//           };
//           break;
//       }

//       // Call backend API route
//       const { data } = await axios.post(`/api/calc/${TAB_MAP[tab]}`, payload);

//       if (!data || Object.keys(data).length === 0) {
//         throw new Error("Calculation failed: empty response");
//       }

//       // Normalize response for consistent frontend use
//       let normalized: any = { ...data };

//       switch (tab) {
//         case "SIP Growth":
//           normalized = {
//             ...data,
//             invested_amount:
//               data.total_invested ?? data.sip_amount * data.period ?? 0,
//             returns: data.growth_value ?? 0,
//             future_amount: data.maturity_amount ?? 0,
//           };
//           break;

//         case "Step-Up SIP":
//           normalized = {
//             ...data,
//             invested_amount:
//               data.stepup_invested_amount ?? data.invested_amount ?? 0,
//             returns: data.stepup_growth_value ?? data.growth_value ?? 0,
//             future_amount:
//               data.stepup_maturity_amount ?? data.maturity_amount ?? 0,
//           };
//           break;

//         case "Lumpsum":
//           normalized = {
//             ...data,
//             invested_amount: data.lumpsum_amount ?? 0,
//             returns: data.total_earnings ?? 0,
//             future_amount: data.future_amount ?? 0,
//           };
//           break;

//         case "Goal Planner":
//           normalized = {
//             ...data,
//             invested_amount: data.savings_amount ?? 0,
//             returns: data.total_earnings ?? 0,
//             future_amount: data.target_amount ?? 0,
//           };
//           break;

//         case "Retirement Planner":
//           normalized = {
//             ...data,
//             invested_amount: data.savings_amount ?? 0,
//             returns: data.total_earnings ?? 0,
//             future_amount: data.target_amount ?? 0,
//           };
//           break;
//       }

//       setResult(normalized);
//     } catch (err: any) {
//       console.error(
//         "Calculation error:",
//         err?.response?.data || err.message || err,
//       );
//       setError(err?.response?.data?.msg || err.message || "Network Error");
//       setResult(null);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return { calculate, result, loading, error };
// };

// import { useState, useCallback } from "react";
// import axios from "axios";

// export type CalculatorTab =
//   | "Lumpsum"
//   | "SIP Calculator"
//   | "Goal Setting Calculator"
//   | "SIP with Annual Increase"
//   | "Target Amount SIP Calculator"
//   | "Lumpsum Target Calculator"
//   | "Become A Crorepati Calculator"
//   | "Retirement Planning Calculator"
//   | "Car Loan Calculator"
//   | "Home Loan Calculator"
//   | "SWP Calculator"
//   | "Personal Loan EMI Calculator"
//   | "Education Loan EMI Calculator"
//   | "Future Value Calculator"
//   | "Compounding Calculator"
//   | "Children Education Planner"
//   | "Spending Less Calculator";

// // Map frontend tabs to API route params
// const TAB_MAP: Record<CalculatorTab, string> = {
//   Lumpsum: "lumpsum",
//   "SIP Calculator": "sip",
//   "Goal Setting Calculator": "goal",
//   "SIP with Annual Increase": "stepup",
//   "Target Amount SIP Calculator": "targetSip",
//   "Lumpsum Target Calculator": "targetLumpsum",
//   "Become A Crorepati Calculator": "crorepati",
//   "Retirement Planning Calculator": "retirement",
//   "Car Loan Calculator": "carLoan",
//   "Home Loan Calculator": "homeLoan",
//   "SWP Calculator": "swp",
//   "Personal Loan EMI Calculator": "personalLoan",
//   "Education Loan EMI Calculator": "educationLoan",
//   "Future Value Calculator": "futureValue",
//   "Compounding Calculator": "compounding",
//   "Children Education Planner": "childrenEducation",
//   "Spending Less Calculator": "spendingLess",
// };

// export const useCalculator = () => {
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   const calculate = useCallback(async (tab: CalculatorTab, v: any) => {
//     try {
//       setLoading(true);
//       setError(null);

//       let payload: Record<string, any> = {};

//       // Prepare payload according to API requirements EXACTLY as per docs
//       switch (tab) {
//         // 1. Lumpsum Calculator
//         case "Lumpsum":
//           payload = {
//             lumpsum_amount: v.lumpsum_amount,
//             years: v.years,
//             expected_return: v.expected_return,
//           };
//           break;

//         // 2. SIP Calculator
//         case "SIP Calculator":
//           payload = {
//             sip_amount: v.sip_amount,
//             interest_rate: v.interest_rate,
//             period: v.period,
//           };
//           break;

//         // 3. Goal Setting Calculator
//         case "Goal Setting Calculator":
//           payload = {
//             years: v.years,
//             dream_amount: v.dream_amount,
//             inflation_rate: v.inflation_rate,
//             expected_return: v.expected_return,
//             savings_amount: v.savings_amount || 0,
//           };
//           break;

//         // 4. SIP with Annual Increase calculator
//         case "SIP with Annual Increase":
//           payload = {
//             sip_amount: v.sip_amount,
//             interest_rate: v.interest_rate,
//             period: v.period,
//             sip_stepup_value: v.sip_stepup_value || 0,
//           };
//           break;

//         // 5. Target Amount SIP Calculator
//         case "Target Amount SIP Calculator":
//           payload = {
//             wealth_amount: v.wealth_amount,
//             inflation_rate: v.inflation_rate,
//             expected_return: v.expected_return,
//             period: v.period,
//           };
//           break;

//         // 6. Target Amount Lumpsum Calculator
//         case "Lumpsum Target Calculator":
//           payload = {
//             target_amount: v.target_amount,
//             expected_return: v.expected_return,
//             years: v.years,
//           };
//           break;

//         // 7. Become A Crorepati Calculator
//         case "Become A Crorepati Calculator":
//           payload = {
//             current_age: v.current_age,
//             retirement_age: v.retirement_age,
//             wealth_amount: v.wealth_amount,
//             inflation_rate: v.inflation_rate,
//             expected_return: v.expected_return,
//             savings_amount: v.savings_amount || 0,
//           };
//           break;

//         // 8. Retirement Planning Calculator
//         case "Retirement Planning Calculator":
//           payload = {
//             current_age: v.current_age,
//             retirement_age: v.retirement_age,
//             wealth_amount: v.wealth_amount,
//             inflation_rate: v.inflation_rate,
//             expected_return: v.expected_return,
//             savings_amount: v.savings_amount || 0,
//           };
//           break;

//         // 9. Car Loan Calculator
//         case "Car Loan Calculator":
//           payload = {
//             loan_amount: v.loan_amount,
//             interest_rate: v.interest_rate,
//             loan_tenure_type: "year",
//             loan_tenure: v.loan_tenure,
//           };
//           break;

//         // 10. Home Loan Calculator
//         case "Home Loan Calculator":
//           payload = {
//             loan_amount: v.loan_amount,
//             interest_rate: v.interest_rate,
//             loan_tenure_type: "year",
//             loan_tenure: v.loan_tenure,
//           };
//           break;

//         // 11. SWP Calculator
//         case "SWP Calculator":
//           payload = {
//             lumpsum_amount: v.lumpsum_amount,
//             withdrawal_amount: v.withdrawal_amount,
//             interest_rate: v.interest_rate,
//             lumpsum_period: v.lumpsum_period || 0,
//             period: v.period || 5,
//           };
//           break;

//         // 12. Personal Loan Calculator
//         case "Personal Loan EMI Calculator":
//           payload = {
//             loan_amount: v.loan_amount,
//             interest_rate: v.interest_rate,
//             loan_tenure_type: "year",
//             loan_tenure: v.loan_tenure,
//           };
//           break;

//         // 13. Education Loan Calculator
//         case "Education Loan EMI Calculator":
//           payload = {
//             loan_amount: v.loan_amount,
//             interest_rate: v.interest_rate,
//             loan_tenure_type: "year",
//             loan_tenure: v.loan_tenure,
//           };
//           break;

//         // 14. Future Value Calculator
//         case "Future Value Calculator":
//           payload = {
//             current_cost: v.current_cost,
//             inflation_rate: v.inflation_rate,
//             no_years: v.no_years || v.years,
//           };
//           break;

//         // 15. Compounding Calculator
//         case "Compounding Calculator":
//           payload = {
//             principal_amount: v.principal_amount,
//             interest_rate: v.interest_rate,
//             compound_interval: v.compound_interval || "Yearly",
//             period: v.period || v.years,
//           };
//           break;

//         // 16. Children Education Planner
//         case "Children Education Planner":
//           // Handle dynamic children
//           const childrenData: any = {};
//           if (v.children && v.children.length > 0) {
//             v.children.forEach((child: any, index: number) => {
//               const num = index + 1;
//               childrenData[`child${num}_name`] = child.name || `Child ${num}`;
//               childrenData[`child${num}_current_age`] = child.currentAge;
//               childrenData[`child${num}_education_age`] = child.educationAge;
//               childrenData[`child${num}_education_amount`] =
//                 child.educationAmount;
//             });
//           }

//           payload = {
//             ...childrenData,
//             inflation_rate: v.inflation_rate,
//             expected_return: v.expected_return,
//             savings_amount: v.savings_amount || 0,
//           };
//           break;

//         // 17. Spending Less Calculator
//         case "Spending Less Calculator":
//           payload = {
//             current_age: v.current_age,
//             retire_age: v.retire_age,
//             savings_interest_rate: v.savings_interest_rate,
//             income_tax_rate: v.income_tax_rate,
//             inflation_rate: v.inflation_rate,
//             house_flat_value: v.house_flat_value,
//             home_loan_emi_value: v.home_loan_emi_value,
//             new_car_value: v.new_car_value,
//             eating_out_value: v.eating_out_value,
//             lifestyle_spending_value: v.lifestyle_spending_value,
//             holidays_value: v.holidays_value,
//             transport_value: v.transport_value,
//             credit_card_interest_value: v.credit_card_interest_value,
//             personal_loan_value: v.personal_loan_value,
//             shopping_value: v.shopping_value,
//           };
//           break;
//       }

//       console.log("Sending payload:", { tab, payload });

//       // Call backend API route
//       const { data } = await axios.post(`/api/calc/${TAB_MAP[tab]}`, payload);

//       if (!data || data.status !== 200) {
//         throw new Error(data?.msg || "Calculation failed");
//       }

//       // Set raw result
//       setResult(data);
//     } catch (err: any) {
//       console.error(
//         "Calculation error:",
//         err?.response?.data || err.message || err,
//       );
//       setError(err?.response?.data?.msg || err.message || "Network Error");
//       setResult(null);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return { calculate, result, loading, error };
// };

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
const TAB_MAP: Record<CalculatorTab, string> = {
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

export const useCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (tab: CalculatorTab, v: any) => {
    try {
      setLoading(true);
      setError(null);

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
          const childrenData: any = {};
          if (v.children && v.children.length > 0) {
            v.children.forEach((child: any, index: number) => {
              const num = index + 1;
              childrenData[`child${num}_name`] = child.name || `Child ${num}`;
              childrenData[`child${num}_current_age`] = child.currentAge;
              childrenData[`child${num}_education_age`] = child.educationAge;
              childrenData[`child${num}_education_amount`] =
                child.educationAmount;
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

      console.log("Sending payload:", { tab, payload });

      const { data } = await axios.post(`/api/calc/${TAB_MAP[tab]}`, payload);

      // Some AdvisorKhoj APIs return status/msg, some return direct data
      if (!data) {
        throw new Error("No response received");
      }

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
