import type { CalculatorTab } from "@/hooks/useCalculator";
import { formatNullable, formatValue } from "@/lib/reports/formatters";

export type SimpleReportRow = [string, string | number];

export interface SimpleDetailTable {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export interface SimpleCalculatorReportContext {
  activeTab: string;
  result: Record<string, any>;
  values: Record<string, any>;
}

export interface SimpleCalculatorReportDefinition {
  summaryRows: (context: SimpleCalculatorReportContext) => SimpleReportRow[];
  detailTables?: (
    context: SimpleCalculatorReportContext,
  ) => SimpleDetailTable[];
}

const simpleDefinitions: Partial<
  Record<CalculatorTab, SimpleCalculatorReportDefinition>
> = {
  Lumpsum: {
    summaryRows: ({ result }) => [
      ["Lumpsum Amount", formatValue(result.lumpsum_amount)],
      ["Expected Return", formatValue(result.expected_return, true)],
      ["Time Period", `${result.years} Years`],
      ["Future Amount", formatValue(result.future_amount)],
    ],
  },
  "SIP Calculator": {
    summaryRows: ({ result }) => [
      ["Monthly SIP Amount", formatValue(result.sip_amount)],
      ["Interest Rate", formatValue(result.interest_rate, true)],
      ["Period in Months", formatNullable(result.period)],
      ["Invested Amount", formatValue(result.invested_amount)],
      ["Growth Value", formatValue(result.growth_value)],
      ["Maturity Amount", formatValue(result.maturity_amount)],
    ],
  },
  "Goal Setting Calculator": {
    summaryRows: ({ result }) => [
      ["No of Years", formatNullable(result.years)],
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
    ],
  },
  "SIP with Annual Increase": {
    summaryRows: ({ result }) => [
      ["Monthly SIP Amount", formatValue(result.sip_amount)],
      ["Interest Rate", formatValue(result.interest_rate, true)],
      ["Period in Months", formatNullable(result.period)],
      ["SIP Step Up Value", formatValue(result.sip_stepup_value, true)],
      ["Invested Amount", formatValue(result.invested_amount)],
      ["Growth Value", formatValue(result.growth_value)],
      ["Maturity Amount", formatValue(result.maturity_amount)],
      ["Step-Up Invested Amount", formatValue(result.stepup_invested_amount)],
      ["Step-Up Growth Value", formatValue(result.stepup_growth_value)],
      ["Step-Up Maturity Amount", formatValue(result.stepup_maturity_amount)],
    ],
    detailTables: ({ result }) =>
      Array.isArray(result.list) && result.list.length > 0
        ? [
            {
              title: "Year-wise Investment Breakdown",
              headers: [
                "Year",
                "SIP/Month",
                "Invested/Year",
                "Total Invested",
              ],
              rows: result.list.map((row: any) => [
                row.year ?? "—",
                formatValue(row.sip_amount_per_month),
                formatValue(row.invested_amount_per_year),
                formatValue(row.total_invested_amount),
              ]),
            },
          ]
        : [],
  },
  "Target Amount SIP Calculator": {
    summaryRows: ({ result }) => [
      ["Target Amount", formatValue(result.wealth_amount)],
      ["Inflation Rate", formatValue(result.inflation_rate, true)],
      ["Expected Return", formatValue(result.expected_return, true)],
      ["Investment Period", `${formatNullable(result.period)} Years`],
      ["Target Wealth", formatValue(result.target_wealth)],
      ["SIP Amount", formatValue(result.sip_amount)],
      ["Invested Amount", formatValue(result.invested_amount)],
      ["Growth Amount", formatValue(result.growth_amount)],
    ],
  },
  "Lumpsum Target Calculator": {
    summaryRows: ({ result }) => [
      ["Target Amount", formatValue(result.target_amount)],
      ["Expected Return", formatValue(result.expected_return, true)],
      ["Investment Period", `${formatNullable(result.years)} Years`],
      ["Lumpsum Amount", formatValue(result.lumpsum_amount)],
    ],
  },
  "Become A Crorepati Calculator": {
    summaryRows: ({ result }) => [
      ["Current Age", formatNullable(result.current_age)],
      ["Retirement Age", formatNullable(result.retirement_age)],
      ["Wealth Amount", formatValue(result.wealth_amount)],
      ["Inflation Rate", formatValue(result.inflation_rate, true)],
      ["Expected Return", formatValue(result.expected_return, true)],
      ["Savings Amount", formatValue(result.savings_amount)],
      ["Target Wealth", formatValue(result.target_wealth)],
      ["Target Savings", formatValue(result.target_savings)],
      ["Target Amount", formatValue(result.target_amount)],
      ["Years", formatNullable(result.years)],
      ["Monthly Savings", formatValue(result.monthly_savings)],
      ["Invested Amount", formatValue(result.invested_amount)],
      ["Total Earnings", formatValue(result.total_earnings)],
    ],
  },
  "Retirement Planning Calculator": {
    summaryRows: ({ result }) => [
      ["Current Age", formatNullable(result.current_age)],
      ["Retirement Age", formatNullable(result.retirement_age)],
      ["Wealth Amount", formatValue(result.wealth_amount)],
      ["Inflation Rate", formatValue(result.inflation_rate, true)],
      ["Expected Return", formatValue(result.expected_return, true)],
      ["Savings Amount", formatValue(result.savings_amount)],
      ["Target Wealth", formatValue(result.target_wealth)],
      ["Target Savings", formatValue(result.target_savings)],
      ["Target Amount", formatValue(result.target_amount)],
      ["Years", formatNullable(result.years)],
      ["Monthly Savings", formatValue(result.monthly_savings)],
      ["Invested Amount", formatValue(result.invested_amount)],
      ["Total Earnings", formatValue(result.total_earnings)],
    ],
  },
  "Car Loan Calculator": {
    summaryRows: ({ result }) => [
      ["Loan Amount", formatValue(result.loan_amount)],
      ["Interest Rate", formatValue(result.interest_rate, true)],
      ["Loan Tenure Type", formatNullable(result.loan_tenure_type)],
      ["Loan Tenure", formatNullable(result.loan_tenure)],
      ["EMI", formatValue(result.emi)],
      ["Total Interest", formatValue(result.total_interest)],
      ["Total Amount", formatValue(result.total_amount)],
    ],
  },
  "Home Loan Calculator": {
    summaryRows: ({ result }) => [
      ["Loan Amount", formatValue(result.loan_amount)],
      ["Interest Rate", formatValue(result.interest_rate, true)],
      ["Loan Tenure Type", formatNullable(result.loan_tenure_type)],
      ["Loan Tenure", formatNullable(result.loan_tenure)],
      ["EMI", formatValue(result.emi)],
      ["Total Interest", formatValue(result.total_interest)],
      ["Total Amount", formatValue(result.total_amount)],
    ],
  },
  "Personal Loan EMI Calculator": {
    summaryRows: ({ result }) => [
      ["Loan Amount", formatValue(result.loan_amount)],
      ["Interest Rate", formatValue(result.interest_rate, true)],
      ["Loan Tenure Type", formatNullable(result.loan_tenure_type)],
      ["Loan Tenure", formatNullable(result.loan_tenure)],
      ["EMI", formatValue(result.emi)],
      ["Total Interest", formatValue(result.total_interest)],
      ["Total Amount", formatValue(result.total_amount)],
    ],
  },
  "Education Loan EMI Calculator": {
    summaryRows: ({ result }) => [
      ["Loan Amount", formatValue(result.loan_amount)],
      ["Interest Rate", formatValue(result.interest_rate, true)],
      ["Loan Tenure Type", formatNullable(result.loan_tenure_type)],
      ["Loan Tenure", formatNullable(result.loan_tenure)],
      ["EMI", formatValue(result.emi)],
      ["Total Interest", formatValue(result.total_interest)],
      ["Total Amount", formatValue(result.total_amount)],
    ],
  },
  "SWP Calculator": {
    summaryRows: ({ result }) => [
      ["Invested Amount", formatValue(result.invested_amount)],
      ["SWP Tenure", `${formatNullable(result.swp_tenure)} Years`],
      ["Total Withdrawal Amount", formatValue(result.total_withdrawal_amount)],
      ["Terminal Value", formatValue(result.terminal_value)],
    ],
  },
  "Future Value Calculator": {
    summaryRows: ({ result }) => [
      ["Current Cost", formatValue(result.current_cost)],
      ["Inflation Rate", formatValue(result.inflation_rate, true)],
      ["No of Years", formatNullable(result.no_years)],
      ["Future Amount", formatValue(result.future_amount)],
    ],
  },
  "Compounding Calculator": {
    summaryRows: ({ result }) => [
      ["Principal Amount", formatValue(result.principal_amount)],
      ["Interest Rate", formatValue(result.interest_rate, true)],
      ["Compound Interval", formatNullable(result.compound_interval)],
      ["Period", formatNullable(result.period)],
      ["Maturity Amount", formatValue(result.maturity_amount)],
    ],
  },
  "Children Education Planner": {
    summaryRows: ({ result }) => [
      ["Child 1 Name", formatNullable(result.child1_name)],
      ["Child 1 Current Age", formatNullable(result.child1_current_age)],
      ["Child 1 Education Age", formatNullable(result.child1_education_age)],
      ["Child 1 Education Amount", formatValue(result.child1_education_amount)],
      ["Inflation Rate", formatValue(result.inflation_rate, true)],
      ["Expected Return", formatValue(result.expected_return, true)],
      ["Total Education Amount", formatValue(result.total_education_amount)],
      [
        "Total Inflation Adjusted Amount",
        formatValue(result.total_inflation_adjust_education_amount),
      ],
      ["Total Monthly Savings", formatValue(result.total_monthly_savings)],
    ],
  },
  "Spending Less Calculator": {
    summaryRows: ({ result }) => [
      ["Current Age", formatNullable(result.current_age)],
      ["Retirement Age", formatNullable(result.retire_age)],
      [
        "Savings Interest Rate",
        formatValue(result.savings_interest_rate, true),
      ],
      ["Income Tax Rate", formatValue(result.income_tax_rate, true)],
      ["Inflation Rate", formatValue(result.inflation_rate, true)],
      ["Savings Amount", formatValue(result.savings_amount)],
      ["Years", formatNullable(result.years)],
      ["Savings Maturity Amount", formatValue(result.savings_maturity_amount)],
    ],
  },
};

export const getSimpleCalculatorReportDefinition = (activeTab: string) =>
  simpleDefinitions[activeTab as CalculatorTab];
