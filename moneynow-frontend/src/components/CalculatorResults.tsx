"use client";

import React, { useState, useMemo } from "react";
import SipBarChart from "@/components/home/SipBarChart";
import PDFDownloadButton from "@/components/Mutual-Funds-Master-Categeory/downloadPDF";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface CalculatorResultsProps {
  activeTab: string;
  result?: any;
  values?: any;
  isLoading?: boolean;
}

const toNumber = (val: any, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

const formatAmount = (val?: number) =>
  typeof val === "number" && val > 0 ? `₹${val.toLocaleString("en-IN")}` : "—";

const formatPercent = (val?: number) =>
  typeof val === "number" ? `${val}%` : "—";

export default function CalculatorResults({
  activeTab,
  result,
  values = {},
  isLoading = false,
}: CalculatorResultsProps) {
  const [showYearly, setShowYearly] = useState(false);

  // ---------------- CHART DATA ----------------
  const chartData = useMemo(() => {
    if (!result) return { invested: [], returns: [] };

    // Dynamic years based on tab values
    let years = 15;

    if (activeTab === "Lumpsum") years = toNumber(values.years, 10);
    if (activeTab === "Lumpsum Target Calculator")
      years = toNumber(values.years, 10);

    if (
      activeTab === "SIP Calculator" ||
      activeTab === "SIP with Annual Increase"
    ) {
      const months = toNumber(values.period, 120);
      years = Math.max(1, Math.ceil(months / 12));
    }

    if (activeTab === "Target Amount SIP Calculator") {
      years = toNumber(values.period, 10);
    }

    // Keep chart readable
    years = Math.min(Math.max(years, 1), 30);

    const investedArray = Array(years).fill(0);
    const returnsArray = Array(years).fill(0);

    switch (activeTab) {
      case "Lumpsum": {
        const lumpsum = toNumber(
          result.lumpsum_amount ?? values.lumpsum_amount,
          0,
        );
        const expectedReturn = toNumber(
          result.expected_return ?? values.expected_return,
          0,
        );

        for (let i = 0; i < years; i++) {
          const year = i + 1;
          const factor = Math.pow(1 + expectedReturn / 100, year);
          const futureValue = lumpsum * factor;

          investedArray[i] = lumpsum / 100000;
          returnsArray[i] = (futureValue - lumpsum) / 100000;
        }
        break;
      }

      case "SIP Calculator": {
        const invested = toNumber(result.invested_amount, 0);
        const maturity = toNumber(result.maturity_amount, 0);

        if (maturity && invested) {
          for (let i = 0; i < years; i++) {
            const progress = (i + 1) / years;
            investedArray[i] = (invested * progress) / 100000;
            returnsArray[i] = ((maturity - invested) * progress) / 100000;
          }
        }
        break;
      }

      case "SIP with Annual Increase": {
        const invested =
          toNumber(result.stepup_invested_amount, 0) ||
          toNumber(result.invested_amount, 0);

        const maturity =
          toNumber(result.stepup_maturity_amount, 0) ||
          toNumber(result.maturity_amount, 0);

        if (maturity && invested) {
          for (let i = 0; i < years; i++) {
            const progress = (i + 1) / years;
            investedArray[i] = (invested * progress) / 100000;
            returnsArray[i] = ((maturity - invested) * progress) / 100000;
          }
        }
        break;
      }

      case "Goal Setting Calculator":
      case "Become A Crorepati Calculator":
      case "Retirement Planning Calculator": {
        const invested = toNumber(result.invested_amount, 0);
        const target = toNumber(result.target_amount, 0);

        if (target && invested) {
          for (let i = 0; i < years; i++) {
            const progress = (i + 1) / years;
            investedArray[i] = (invested * progress) / 100000;
            returnsArray[i] = ((target - invested) * progress) / 100000;
          }
        }
        break;
      }

      default: {
        // Keep chart stable for calculators without invested/maturity data
        for (let i = 0; i < years; i++) {
          const progress = (i + 1) / years;
          investedArray[i] = progress;
          returnsArray[i] = progress * 0.5;
        }
      }
    }

    return { invested: investedArray, returns: returnsArray };
  }, [activeTab, result, values]);

  return (
    <div className="mt-6 min-w-0">
      {/* PDF Button */}
      <div className="flex justify-end mb-4">
        <PDFDownloadButton
          activeTab={activeTab}
          result={result}
          values={values}
          disabled={isLoading || !result}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
        {/* ---------- CHART ---------- */}
        <div className="bg-white p-6 rounded-lg shadow h-[380px] flex items-center justify-center relative min-w-0 overflow-hidden">
          {!isLoading && result && (
            <SipBarChart
              invested={chartData.invested}
              returns={chartData.returns}
            />
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 text-gray-600 text-sm font-medium">
              Loading...
            </div>
          )}

          {!isLoading && !result && (
            <div className="text-center text-gray-500">
              <p>Enter values to see calculation results</p>
            </div>
          )}
        </div>

        {/* ---------- SUMMARY ---------- */}
        <div className="space-y-6 min-w-0">
          {/* Top summary values */}
          {result && (
            <div className="space-y-2 text-right">
              {activeTab === "Lumpsum" && result.future_amount && (
                <Row
                  label="Future Value"
                  value={formatAmount(result.future_amount)}
                  bold
                />
              )}

              {activeTab === "SIP Calculator" && result.maturity_amount && (
                <Row
                  label="Maturity Amount"
                  value={formatAmount(result.maturity_amount)}
                  bold
                />
              )}

              {activeTab === "SIP with Annual Increase" &&
                (result.stepup_maturity_amount || result.maturity_amount) && (
                  <Row
                    label="Step-Up Maturity Amount"
                    value={formatAmount(
                      result.stepup_maturity_amount ?? result.maturity_amount,
                    )}
                    bold
                  />
                )}

              {[
                "Goal Setting Calculator",
                "Become A Crorepati Calculator",
                "Retirement Planning Calculator",
              ].includes(activeTab) &&
                result.target_amount && (
                  <Row
                    label="Target Amount"
                    value={formatAmount(result.target_amount)}
                    bold
                  />
                )}

              {activeTab === "Target Amount SIP Calculator" &&
                result.target_wealth && (
                  <Row
                    label="Target Wealth"
                    value={formatAmount(result.target_wealth)}
                    bold
                  />
                )}

              {activeTab === "Lumpsum Target Calculator" &&
                result.lumpsum_amount && (
                  <Row
                    label="Lumpsum Required"
                    value={formatAmount(result.lumpsum_amount)}
                    bold
                  />
                )}

              {[
                "Car Loan Calculator",
                "Home Loan Calculator",
                "Personal Loan EMI Calculator",
                "Education Loan EMI Calculator",
              ].includes(activeTab) &&
                result.emi && (
                  <Row label="EMI" value={formatAmount(result.emi)} bold />
                )}

              {activeTab === "SWP Calculator" && result.terminal_value && (
                <Row
                  label="Terminal Value"
                  value={formatAmount(result.terminal_value)}
                  bold
                />
              )}

              {activeTab === "Future Value Calculator" &&
                result.future_amount && (
                  <Row
                    label="Future Amount"
                    value={formatAmount(result.future_amount)}
                    bold
                  />
                )}

              {activeTab === "Compounding Calculator" &&
                result.maturity_amount && (
                  <Row
                    label="Maturity Amount"
                    value={formatAmount(result.maturity_amount)}
                    bold
                  />
                )}

              {activeTab === "Children Education Planner" &&
                result.total_inflation_adjust_education_amount && (
                  <Row
                    label="Total Education Amount Required"
                    value={formatAmount(
                      result.total_inflation_adjust_education_amount,
                    )}
                    bold
                  />
                )}

              {activeTab === "Spending Less Calculator" &&
                result.savings_maturity_amount && (
                  <Row
                    label="Savings Maturity Amount"
                    value={formatAmount(result.savings_maturity_amount)}
                    bold
                  />
                )}
            </div>
          )}

          {/* Detailed Results Table */}
          <div className="bg-white max-h-[380px] overflow-y-auto rounded-lg shadow border border-gray-200">
            <div className="bg-[#043F79] text-white px-4 py-3 font-semibold">
              {activeTab} Results
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Calculating...
              </div>
            ) : !result ? (
              <div className="p-8 text-center text-gray-500">
                Enter values and wait for calculation
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {/* ---------- LUMPSUM CALCULATOR ---------- */}
                  {activeTab === "Lumpsum" && (
                    <>
                      <SummaryRow
                        label="Lumpsum Amount"
                        value={formatAmount(result.lumpsum_amount)}
                      />
                      <SummaryRow
                        label="Expected Return"
                        value={formatPercent(
                          result.expected_return ?? values.expected_return,
                        )}
                      />
                      <SummaryRow
                        label="Time Period"
                        value={`${result.years} Years`}
                      />
                      <SummaryRow
                        label="Future Amount"
                        value={formatAmount(result.future_amount)}
                      />
                    </>
                  )}

                  {/* ---------- SIP CALCULATOR ---------- */}
                  {activeTab === "SIP Calculator" && (
                    <>
                      <SummaryRow
                        label="Monthly SIP Amount"
                        value={formatAmount(result.sip_amount)}
                      />
                      <SummaryRow
                        label="Interest Rate"
                        value={formatPercent(result.interest_rate)}
                      />
                      <SummaryRow
                        label="Period in Months"
                        value={result.period}
                      />
                      <SummaryRow
                        label="Invested Amount"
                        value={formatAmount(result.invested_amount)}
                      />
                      <SummaryRow
                        label="Growth Value"
                        value={formatAmount(result.growth_value)}
                      />
                      <SummaryRow
                        label="Maturity Amount"
                        value={formatAmount(result.maturity_amount)}
                      />
                    </>
                  )}

                  {/* ---------- GOAL SETTING CALCULATOR ---------- */}
                  {activeTab === "Goal Setting Calculator" && (
                    <>
                      <SummaryRow label="No of Years" value={result.years} />
                      <SummaryRow
                        label="Dream Amount"
                        value={formatAmount(result.dream_amount)}
                      />
                      <SummaryRow
                        label="Inflation Rate"
                        value={formatPercent(result.inflation_rate)}
                      />
                      <SummaryRow
                        label="Expected Return"
                        value={formatPercent(result.expected_return)}
                      />
                      <SummaryRow
                        label="Savings Amount"
                        value={formatAmount(result.savings_amount)}
                      />
                      <SummaryRow
                        label="Target Dream Amount"
                        value={formatAmount(result.target_dream_amount)}
                      />
                      <SummaryRow
                        label="Target Savings Amount"
                        value={formatAmount(result.target_savings_amount)}
                      />
                      <SummaryRow
                        label="Target Amount"
                        value={formatAmount(result.target_amount)}
                      />
                      <SummaryRow
                        label="Monthly Savings"
                        value={formatAmount(result.monthly_savings)}
                      />
                      <SummaryRow
                        label="Invested Amount"
                        value={formatAmount(result.invested_amount)}
                      />
                      <SummaryRow
                        label="Total Earnings"
                        value={formatAmount(result.total_earnings)}
                      />
                    </>
                  )}

                  {/* ---------- SIP WITH ANNUAL INCREASE ---------- */}
                  {activeTab === "SIP with Annual Increase" && (
                    <>
                      <SummaryRow
                        label="Monthly SIP Amount"
                        value={formatAmount(result.sip_amount)}
                      />
                      <SummaryRow
                        label="Interest Rate"
                        value={formatPercent(result.interest_rate)}
                      />
                      <SummaryRow
                        label="Period in Months"
                        value={result.period}
                      />
                      <SummaryRow
                        label="SIP Step Up Value"
                        value={formatPercent(result.sip_stepup_value)}
                      />
                      <SummaryRow
                        label="Invested Amount"
                        value={formatAmount(result.invested_amount)}
                      />
                      <SummaryRow
                        label="Growth Value"
                        value={formatAmount(result.growth_value)}
                      />
                      <SummaryRow
                        label="Maturity Amount"
                        value={formatAmount(result.maturity_amount)}
                      />
                      <SummaryRow
                        label="Step-Up Invested Amount"
                        value={formatAmount(result.stepup_invested_amount)}
                      />
                      <SummaryRow
                        label="Step-Up Growth Value"
                        value={formatAmount(result.stepup_growth_value)}
                      />
                      <SummaryRow
                        label="Step-Up Maturity Amount"
                        value={formatAmount(result.stepup_maturity_amount)}
                      />

                      {/* YEAR-WISE BREAKDOWN */}
                      {showYearly && result.list && result.list.length > 0 && (
                        <>
                          <tr className="bg-gray-100">
                            <td
                              colSpan={4}
                              className="px-4 py-2 font-semibold text-gray-700"
                            >
                              Year-wise Breakdown
                            </td>
                          </tr>

                          <tr className="bg-gray-100 text-gray-700 text-xs font-semibold">
                            <th className="px-4 py-2 text-left">Year</th>
                            <th className="px-4 py-2 text-right">SIP/Month</th>
                            <th className="px-4 py-2 text-right">
                              Invested/Year
                            </th>
                            <th className="px-4 py-2 text-right">
                              Total Invested
                            </th>
                          </tr>

                          {result.list.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2">{item.year}</td>
                              <td className="px-4 py-2 text-right">
                                {formatAmount(item.sip_amount_per_month)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {formatAmount(item.invested_amount_per_year)}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                {formatAmount(item.total_invested_amount)}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}

                      {result.list && result.list.length > 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-center">
                            <button
                              onClick={() => setShowYearly(!showYearly)}
                              className="inline-flex items-center gap-1 text-[#043F79] font-semibold text-sm"
                            >
                              {showYearly ? (
                                <>
                                  Hide Year-wise Breakdown{" "}
                                  <FiChevronUp size={16} />
                                </>
                              ) : (
                                <>
                                  Show Year-wise Breakdown{" "}
                                  <FiChevronDown size={16} />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  )}

                  {/* ---------- TARGET AMOUNT SIP ---------- */}
                  {activeTab === "Target Amount SIP Calculator" && (
                    <>
                      <SummaryRow
                        label="Target Amount"
                        value={formatAmount(result.wealth_amount)}
                      />
                      <SummaryRow
                        label="Inflation Rate"
                        value={formatPercent(result.inflation_rate)}
                      />
                      <SummaryRow
                        label="Expected Return"
                        value={formatPercent(result.expected_return)}
                      />
                      <SummaryRow
                        label="Investment Period"
                        value={`${result.period} Years`}
                      />
                      <SummaryRow
                        label="Target Wealth"
                        value={formatAmount(result.target_wealth)}
                      />
                      <SummaryRow
                        label="SIP Amount"
                        value={formatAmount(result.sip_amount)}
                      />
                      <SummaryRow
                        label="Invested Amount"
                        value={formatAmount(result.invested_amount)}
                      />
                      <SummaryRow
                        label="Growth Amount"
                        value={formatAmount(result.growth_amount)}
                      />
                    </>
                  )}

                  {/* ---------- LUMPSUM TARGET ---------- */}
                  {activeTab === "Lumpsum Target Calculator" && (
                    <>
                      <SummaryRow
                        label="Target Amount"
                        value={formatAmount(result.target_amount)}
                      />
                      <SummaryRow
                        label="Expected Return"
                        value={formatPercent(result.expected_return)}
                      />
                      <SummaryRow
                        label="Investment Period"
                        value={`${result.years} Years`}
                      />
                      <SummaryRow
                        label="Lumpsum Amount"
                        value={formatAmount(result.lumpsum_amount)}
                      />
                    </>
                  )}

                  {/* ---------- BECOME A CROREPATI ---------- */}
                  {activeTab === "Become A Crorepati Calculator" && (
                    <>
                      <SummaryRow
                        label="Current Age"
                        value={`${result.current_age} Years`}
                      />
                      <SummaryRow
                        label="Retirement Age"
                        value={`${result.retirement_age} Years`}
                      />
                      <SummaryRow
                        label="Wealth Amount"
                        value={formatAmount(result.wealth_amount)}
                      />
                      <SummaryRow
                        label="Inflation Rate"
                        value={formatPercent(result.inflation_rate)}
                      />
                      <SummaryRow
                        label="Expected Return"
                        value={formatPercent(result.expected_return)}
                      />
                      <SummaryRow
                        label="Savings Amount"
                        value={formatAmount(result.savings_amount)}
                      />
                      <SummaryRow
                        label="Target Wealth"
                        value={formatAmount(result.target_wealth)}
                      />
                      <SummaryRow
                        label="Target Savings"
                        value={formatAmount(result.target_savings)}
                      />
                      <SummaryRow
                        label="Target Amount"
                        value={formatAmount(result.target_amount)}
                      />
                      <SummaryRow label="Years" value={result.years} />
                      <SummaryRow
                        label="Monthly Savings"
                        value={formatAmount(result.monthly_savings)}
                      />
                      <SummaryRow
                        label="Invested Amount"
                        value={formatAmount(result.invested_amount)}
                      />
                      <SummaryRow
                        label="Total Earnings"
                        value={formatAmount(result.total_earnings)}
                      />
                    </>
                  )}

                  {/* ---------- RETIREMENT PLANNING ---------- */}
                  {activeTab === "Retirement Planning Calculator" && (
                    <>
                      <SummaryRow
                        label="Current Age"
                        value={`${result.current_age} Years`}
                      />
                      <SummaryRow
                        label="Retirement Age"
                        value={`${result.retirement_age} Years`}
                      />
                      <SummaryRow
                        label="Wealth Amount"
                        value={formatAmount(result.wealth_amount)}
                      />
                      <SummaryRow
                        label="Inflation Rate"
                        value={formatPercent(result.inflation_rate)}
                      />
                      <SummaryRow
                        label="Expected Return"
                        value={formatPercent(result.expected_return)}
                      />
                      <SummaryRow
                        label="Savings Amount"
                        value={formatAmount(result.savings_amount)}
                      />
                      <SummaryRow
                        label="Target Wealth"
                        value={formatAmount(result.target_wealth)}
                      />
                      <SummaryRow
                        label="Target Savings"
                        value={formatAmount(result.target_savings)}
                      />
                      <SummaryRow
                        label="Target Amount"
                        value={formatAmount(result.target_amount)}
                      />
                      <SummaryRow label="Years" value={result.years} />
                      <SummaryRow
                        label="Monthly Savings"
                        value={formatAmount(result.monthly_savings)}
                      />
                      <SummaryRow
                        label="Invested Amount"
                        value={formatAmount(result.invested_amount)}
                      />
                      <SummaryRow
                        label="Total Earnings"
                        value={formatAmount(result.total_earnings)}
                      />
                    </>
                  )}

                  {/* ---------- LOAN CALCULATORS ---------- */}
                  {(activeTab === "Car Loan Calculator" ||
                    activeTab === "Home Loan Calculator" ||
                    activeTab === "Personal Loan EMI Calculator" ||
                    activeTab === "Education Loan EMI Calculator") && (
                    <>
                      <SummaryRow
                        label="Loan Amount"
                        value={formatAmount(result.loan_amount)}
                      />
                      <SummaryRow
                        label="Interest Rate"
                        value={formatPercent(result.interest_rate)}
                      />
                      <SummaryRow
                        label="Loan Tenure Type"
                        value={result.loan_tenure_type}
                      />
                      <SummaryRow
                        label="Loan Tenure"
                        value={result.loan_tenure}
                      />
                      <SummaryRow
                        label="EMI"
                        value={formatAmount(result.emi)}
                      />
                      <SummaryRow
                        label="Total Interest"
                        value={formatAmount(result.total_interest)}
                      />
                      <SummaryRow
                        label="Total Amount"
                        value={formatAmount(result.total_amount)}
                      />
                    </>
                  )}

                  {/* ---------- SWP CALCULATOR ---------- */}
                  {activeTab === "SWP Calculator" && (
                    <>
                      <SummaryRow
                        label="Invested Amount"
                        value={formatAmount(result.invested_amount)}
                      />
                      <SummaryRow
                        label="SWP Tenure"
                        value={`${result.swp_tenure} Years`}
                      />
                      <SummaryRow
                        label="Total Withdrawal Amount"
                        value={formatAmount(result.total_withdrawal_amount)}
                      />
                      <SummaryRow
                        label="Terminal Value"
                        value={formatAmount(result.terminal_value)}
                      />
                    </>
                  )}

                  {/* ---------- FUTURE VALUE CALCULATOR ---------- */}
                  {activeTab === "Future Value Calculator" && (
                    <>
                      <SummaryRow
                        label="Current Cost"
                        value={formatAmount(result.current_cost)}
                      />
                      <SummaryRow
                        label="Inflation Rate"
                        value={formatPercent(result.inflation_rate)}
                      />
                      <SummaryRow label="No of Years" value={result.no_years} />
                      <SummaryRow
                        label="Future Amount"
                        value={formatAmount(result.future_amount)}
                      />
                    </>
                  )}

                  {/* ---------- COMPOUNDING CALCULATOR ---------- */}
                  {activeTab === "Compounding Calculator" && (
                    <>
                      <SummaryRow
                        label="Principal Amount"
                        value={formatAmount(result.principal_amount)}
                      />
                      <SummaryRow
                        label="Interest Rate"
                        value={formatPercent(result.interest_rate)}
                      />
                      <SummaryRow
                        label="Compound Interval"
                        value={result.compound_interval}
                      />
                      <SummaryRow label="Period" value={result.period} />
                      <SummaryRow
                        label="Maturity Amount"
                        value={formatAmount(result.maturity_amount)}
                      />
                    </>
                  )}

                  {/* ---------- CHILDREN EDUCATION PLANNER ---------- */}
                  {activeTab === "Children Education Planner" && (
                    <>
                      {result.child1_name && result.child1_name !== "" && (
                        <>
                          <SummaryRow
                            label={`${result.child1_name}'s Current Age`}
                            value={`${result.child1_current_age} Years`}
                          />
                          <SummaryRow
                            label={`${result.child1_name}'s Education Age`}
                            value={`${result.child1_education_age} Years`}
                          />
                          <SummaryRow
                            label={`${result.child1_name}'s Education Amount`}
                            value={formatAmount(result.child1_education_amount)}
                          />
                          <SummaryRow
                            label={`${result.child1_name}'s Inflation Adjusted Amount`}
                            value={formatAmount(
                              result.child1_inflation_adjust_education_amount,
                            )}
                          />
                          <SummaryRow
                            label={`${result.child1_name}'s Savings Amount`}
                            value={formatAmount(result.child1_savings_amount)}
                          />
                          <SummaryRow
                            label={`${result.child1_name}'s Monthly Savings`}
                            value={formatAmount(result.child1_monthly_savings)}
                          />
                        </>
                      )}

                      {result.child2_name && result.child2_name !== "" && (
                        <>
                          <SummaryRow
                            label={`${result.child2_name}'s Current Age`}
                            value={`${result.child2_current_age} Years`}
                          />
                          <SummaryRow
                            label={`${result.child2_name}'s Education Age`}
                            value={`${result.child2_education_age} Years`}
                          />
                          <SummaryRow
                            label={`${result.child2_name}'s Education Amount`}
                            value={formatAmount(result.child2_education_amount)}
                          />
                          <SummaryRow
                            label={`${result.child2_name}'s Inflation Adjusted Amount`}
                            value={formatAmount(
                              result.child2_inflation_adjust_education_amount,
                            )}
                          />
                          <SummaryRow
                            label={`${result.child2_name}'s Savings Amount`}
                            value={formatAmount(result.child2_savings_amount)}
                          />
                          <SummaryRow
                            label={`${result.child2_name}'s Monthly Savings`}
                            value={formatAmount(result.child2_monthly_savings)}
                          />
                        </>
                      )}

                      <SummaryRow
                        label="Inflation Rate"
                        value={formatPercent(result.inflation_rate)}
                      />
                      <SummaryRow
                        label="Expected Return"
                        value={formatPercent(result.expected_return)}
                      />
                      <SummaryRow
                        label="Total Savings Amount"
                        value={formatAmount(result.total_savings_amount)}
                      />
                      <SummaryRow
                        label="Total Monthly Savings"
                        value={formatAmount(result.total_monthly_savings)}
                      />
                      <SummaryRow
                        label="Total Education Amount"
                        value={formatAmount(result.total_education_amount)}
                      />
                      <SummaryRow
                        label="Total Inflation Adjusted Amount"
                        value={formatAmount(
                          result.total_inflation_adjust_education_amount,
                        )}
                      />
                    </>
                  )}

                  {/* ---------- SPENDING LESS CALCULATOR ---------- */}
                  {activeTab === "Spending Less Calculator" && (
                    <>
                      <SummaryRow
                        label="Current Age"
                        value={result.current_age}
                      />
                      <SummaryRow
                        label="Retirement Age"
                        value={result.retire_age}
                      />
                      <SummaryRow
                        label="Savings Interest Rate"
                        value={formatPercent(result.savings_interest_rate)}
                      />
                      <SummaryRow
                        label="Income Tax Rate"
                        value={formatPercent(result.income_tax_rate)}
                      />
                      <SummaryRow
                        label="Inflation Rate"
                        value={formatPercent(result.inflation_rate)}
                      />
                      <SummaryRow
                        label="Savings Amount"
                        value={formatAmount(result.savings_amount)}
                      />
                      <SummaryRow label="Years" value={result.years} />
                      <SummaryRow
                        label="Savings Maturity Amount"
                        value={formatAmount(result.savings_maturity_amount)}
                      />
                    </>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helper Components ---------- */
const SummaryRow = ({ label, value }: { label: string; value: any }) => (
  <tr>
    <td className="px-4 py-2 text-gray-600">{label}</td>
    <td className="px-4 py-2 text-right font-medium">{value}</td>
  </tr>
);

const Row = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: any;
  bold?: boolean;
}) => (
  <div className="flex justify-between text-gray-600">
    <span>{label}</span>
    <span
      className={bold ? "text-lg font-bold text-gray-900" : "font-semibold"}
    >
      {value}
    </span>
  </div>
);
