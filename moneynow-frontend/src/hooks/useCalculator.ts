// // src/hooks/useCalculator.ts
// import { useState } from "react";
// import axios from "axios";

// export type CalculatorTab =
//   | "SIP Growth"
//   | "Step-Up SIP"
//   | "Lumpsum"
//   | "Goal Planner"
//   | "Retirement Planner";

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

//   const calculate = async (tab: CalculatorTab, v: any) => {
//     try {
//       setLoading(true);

//       let payload: any = {};

//       switch (tab) {
//         case "SIP Growth":
//           payload = {
//             sip_amount: v.sip_amount,
//             interest_rate: v.expected_return,
//             period: v.years * 12, // months
//           };
//           break;

//         case "Step-Up SIP":
//           payload = {
//             sip_amount: v.sip_amount,
//             interest_rate: v.expected_return,
//             period: v.years * 12,
//             sip_stepup_value: v.sip_stepup_value,
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

//       const { data } = await axios.post(`/api/calc/${TAB_MAP[tab]}`, payload);

//       if (data.status === 200) {
//         // Map API `list` to `data` for nested table rendering
//         if (tab === "Step-Up SIP" || tab === "SIP Growth") {
//           data.data = data.list || [];
//         }
//         setResult(data);
//       } else {
//         setResult(null);
//       }
//     } catch (err) {
//       console.error("Calculation error:", err);
//       setResult(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { calculate, result, loading };
// };



// // src/hooks/useCalculator.ts
// import { useState, useCallback } from "react";
// import axios from "axios";

// export type CalculatorTab =
//   | "SIP Growth"
//   | "Step-Up SIP"
//   | "Lumpsum"
//   | "Goal Planner"
//   | "Retirement Planner";

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

//   // Wrap calculate in useCallback to keep reference stable
//   const calculate = useCallback(
//     async (tab: CalculatorTab, v: any) => {
//       try {
//         setLoading(true);

//         let payload: any = {};

//         switch (tab) {
//           case "SIP Growth":
//             payload = {
//               sip_amount: v.sip_amount,
//               interest_rate: v.expected_return,
//               period: v.years * 12,
//             };
//             break;

//           case "Step-Up SIP":
//             payload = {
//               sip_amount: v.sip_amount,
//               interest_rate: v.expected_return,
//               period: v.years * 12,
//               sip_stepup_value: v.sip_stepup_value,
//             };
//             break;

//           case "Lumpsum":
//             payload = {
//               lumpsum_amount: v.lumpsum_amount,
//               years: v.years,
//               expected_return: v.expected_return,
//             };
//             break;

//           case "Goal Planner":
//             payload = {
//               dream_amount: v.dream_amount,
//               years: v.years,
//               inflation_rate: v.inflation_rate,
//               expected_return: v.expected_return,
//               savings_amount: v.savings_amount || 0,
//             };
//             break;

//           case "Retirement Planner":
//             payload = {
//               current_age: v.current_age || 30,
//               retirement_age: v.retirement_age,
//               wealth_amount: v.wealth_amount,
//               inflation_rate: v.inflation_rate,
//               expected_return: v.expected_return,
//               savings_amount: v.savings_amount || 0,
//             };
//             break;
//         }

//         const { data } = await axios.post(`/api/calc/${TAB_MAP[tab]}`, payload);

//         if (data.status === 200) {
//           // Map `list` to `data` for Step-Up SIP / SIP Growth table rendering
//           if (tab === "Step-Up SIP" || tab === "SIP Growth") {
//             data.list = data.list || [];
//           }
//           setResult(data);
//         } else {
//           setResult(null);
//         }
//       } catch (err) {
//         console.error("Calculation error:", err);
//         setResult(null);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [] // dependencies empty because axios & TAB_MAP are stable
//   );

//   return { calculate, result, loading };
// };



import { useState, useCallback } from "react";
import axios from "axios";

export type CalculatorTab =
  | "SIP Growth"
  | "Step-Up SIP"
  | "Lumpsum"
  | "Goal Planner"
  | "Retirement Planner";

const TAB_MAP: Record<CalculatorTab, string> = {
  "SIP Growth": "sip",
  "Step-Up SIP": "stepup",
  Lumpsum: "lumpsum",
  "Goal Planner": "goal",
  "Retirement Planner": "retirement",
};

export const useCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (tab: CalculatorTab, v: any) => {
    try {
      setLoading(true);
      setError(null);

      let payload: any = {};

      switch (tab) {
        case "SIP Growth":
          payload = {
            sip_amount: v.sip_amount,
            interest_rate: v.expected_return,
            period: v.years * 12,
          };
          break;

        case "Step-Up SIP":
          payload = {
            sip_amount: v.sip_amount,
            interest_rate: v.expected_return,
            period: v.years * 12,
            sip_stepup_value: v.sip_stepup_value,
          };
          break;

        case "Lumpsum":
          payload = {
            lumpsum_amount: v.lumpsum_amount,
            years: v.years,
            expected_return: v.expected_return,
          };
          break;

        case "Goal Planner":
          payload = {
            dream_amount: v.dream_amount,
            years: v.years,
            inflation_rate: v.inflation_rate,
            expected_return: v.expected_return,
            savings_amount: v.savings_amount || 0,
          };
          break;

        case "Retirement Planner":
          payload = {
            current_age: v.current_age || 30,
            retirement_age: v.retirement_age,
            wealth_amount: v.wealth_amount,
            inflation_rate: v.inflation_rate,
            expected_return: v.expected_return,
            savings_amount: v.savings_amount || 0,
          };
          break;
      }

      const { data } = await axios.post(
        `/api/calc/${TAB_MAP[tab]}`,
        payload
      );

      if (data?.status === 200) {
        setResult(data);
      } else {
        throw new Error(data?.msg || "Calculation failed");
      }
    } catch (err: any) {
      console.error("Calculation error:", err);
      setError(err.message || "Network Error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { calculate, result, loading, error };
};
