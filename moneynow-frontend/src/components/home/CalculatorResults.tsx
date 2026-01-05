



"use client";

import React, { useState } from "react";
import SipBarChart from "./SipBarChart";
import PDFDownloadButton from "./downloadPDF";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface CalculatorResultsProps {
  activeTab: string;
  result?: any;
  invested?: number;
  returns?: number;
  future?: number;
  currentAge?: number;
  retirementAge?: number;
  isLoading?: boolean;
}

const formatAmount = (val?: number) =>
  typeof val === "number" && val > 0
    ? `₹${val.toLocaleString("en-IN")}`
    : "—";

export default function CalculatorResults({
  activeTab,
  result,
  invested = 0,
  returns = 0,
  future = 0,
  currentAge,
  retirementAge,
  isLoading = false,
}: CalculatorResultsProps) {
  const [showYearly, setShowYearly] = useState(false);

  return (
    <div className="mt-6">
      {/* PDF Button */}
      <div className="flex justify-end mb-4">
        <PDFDownloadButton
          activeTab={activeTab}
          result={result}
          currentAge={currentAge}
          retirementAge={retirementAge}
          disabled={isLoading || !result}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ---------- CHART ---------- */}
<div className="bg-white p-6 rounded-lg shadow h-[380px] flex items-center justify-center relative">
          <SipBarChart
            invested={[Math.max(1, invested / 2), Math.max(1, invested)]}
            returns={[Math.max(1, returns / 2), Math.max(1, returns)]}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 text-gray-600 text-sm font-medium">
              Updating…
            </div>
          )}
        </div>

        {/* ---------- SUMMARY ---------- */}
        <div className="space-y-6">
          {/* Top values */}
          <div className="space-y-2 text-right">
            <Row label="Future Value" value={formatAmount(future)} bold />
            <Row label="Total Invested" value={formatAmount(invested)} />
            <Row label="Estimated Returns" value={formatAmount(returns)} />
          </div>

          {/* Table */}
          <div className="bg-white max-h-[380px] overflow-y-auto rounded-lg shadow border border-gray-200">
            <div className="bg-[#043F79] text-white px-4 py-3 font-semibold">
              Investment Summary
            </div>

            <table className="w-full text-sm">
              <tbody className="divide-y">
                {/* ---------- SIP Growth ---------- */}
                {activeTab === "SIP Growth" && result && (
                  <>
                    <SummaryRow label="Monthly SIP" value={formatAmount(result.sip_amount)} />
                    <SummaryRow label="Interest Rate" value={`${result.interest_rate}%`} />
                    <SummaryRow label="Investment Period" value={`${result.period} Months`} />
                    <SummaryRow label="Invested Amount" value={formatAmount(result.invested_amount)} />
                    <SummaryRow label="Growth Value" value={formatAmount(result.growth_value)} />
                    <SummaryRow label="Maturity Amount" value={formatAmount(result.maturity_amount)} />
                  </>
                )}

                {/* ---------- Step-Up SIP ---------- */}
               {activeTab === "Step-Up SIP" && result && (
  <>
    <SummaryRow label="Monthly SIP" value={formatAmount(result.sip_amount)} />
    <SummaryRow label="Step-Up %" value={`${result.sip_stepup_value}%`} />
    <SummaryRow label="Interest Rate" value={`${result.interest_rate}%`} />
    <SummaryRow label="Investment Period" value={`${result.period} Months`} />
    <SummaryRow label="Invested Amount" value={formatAmount(result.invested_amount)} />
    <SummaryRow
      label="Step-Up Invested Amount"
      value={formatAmount(result.stepup_invested_amount)}
    />
    <SummaryRow label="Growth Value" value={formatAmount(result.growth_value)} />
    <SummaryRow
      label="Step-Up Growth Value"
      value={formatAmount(result.stepup_growth_value)}
    />
    <SummaryRow label="Maturity Amount" value={formatAmount(result.maturity_amount)} />
    <SummaryRow
      label="Step-Up Maturity Amount"
      value={formatAmount(result.stepup_maturity_amount)}
    />

    {/* ---------- YEAR-WISE BREAKDOWN ---------- */}
    {showYearly && result.list && (
      <>
        {/* Header */}
        <tr className="bg-gray-100 text-gray-700 text-sm font-semibold">
          <th className="px-4 py-2 text-left">Year</th>
          <th className="px-4 py-2 text-right">SIP / Month</th>
          <th className="px-4 py-2 text-right">Invested / Year</th>
          <th className="px-4 py-2 text-right">Total Invested</th>
        </tr>

        {/* Rows */}
        {result.list.map((item: any, idx: number) => (
          <tr
            key={idx}
            className="bg-gray-50 hover:bg-gray-100 transition text-sm"
          >
            <td className="px-4 py-2 font-medium text-gray-700">
              {item.year}
            </td>

            <td className="px-4 py-2 text-right">
              {formatAmount(item.sip_amount_per_month)}
            </td>

            <td className="px-4 py-2 text-right">
              {formatAmount(item.invested_amount_per_year)}
            </td>

            <td className="px-4 py-2 text-right font-semibold text-gray-900">
              {formatAmount(item.total_invested_amount)}
            </td>
          </tr>
        ))}
      </>
    )}

    {/* ---------- READ MORE / HIDE BUTTON (ONLY ONE, AT END) ---------- */}
    {result.list && result.list.length > 0 && (
      <tr>
        <td colSpan={4} className="px-4 py-3 text-center">
         <button
  onClick={() => setShowYearly(!showYearly)}
  className="inline-flex items-center gap-1 text-[#043F79] font-semibold "
>
  {showYearly ? (
    <>
      Hide Year-wise Breakdown
      <FiChevronUp size={18} />
    </>
  ) : (
    <>
      Read More
      <FiChevronDown size={18} />
    </>
  )}
</button>

        </td>
      </tr>
    )}
  </>
)}

