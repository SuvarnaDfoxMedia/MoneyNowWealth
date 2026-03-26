"use client";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PDFDownloadButtonProps {
  activeTab: string;
  result?: any;
  values?: any;
  disabled?: boolean;
  className?: string;
}

export default function PDFDownloadButton({
  activeTab,
  result,
  values = {},
  disabled = false,
  className = "",
}: PDFDownloadButtonProps) {
  const rupee = "₹";

  const formatValue = (val?: number, isPercent = false) => {
    if (typeof val !== "number") return "—";
    return isPercent ? `${val}%` : `${rupee}${val.toLocaleString("en-IN")}`;
  };

  const handleDownload = () => {
    if (!result) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${activeTab} Report`, 14, 20);

    const now = new Date();
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${now.toLocaleDateString("en-GB")} ${now.toLocaleTimeString()}`,
      14,
      30,
    );

    const summaryData: (string | number | undefined)[][] = [];

    // Prepare data based on calculator type - EXACT field names as per docs
    switch (activeTab) {
      case "Lumpsum":
        summaryData.push(
          ["Lumpsum Amount", formatValue(result.lumpsum_amount)],
          ["Expected Return", formatValue(result.expected_return, true)],
          ["Time Period", `${result.years} Years`],
          ["Future Amount", formatValue(result.future_amount)],
        );
        break;

      case "SIP Calculator":
        summaryData.push(
          ["Monthly SIP Amount", formatValue(result.sip_amount)],
          ["Interest Rate", formatValue(result.interest_rate, true)],
          ["Period in Months", result.period],
          ["Invested Amount", formatValue(result.invested_amount)],
          ["Growth Value", formatValue(result.growth_value)],
          ["Maturity Amount", formatValue(result.maturity_amount)],
        );
        break;

      case "Goal Setting Calculator":
        summaryData.push(
          ["No of Years", result.years],
          ["Dream Amount", formatValue(result.dream_amount)],
          ["Inflation Rate", formatValue(result.inflation_rate, true)],
          ["Expected Return", formatValue(result.expected_return, true)],
          ["Savings Amount", formatValue(result.savings_amount)],
          ["Target Dream Amount", formatValue(result.target_dream_amount)],
          ["Target Savings Amount", formatValue(result.target_savings_amount)],
          ["Target Amount", formatValue(result.target_amount)],
          ["Monthly Savings", formatValue(result.monthly_savings)],
          ["Invested Amount", formatValue(result.invested_amount)],
          ["Total Earnings", formatValue(result.total_earnings)],
        );
        break;

      case "SIP with Annual Increase":
        summaryData.push(
          ["Monthly SIP Amount", formatValue(result.sip_amount)],
          ["Interest Rate", formatValue(result.interest_rate, true)],
          ["Period in Months", result.period],
          ["SIP Step Up Value", formatValue(result.sip_stepup_value, true)],
          ["Invested Amount", formatValue(result.invested_amount)],
          ["Growth Value", formatValue(result.growth_value)],
          ["Maturity Amount", formatValue(result.maturity_amount)],
          [
            "Step-Up Invested Amount",
            formatValue(result.stepup_invested_amount),
          ],
          ["Step-Up Growth Value", formatValue(result.stepup_growth_value)],
          [
            "Step-Up Maturity Amount",
            formatValue(result.stepup_maturity_amount),
          ],
        );
        break;

      case "Target Amount SIP Calculator":
        summaryData.push(
          ["Target Amount", formatValue(result.wealth_amount)],
          ["Inflation Rate", formatValue(result.inflation_rate, true)],
          ["Expected Return", formatValue(result.expected_return, true)],
          ["Investment Period", `${result.period} Years`],
          ["Target Wealth", formatValue(result.target_wealth)],
          ["SIP Amount", formatValue(result.sip_amount)],
          ["Invested Amount", formatValue(result.invested_amount)],
          ["Growth Amount", formatValue(result.growth_amount)],
        );
        break;

      case "Lumpsum Target Calculator":
        summaryData.push(
          ["Target Amount", formatValue(result.target_amount)],
          ["Expected Return", formatValue(result.expected_return, true)],
          ["Investment Period", `${result.years} Years`],
          ["Lumpsum Amount", formatValue(result.lumpsum_amount)],
        );
        break;

      case "Become A Crorepati Calculator":
      case "Retirement Planning Calculator":
        summaryData.push(
          ["Current Age", result.current_age],
          ["Retirement Age", result.retirement_age],
          ["Wealth Amount", formatValue(result.wealth_amount)],
          ["Inflation Rate", formatValue(result.inflation_rate, true)],
          ["Expected Return", formatValue(result.expected_return, true)],
          ["Savings Amount", formatValue(result.savings_amount)],
          ["Target Wealth", formatValue(result.target_wealth)],
          ["Target Savings", formatValue(result.target_savings)],
          ["Target Amount", formatValue(result.target_amount)],
          ["Years", result.years],
          ["Monthly Savings", formatValue(result.monthly_savings)],
          ["Invested Amount", formatValue(result.invested_amount)],
          ["Total Earnings", formatValue(result.total_earnings)],
        );
        break;

      case "Car Loan Calculator":
      case "Home Loan Calculator":
      case "Personal Loan EMI Calculator":
      case "Education Loan EMI Calculator":
        summaryData.push(
          ["Loan Amount", formatValue(result.loan_amount)],
          ["Interest Rate", formatValue(result.interest_rate, true)],
          ["Loan Tenure Type", result.loan_tenure_type],
          ["Loan Tenure", result.loan_tenure],
          ["EMI", formatValue(result.emi)],
          ["Total Interest", formatValue(result.total_interest)],
          ["Total Amount", formatValue(result.total_amount)],
        );
        break;

      case "SWP Calculator":
        summaryData.push(
          ["Invested Amount", formatValue(result.invested_amount)],
          ["SWP Tenure", `${result.swp_tenure} Years`],
          [
            "Total Withdrawal Amount",
            formatValue(result.total_withdrawal_amount),
          ],
          ["Terminal Value", formatValue(result.terminal_value)],
        );
        break;

      case "Future Value Calculator":
        summaryData.push(
          ["Current Cost", formatValue(result.current_cost)],
          ["Inflation Rate", formatValue(result.inflation_rate, true)],
          ["No of Years", result.no_years],
          ["Future Amount", formatValue(result.future_amount)],
        );
        break;

      case "Compounding Calculator":
        summaryData.push(
          ["Principal Amount", formatValue(result.principal_amount)],
          ["Interest Rate", formatValue(result.interest_rate, true)],
          ["Compound Interval", result.compound_interval],
          ["Period", result.period],
          ["Maturity Amount", formatValue(result.maturity_amount)],
        );
        break;

      case "Children Education Planner":
        summaryData.push(
          ["Child 1 Name", result.child1_name || "—"],
          ["Child 1 Current Age", result.child1_current_age],
          ["Child 1 Education Age", result.child1_education_age],
          [
            "Child 1 Education Amount",
            formatValue(result.child1_education_amount),
          ],
          ["Inflation Rate", formatValue(result.inflation_rate, true)],
          ["Expected Return", formatValue(result.expected_return, true)],
          [
            "Total Education Amount",
            formatValue(result.total_education_amount),
          ],
          [
            "Total Inflation Adjusted Amount",
            formatValue(result.total_inflation_adjust_education_amount),
          ],
          ["Total Monthly Savings", formatValue(result.total_monthly_savings)],
        );
        break;

      case "Spending Less Calculator":
        summaryData.push(
          ["Current Age", result.current_age],
          ["Retirement Age", result.retire_age],
          [
            "Savings Interest Rate",
            formatValue(result.savings_interest_rate, true),
          ],
          ["Income Tax Rate", formatValue(result.income_tax_rate, true)],
          ["Inflation Rate", formatValue(result.inflation_rate, true)],
          ["Savings Amount", formatValue(result.savings_amount)],
          ["Years", result.years],
          [
            "Savings Maturity Amount",
            formatValue(result.savings_maturity_amount),
          ],
        );
        break;
    }

    const normalizedSummaryData: (string | number)[][] = summaryData.map(
      ([label, value]) => [
        String(label),
        typeof value === "number" ? value : (value ?? "â€”"),
      ],
    );

    // Add summary table
    autoTable(doc, {
      startY: 40,
      head: [["Parameter", "Value"]],
      body: normalizedSummaryData,
      theme: "grid",
      headStyles: { fillColor: [4, 63, 121], textColor: 255 },
      styles: { cellPadding: 3, fontSize: 10 },
    });

    // Add Yearly Breakdown for Step-Up SIP
    if (
      activeTab === "SIP with Annual Increase" &&
      Array.isArray(result.list) &&
      result.list.length > 0
    ) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Year-wise Investment Breakdown", 14, 20);

      const headers = ["Year", "SIP/Month", "Invested/Year", "Total Invested"];
      const rows: (string | number)[][] = result.list.map((row: any) => [
        row.year ?? "â€”",
        formatValue(row.sip_amount_per_month),
        formatValue(row.invested_amount_per_year),
        formatValue(row.total_invested_amount),
      ]);

      autoTable(doc, {
        startY: 30,
        head: [headers],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [0, 123, 255], textColor: 255 },
        styles: { cellPadding: 3, fontSize: 10 },
      });
    }

    doc.save(`${activeTab.replace(/\s+/g, "_")}_Report_${Date.now()}.pdf`);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !result}
      className={`px-4 py-2 rounded text-white ${
        disabled || !result
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-[#043F79] hover:bg-blue-700"
      } ${className}`}
    >
      Download Report
    </button>
  );
}
