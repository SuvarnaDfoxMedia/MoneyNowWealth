// "use client";
// import React, { useState } from "react";

// interface CalculatorInputsProps {
//   activeTab: string;
//   values: any;
//   setValues: (key: string, value: number) => void;
// }

// export default function CalculatorInputs({ activeTab, values, setValues }: CalculatorInputsProps) {
//   const handleChange = (key: string, val: number) => setValues(key, val);
//  const [selectedOption, setSelectedOption] = useState("");

//   return (
//     <div className="bg-[#E6F2FE] p-6 rounded-lg mb-6 ">
//       <h3 className="text-[24px] font-semibold mb-4 font-poppins"> Calculate the future value of your SIP investment</h3>
//  <div className="flex gap-4 mb-5">
//       <label className="flex items-center space-x-2">
//         <input
//           type="radio"
//           name="investmentOption"
//           value="goal"
//           checked={selectedOption === "goal"}
//           onChange={() => setSelectedOption("goal")}
//           className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
//         />
//         <span className="text-[#6A6A6A] text-[16px]">I know my goal amount</span>
//       </label>

//       <label className="flex items-center space-x-2">
//         <input
//           type="radio"
//           name="investmentOption"
//           value="investment"
//           checked={selectedOption === "investment"}
//           onChange={() => setSelectedOption("investment")}
//           className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
//         />
//         <span className="text-[#6A6A6A] text-[16px]">I know investment amount</span>
//       </label>
//     </div>
 
//  <div className="grid md:grid-cols-3 gap-6">
//       {/* SIP Growth & Step-Up SIP */}
//       {(activeTab === "SIP Growth" || activeTab === "Step-Up SIP") && (
//         <EditableSlider
//           label="SIP Amount"
//           value={values.sip_amount}
//           min={1000}
//           max={100000}
//           step={500}
//           prefix="₹"
//           onChange={(v) => handleChange("sip_amount", v)}
//           editable
//         />
//       )}

//       {activeTab === "Step-Up SIP" && (
//         <EditableSlider
//           label="Step-Up %"
//           value={values.sip_stepup_value}
//           min={0}
//           max={50}
//           step={1}
//           suffix="%"
//           onChange={(v) => handleChange("sip_stepup_value", v)}
//           editable
//         />
//       )}

//       {/* Lumpsum */}
//       {activeTab === "Lumpsum" && (
//         <EditableSlider
//           label="Lumpsum Amount"
//           value={values.lumpsum_amount}
//           min={1000}
//           max={10000000}
//           step={1000}
//           prefix="₹"
//           onChange={(v) => handleChange("lumpsum_amount", v)}
//           editable
//         />
//       )}

//       {/* Goal Planner */}
//       {activeTab === "Goal Planner" && (
//         <>
//           <EditableSlider
//             label="Dream Amount"
//             value={values.dream_amount}
//             min={10000}
//             max={50000000}
//             step={1000}
//             prefix="₹"
//             onChange={(v) => handleChange("dream_amount", v)}
//             editable
//           />
//           <EditableSlider
//             label="Savings Amount"
//             value={values.savings_amount}
//             min={1000}
//             max={10000000}
//             step={1000}
//             prefix="₹"
//             onChange={(v) => handleChange("savings_amount", v)}
//             editable
//           />
//           <EditableSlider
//             label="Inflation Rate"
//             value={values.inflation_rate}
//             min={0}
//             max={20}
//             step={0.1}
//             suffix="%"
//             onChange={(v) => handleChange("inflation_rate", v)}
//             editable
            
//           />
//         </>
//       )}