{/* ---------- LUMPSUM ---------- */}
{activeTab === "Lumpsum" && result && (
  <>
    <SummaryRow
      label="Lumpsum Amount"
      value={formatAmount(result.lumpsum_amount)}
    />

    <SummaryRow
      label="Expected Return"
      value={`${result.expected_return}%`}
    />

    <SummaryRow
      label="Investment Period"
      value={`${result.years} Years`}
    />

    <tr className="bg-green-50">
      <td className="px-4 py-3 font-semibold text-green-700">
        Future Value
      </td>
      <td className="px-4 py-3 text-right font-bold text-green-700 text-lg">
        {formatAmount(result.future_amount)}
      </td>
    </tr>
  </>
)}


{/* ---------- GOAL PLANNER ---------- */}
{activeTab === "Goal Planner" && result && (
  <>
    <SummaryRow
      label="Dream Amount (Today)"
      value={formatAmount(result.dream_amount)}
    />

    <SummaryRow
      label="Inflation Rate"
      value={`${result.inflation_rate}%`}
    />

    <SummaryRow
      label="Expected Return"
      value={`${result.expected_return}%`}
    />

    <SummaryRow
      label="Time Period"
      value={`${result.years} Years`}
    />

    <SummaryRow
      label="Target Dream Amount"
      value={formatAmount(result.target_dream_amount)}
    />

    <SummaryRow
      label="Current Savings"
      value={formatAmount(result.savings_amount)}
    />

    <SummaryRow
      label="Monthly Savings Required"
      value={formatAmount(result.monthly_savings)}
    />

    <SummaryRow
      label="Total Invested"
      value={formatAmount(result.invested_amount)}
    />

    <SummaryRow
      label="Total Earnings"
      value={formatAmount(result.total_earnings)}
    />

    {/* Final Highlight */}
    <tr className="bg-green-50">
      <td className="px-4 py-3 font-semibold text-green-700">
        Target Goal Amount
      </td>
      <td className="px-4 py-3 text-right font-bold text-green-700 text-lg">
        {formatAmount(result.target_amount)}
      </td>
    </tr>
  </>
)}


{/* ---------- RETIREMENT PLANNER ---------- */}
{activeTab === "Retirement Planner" && result && (
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
      label="Years to Retirement"
      value={`${result.years} Years`}
    />

    <SummaryRow
      label="Desired Wealth (Today)"
      value={formatAmount(result.wealth_amount)}
    />

    <SummaryRow
      label="Inflation Rate"
      value={`${result.inflation_rate}%`}
    />

    <SummaryRow
      label="Expected Return"
      value={`${result.expected_return}%`}
    />

    <SummaryRow
      label="Current Savings"
      value={formatAmount(result.savings_amount)}
    />

    <SummaryRow
      label="Monthly Savings Required"
      value={formatAmount(result.monthly_savings)}
    />

    {/* 🔹 ADD THESE MISSING VALUES */}
    <SummaryRow
      label="Total Invested Amount"
      value={formatAmount(result.invested_amount)}
    />

    <SummaryRow
      label="Total Earnings"
      value={formatAmount(result.total_earnings)}
    />

    <SummaryRow
      label="Target Wealth at Retirement"
      value={formatAmount(result.target_wealth)}
    />

    <SummaryRow
      label="Target Savings Required"
      value={formatAmount(result.target_savings)}
    />

    {/* 🔹 FINAL HIGHLIGHT */}
    <tr className="bg-green-50">
      <td className="px-4 py-3 font-semibold text-green-700">
        Retirement Corpus Required
      </td>
      <td className="px-4 py-3 text-right font-bold text-green-700 text-lg">
        {formatAmount(result.target_amount)}
      </td>
    </tr>
  </>
)}


                {/* Always show totals */}
                <SummaryRow label="Total Invested" value={formatAmount(invested)} />
                <SummaryRow label="Estimated Returns" value={formatAmount(returns)} />

                <tr className="bg-green-50">
                  <td className="px-4 py-3 font-semibold text-green-700">Maturity Amount</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700 text-lg">{formatAmount(future)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
const SummaryRow = ({ label, value }: { label: string; value: any }) => (
  <tr>
    <td className="px-4 py-2 text-gray-600">{label}</td>
    <td className="px-4 py-2 text-right font-medium">{value}</td>
  </tr>
);

const Row = ({ label, value, bold }: { label: string; value: any; bold?: boolean }) => (
  <div className="flex justify-between text-gray-600">
    <span>{label}</span>
    <span className={bold ? "text-lg font-bold text-gray-900" : "font-semibold"}>{value}</span>
  </div>
);
