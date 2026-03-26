

"use client";
import React from "react";

interface Props {
  activeTab?: string;
  values: any;
  setValues: (key: string, value: any) => void;
}

export default function CalculatorInputs({
  activeTab = "",
  values,
  setValues,
}: Props) {
  const tab = activeTab || "";

  const v = {
    ...values,
  };

  const set = (k: string) => (val: any) => setValues(k, val);

  // Handle children education inputs
  const addChild = () => {
    const newChildren = [
      ...(v.children || []),
      {
        name: `Child ${(v.children || []).length + 1}`,
        currentAge: 0,
        educationAge: 0,
        educationAmount: 0,
      },
    ];
    setValues("children", newChildren);
  };

  const removeChild = (index: number) => {
    const newChildren = [...(v.children || [])];
    newChildren.splice(index, 1);
    setValues("children", newChildren);
  };

  const updateChild = (index: number, field: string, value: any) => {
    const newChildren = [...(v.children || [])];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setValues("children", newChildren);
  };

  return (
    <div className="bg-[#E6F2FE] p-4 sm:p-6 rounded-lg mb-6 overflow-hidden min-w-0">
      <div className="grid md:grid-cols-3 gap-6 min-w-0">
        {/* 1. Lumpsum Calculator */}
        {tab === "Lumpsum" && (
          <>
            <Slider
              label="Lumpsum Amount"
              value={v.lumpsum_amount}
              min={10000}
              max={50000000}
              step={10000}
              prefix="₹"
              onChange={set("lumpsum_amount")}
            />
            <Slider
              label="Expected Return"
              value={v.expected_return}
              min={1}
              max={20}
              step={0.1}
              suffix="%"
              onChange={set("expected_return")}
            />
            <Slider
              label="Years"
              value={v.years}
              min={1}
              max={40}
              suffix=" Y"
              onChange={set("years")}
            />
          </>
        )}

        {/* 2. SIP Calculator */}
        {tab === "SIP Calculator" && (
          <>
            <Slider
              label="Monthly SIP"
              value={v.sip_amount}
              min={1000}
              max={200000}
              step={500}
              prefix="₹"
              onChange={set("sip_amount")}
            />
            <Slider
              label="Interest Rate"
              value={v.interest_rate}
              min={1}
              max={20}
              step={0.1}
              suffix="%"
              onChange={set("interest_rate")}
            />
            <Slider
              label="Period (Months)"
              value={v.period}
              min={12}
              max={600}
              step={12}
              suffix=" M"
              onChange={set("period")}
            />
          </>
        )}

        {/* 3. Goal Setting Calculator */}
        {tab === "Goal Setting Calculator" && (
          <>
            <Slider
              label="Dream Amount"
              value={v.dream_amount}
              min={100000}
              max={100000000}
              prefix="₹"
              onChange={set("dream_amount")}
            />
            <Slider
              label="Years"
              value={v.years}
              min={1}
              max={40}
              onChange={set("years")}
            />
            <Slider
              label="Inflation Rate"
              value={v.inflation_rate}
              min={1}
              max={15}
              suffix="%"
              onChange={set("inflation_rate")}
            />
            <Slider
              label="Expected Return"
              value={v.expected_return}
              min={1}
              max={20}
              suffix="%"
              onChange={set("expected_return")}
            />
            <Slider
              label="Current Savings"
              value={v.savings_amount}
              min={0}
              max={10000000}
              prefix="₹"
              onChange={set("savings_amount")}
            />
          </>
        )}

        {/* 4. SIP with Annual Increase */}
        {tab === "SIP with Annual Increase" && (
          <>
            <Slider
              label="Monthly SIP"
              value={v.sip_amount}
              min={1000}
              max={200000}
              step={500}
              prefix="₹"
              onChange={set("sip_amount")}
            />
            <Slider
              label="Interest Rate"
              value={v.interest_rate}
              min={1}
              max={20}
              step={0.1}
              suffix="%"
              onChange={set("interest_rate")}
            />
            <Slider
              label="Period (Months)"
              value={v.period}
              min={12}
              max={600}
              step={12}
              suffix=" M"
              onChange={set("period")}
            />
            <Slider
              label="Annual Step-Up"
              value={v.sip_stepup_value}
              min={0}
              max={50}
              suffix="%"
              onChange={set("sip_stepup_value")}
            />
          </>
        )}

        {/* 5. Target Amount SIP */}
        {tab === "Target Amount SIP Calculator" && (
          <>
            <Slider
              label="Target Amount"
              value={v.wealth_amount}
              min={100000}
              max={50000000}
              prefix="₹"
              onChange={set("wealth_amount")}
            />
            <Slider
              label="Inflation Rate"
              value={v.inflation_rate}
              min={1}
              max={15}
              suffix="%"
              onChange={set("inflation_rate")}
            />
            <Slider
              label="Expected Return"
              value={v.expected_return}
              min={1}
              max={20}
              suffix="%"
              onChange={set("expected_return")}
            />
            <Slider
              label="Period (Years)"
              value={v.period}
              min={1}
              max={40}
              onChange={set("period")}
            />
          </>
        )}

        {/* 6. Lumpsum Target */}
        {tab === "Lumpsum Target Calculator" && (
          <>
            <Slider
              label="Target Amount"
              value={v.target_amount}
              min={100000}
              max={50000000}
              prefix="₹"
              onChange={set("target_amount")}
            />
            <Slider
              label="Expected Return"
              value={v.expected_return}
              min={1}
              max={20}
              suffix="%"
              onChange={set("expected_return")}
            />
            <Slider
              label="Years"
              value={v.years}
              min={1}
              max={40}
              onChange={set("years")}
            />
          </>
        )}

        {/* 7. Become A Crorepati / 8. Retirement Planning */}
        {(tab === "Become A Crorepati Calculator" ||
          tab === "Retirement Planning Calculator") && (
          <>
            <Slider
              label="Current Age"
              value={v.current_age}
              min={18}
              max={60}
              onChange={set("current_age")}
            />
            <Slider
              label="Retirement Age"
              value={v.retirement_age}
              min={40}
              max={75}
              onChange={set("retirement_age")}
            />
            <Slider
              label="Desired Wealth"
              value={v.wealth_amount}
              min={1000000}
              max={500000000}
              prefix="₹"
              onChange={set("wealth_amount")}
            />
            <Slider
              label="Inflation Rate"
              value={v.inflation_rate}
              min={1}
              max={15}
              suffix="%"
              onChange={set("inflation_rate")}
            />
            <Slider
              label="Expected Return"
              value={v.expected_return}
              min={1}
              max={20}
              suffix="%"
              onChange={set("expected_return")}
            />
            <Slider
              label="Current Savings"
              value={v.savings_amount}
              min={0}
              max={100000000}
              prefix="₹"
              onChange={set("savings_amount")}
            />
          </>
        )}

        {/* 9. Car Loan / 10. Home Loan / 12. Personal Loan / 13. Education Loan */}
        {(tab === "Car Loan Calculator" ||
          tab === "Home Loan Calculator" ||
          tab === "Personal Loan EMI Calculator" ||
          tab === "Education Loan EMI Calculator") && (
          <>
            <Slider
              label="Loan Amount"
              value={v.loan_amount}
              min={50000}
              max={50000000}
              prefix="₹"
              onChange={set("loan_amount")}
            />
            <Slider
              label="Interest Rate"
              value={v.interest_rate}
              min={5}
              max={20}
              suffix="%"
              onChange={set("interest_rate")}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Tenure Type</label>
              <select
                value={v.loan_tenure_type || "year"}
                onChange={(e) => set("loan_tenure_type")(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="year">Year</option>
                <option value="months">Months</option>
              </select>
            </div>

            <Slider
              label="Tenure"
              value={v.loan_tenure}
              min={1}
              max={30}
              onChange={set("loan_tenure")}
            />
          </>
        )}

        {/* 11. SWP Calculator */}
        {tab === "SWP Calculator" && (
          <>
            <Slider
              label="Lumpsum Invested"
              value={v.lumpsum_amount}
              min={100000}
              max={50000000}
              prefix="₹"
              onChange={set("lumpsum_amount")}
            />
            <Slider
              label="Monthly Withdrawal"
              value={v.withdrawal_amount}
              min={1000}
              max={100000}
              prefix="₹"
              onChange={set("withdrawal_amount")}
            />
            <Slider
              label="Expected Return"
              value={v.interest_rate}
              min={1}
              max={20}
              suffix="%"
              onChange={set("interest_rate")}
            />
            <Slider
              label="Start After (Years)"
              value={v.lumpsum_period}
              min={0}
              max={40}
              onChange={set("lumpsum_period")}
            />

            <Slider
              label="SWP Duration (Years)"
              value={v.period}
              min={1}
              max={40}
              onChange={set("period")}
            />
          </>
        )}

        {/* 14. Future Value Calculator */}
        {tab === "Future Value Calculator" && (
          <>
            <Slider
              label="Current Cost"
              value={v.current_cost}
              min={10000}
              max={10000000}
              prefix="₹"
              onChange={set("current_cost")}
            />
            <Slider
              label="Inflation Rate"
              value={v.inflation_rate}
              min={1}
              max={15}
              suffix="%"
              onChange={set("inflation_rate")}
            />
            <Slider
              label="Number of Years"
              value={v.no_years}
              min={1}
              max={50}
              onChange={set("no_years")}
            />
          </>
        )}

        {/* 15. Compounding Calculator */}
        {tab === "Compounding Calculator" && (
          <>
            <Slider
              label="Principal Amount"
              value={v.principal_amount}
              min={10000}
              max={10000000}
              prefix="₹"
              onChange={set("principal_amount")}
            />
            <Slider
              label="Interest Rate"
              value={v.interest_rate}
              min={1}
              max={20}
              suffix="%"
              onChange={set("interest_rate")}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Compound Interval</label>
              <select
                value={v.compound_interval}
                onChange={(e) => set("compound_interval")(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="Yearly">Yearly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>
            <Slider
              label="Period (Years)"
              value={v.period}
              min={1}
              max={50}
              onChange={set("period")}
            />
          </>
        )}

        {/* 16. Children Education Planner */}
        {tab === "Children Education Planner" && (
          <>
            <div className="md:col-span-3 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Children Details</h4>
                <button
                  onClick={addChild}
                  className="px-3 py-1 bg-[#043F79] text-white rounded text-sm"
                >
                  + Add Child
                </button>
              </div>
              <div className="space-y-4">
                {(v.children || []).map((child: any, index: number) => (
                  <div key={index} className="p-4 bg-white rounded border">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium">{child.name}</h5>
                      {(v.children || []).length > 1 && (
                        <button
                          onClick={() => removeChild(index)}
                          className="text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) =>
                            updateChild(index, "name", e.target.value)
                          }
                          className="w-full border rounded p-2"
                          placeholder="Child Name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Current Age
                        </label>
                        <input
                          type="number"
                          value={child.currentAge}
                          onChange={(e) =>
                            updateChild(
                              index,
                              "currentAge",
                              Number(e.target.value),
                            )
                          }
                          className="w-full border rounded p-2"
                          min={0}
                          max={18}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Education Age
                        </label>
                        <input
                          type="number"
                          value={child.educationAge}
                          onChange={(e) =>
                            updateChild(
                              index,
                              "educationAge",
                              Number(e.target.value),
                            )
                          }
                          className="w-full border rounded p-2"
                          min={0}
                          max={25}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Education Amount
                        </label>
                        <input
                          type="number"
                          value={child.educationAmount}
                          onChange={(e) =>
                            updateChild(
                              index,
                              "educationAmount",
                              Number(e.target.value),
                            )
                          }
                          className="w-full border rounded p-2"
                          min={0}
                          max={1000000}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Slider
              label="Inflation Rate"
              value={v.inflation_rate}
              min={1}
              max={15}
              suffix="%"
              onChange={set("inflation_rate")}
            />
            <Slider
              label="Expected Return"
              value={v.expected_return}
              min={1}
              max={20}
              suffix="%"
              onChange={set("expected_return")}
            />
            <Slider
              label="Current Savings"
              value={v.savings_amount}
              min={0}
              max={1000000}
              prefix="₹"
              onChange={set("savings_amount")}
            />
          </>
        )}

        {/* 17. Spending Less Calculator */}
        {tab === "Spending Less Calculator" && (
          <>
            <Slider
              label="Current Age"
              value={v.current_age}
              min={18}
              max={60}
              onChange={set("current_age")}
            />
            <Slider
              label="Retirement Age"
              value={v.retire_age}
              min={40}
              max={75}
              onChange={set("retire_age")}
            />
            <Slider
              label="Savings Interest Rate"
              value={v.savings_interest_rate}
              min={1}
              max={20}
              suffix="%"
              onChange={set("savings_interest_rate")}
            />
            <Slider
              label="Income Tax Rate"
              value={v.income_tax_rate}
              min={0}
              max={50}
              suffix="%"
              onChange={set("income_tax_rate")}
            />
            <Slider
              label="Inflation Rate"
              value={v.inflation_rate}
              min={1}
              max={15}
              suffix="%"
              onChange={set("inflation_rate")}
            />
            <Slider
              label="House / Flat Value"
              value={v.house_flat_value}
              min={0}
              max={10000000}
              prefix="₹"
              onChange={set("house_flat_value")}
            />
            <Slider
              label="Home Loan EMI"
              value={v.home_loan_emi_value}
              min={0}
              max={1000000}
              prefix="₹"
              onChange={set("home_loan_emi_value")}
            />
            <Slider
              label="New Car Value"
              value={v.new_car_value}
              min={0}
              max={5000000}
              prefix="₹"
              onChange={set("new_car_value")}
            />
            <Slider
              label="Eating Out"
              value={v.eating_out_value}
              min={0}
              max={100000}
              prefix="₹"
              onChange={set("eating_out_value")}
            />
            <Slider
              label="Lifestyle Spending"
              value={v.lifestyle_spending_value}
              min={0}
              max={100000}
              prefix="₹"
              onChange={set("lifestyle_spending_value")}
            />
            <Slider
              label="Holidays"
              value={v.holidays_value}
              min={0}
              max={100000}
              prefix="₹"
              onChange={set("holidays_value")}
            />
            <Slider
              label="Transport"
              value={v.transport_value}
              min={0}
              max={100000}
              prefix="₹"
              onChange={set("transport_value")}
            />
            <Slider
              label="Credit Card Interest"
              value={v.credit_card_interest_value}
              min={0}
              max={100000}
              prefix="₹"
              onChange={set("credit_card_interest_value")}
            />
            <Slider
              label="Personal Loan"
              value={v.personal_loan_value}
              min={0}
              max={100000}
              prefix="₹"
              onChange={set("personal_loan_value")}
            />
            <Slider
              label="Shopping"
              value={v.shopping_value}
              min={0}
              max={100000}
              prefix="₹"
              onChange={set("shopping_value")}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Slider Component ---------------- */
const Slider = ({
  label,
  value,
  min,
  max,
  step = 1,
  prefix = "",
  suffix = "",
  onChange,
}: any) => (
  <div className="min-w-0">
    <div className="mb-2 min-w-0 text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <span className="min-w-0 pr-2 leading-5 break-words text-slate-700">
          {label}
        </span>
        <div className="flex items-center gap-2 shrink-0 self-start rounded-xl border border-slate-200 bg-white px-3 py-2">
        {prefix && <span className="shrink-0">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 bg-transparent text-right outline-none"
        />
        {suffix && <span className="shrink-0">{suffix}</span>}
        </div>
      </div>
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