//       {/* Retirement Planner */}
//       {activeTab === "Retirement Planner" && (
//         <>
//           <EditableSlider
//             label="Wealth Amount"
//             value={values.wealth_amount}
//             min={100000}
//             max={100000000}
//             step={10000}
//             prefix="₹"
//             onChange={(v) => handleChange("wealth_amount", v)}
//             editable
//           />
//           <EditableSlider
//             label="Savings Amount"
//             value={values.savings_amount}
//             min={1000}
//             max={10000000}
//             step={1000}
//             prefix="₹"
//             onChange={(v) => handleChange("savings_amount", v)}
//             editable
//           />
//           <EditableSlider
//             label="Current Age"
//             value={values.current_age}
//             min={18}
//             max={65}
//             step={1}
//             onChange={(v) => handleChange("current_age", v)}
//             editable
//           />
//           <EditableSlider
//             label="Retirement Age"
//             value={values.retirement_age}
//             min={40}
//             max={80}
//             step={1}
//             onChange={(v) => handleChange("retirement_age", v)}
//             editable
//           />
//           <EditableSlider
//             label="Inflation Rate"
//             value={values.inflation_rate}
//             min={0}
//             max={20}
//             step={0.1}
//             suffix="%"
//             onChange={(v) => handleChange("inflation_rate", v)}
//             editable
//           />
//         </>
//       )}

//       {/* Common Inputs */}
//       <EditableSlider
//         label="Years"
//         value={values.years}
//         min={1}
//         max={40}
//         suffix=" Years"
//         onChange={(v) => handleChange("years", v)}
//         editable
//       />
//       <EditableSlider
//         label="Expected Return"
//         value={values.expected_return}
//         min={1}
//         max={20}
//         step={0.1}
//         suffix="%"
//         onChange={(v) => handleChange("expected_return", v)}
//         editable
//       />
//     </div>

//     </div>
   
//   );
// }

// // ---------------- Editable Slider ----------------
// const EditableSlider = ({
//   label,
//   value,
//   min,
//   max,
//   step = 1,
//   prefix,
//   suffix,
//   onChange,
//   editable,
// }: any) => (
//   <div>
//     <div className="flex justify-between mb-2 text-sm">
//       <span>{label}</span>
//       {editable ? (
//         <input
//           type="number"
//           value={value}
//           min={min}
//           max={max}
//           step={step}
//           onChange={(e) => onChange(Number(e.target.value))}
//           className="w-24 border-b border-gray-400 bg-transparent text-right font-semibold focus:outline-none appearance-none"
//         />
//       ) : (
//         <span className="font-semibold">{prefix}{value}{suffix}</span>
//       )}
//     </div>
//     <input
//       type="range"
//       min={min}
//       max={max}
//       step={step}
//       value={value}
//       onChange={(e) => onChange(Number(e.target.value))}
//       className="w-full accent-[#043F79]"
//     />
//   </div>
// );


"use client";
import React, { useState } from "react";

interface CalculatorInputsProps {
  activeTab: string;
  values: any;
  setValues: (key: string, value: number) => void;
}

export default function CalculatorInputs({ activeTab, values, setValues }: CalculatorInputsProps) {
  const handleChange = (key: string, val: number) => setValues(key, val);
  const [selectedOption, setSelectedOption] = useState("");

  return (
    <div className="bg-[#E6F2FE] p-6 rounded-lg mb-6 ">
      <h3 className="text-[24px] font-semibold mb-4 font-poppins"> Calculate the future value of your SIP investment</h3>

      <div className="flex gap-4 mb-6">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="investmentOption"
            value="goal"
            checked={selectedOption === "goal"}
            onChange={() => setSelectedOption("goal")}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span className="text-[#6A6A6A] text-[16px]">I know my goal amount</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="investmentOption"
            value="investment"
            checked={selectedOption === "investment"}
            onChange={() => setSelectedOption("investment")}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span className="text-[#6A6A6A] text-[16px]">I know investment amount</span>
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* SIP Growth & Step-Up SIP */}
        {(activeTab === "SIP Growth" || activeTab === "Step-Up SIP") && (
          <EditableSlider
            label="SIP Amount"
            value={values.sip_amount}
            min={1000}
            max={100000}
            step={500}
            prefix="₹"
            onChange={(v) => handleChange("sip_amount", v)}
            editable
          />
        )}

        {activeTab === "Step-Up SIP" && (
          <EditableSlider
            label="Step-Up %"
            value={values.sip_stepup_value}
            min={0}
            max={50}
            step={1}
            suffix="%"
            onChange={(v) => handleChange("sip_stepup_value", v)}
            editable
          />
        )}

        {/* Lumpsum */}
        {activeTab === "Lumpsum" && (
          <EditableSlider
            label="Lumpsum Amount"
            value={values.lumpsum_amount}
            min={1000}
            max={10000000}
            step={1000}
            prefix="₹"
            onChange={(v) => handleChange("lumpsum_amount", v)}
            editable
          />
        )}

        {/* Goal Planner */}
        {activeTab === "Goal Planner" && (
          <>
            <EditableSlider
              label="Dream Amount"
              value={values.dream_amount}
              min={10000}
              max={50000000}
              step={1000}
              prefix="₹"
              onChange={(v) => handleChange("dream_amount", v)}
              editable
            />
            <EditableSlider
              label="Savings Amount"
              value={values.savings_amount}
              min={1000}
              max={10000000}
              step={1000}
              prefix="₹"
              onChange={(v) => handleChange("savings_amount", v)}
              editable
            />
            <EditableSlider
              label="Inflation Rate"
              value={values.inflation_rate}
              min={0}
              max={20}
              step={0.1}
              suffix="%"
              onChange={(v) => handleChange("inflation_rate", v)}
              editable
            />
          </>
        )}

        {/* Retirement Planner */}
        {activeTab === "Retirement Planner" && (
          <>
            <EditableSlider
              label="Wealth Amount"
              value={values.wealth_amount}
              min={100000}
              max={100000000}
              step={10000}
              prefix="₹"
              onChange={(v) => handleChange("wealth_amount", v)}
              editable
            />
            <EditableSlider
              label="Savings Amount"
              value={values.savings_amount}
              min={1000}
              max={10000000}
              step={1000}
              prefix="₹"
              onChange={(v) => handleChange("savings_amount", v)}
              editable
            />
            <EditableSlider
              label="Current Age"
              value={values.current_age}
              min={18}
              max={65}
              step={1}
              onChange={(v) => handleChange("current_age", v)}
              editable
            />
            <EditableSlider
              label="Retirement Age"
              value={values.retirement_age}
              min={40}
              max={80}
              step={1}
              onChange={(v) => handleChange("retirement_age", v)}
              editable
            />
            <EditableSlider
              label="Inflation Rate"
              value={values.inflation_rate}
              min={0}
              max={20}
              step={0.1}
              suffix="%"
              onChange={(v) => handleChange("inflation_rate", v)}
              editable
            />
          </>
        )}

        {/* Common Inputs */}
        <EditableSlider
          label="Years"
          value={values.years}
          min={1}
          max={40}
          suffix=" Years"
          onChange={(v) => handleChange("years", v)}
          editable
        />
        <EditableSlider
          label="Expected Return"
          value={values.expected_return}
          min={1}
          max={20}
          step={0.1}
          suffix="%"
          onChange={(v) => handleChange("expected_return", v)}
          editable
        />
      </div>
    </div>
  );
}

// ---------------- Editable Slider ----------------
const EditableSlider = ({
  label,
  value,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  onChange,
  editable,
}: any) => (
  <div>
    <div className="flex justify-between mb-2 text-[16px] text-[#6A6A6A]"> {/* <-- increased label size */}
      <span>{label}</span>
      {editable ? (
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 border-b border-gray-400 bg-transparent text-right font-semibold focus:outline-none appearance-none"
        />
      ) : (
        <span className="font-semibold">{prefix}{value}{suffix}</span>
      )}
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[#043F79]"
    />
  </div>
);
