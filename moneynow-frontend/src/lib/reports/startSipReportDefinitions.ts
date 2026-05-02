import type { CalculatorTab } from "@/hooks/useCalculator";
import {
  START_SIP_CALCULATORS,
  type StartSipResult,
  type StartSipValues,
} from "@/stores/startSipStore";
import { formatCurrency, formatPercent } from "@/lib/reports/formatters";

export type PdfRgbColor = readonly [number, number, number];
export type ReportRow = [string, string];
export type ReportHighlightCard = {
  label: string;
  value: string;
  fill: PdfRgbColor;
};

export interface StartSipReportContext {
  activeTab: CalculatorTab;
  values: StartSipValues;
  result: StartSipResult;
}

export interface StartSipReportDefinition {
  title: (context: StartSipReportContext) => string;
  inputRows: (context: StartSipReportContext) => ReportRow[];
  summaryRows: (context: StartSipReportContext) => ReportRow[];
  highlightCards: (context: StartSipReportContext) => ReportHighlightCard[];
}

const BRAND_NAVY = [6, 28, 68] as const;
const BRAND_BLUE = [11, 75, 138] as const;
const BRAND_GREEN = [52, 168, 83] as const;

const getCalculatorTitle = (activeTab: CalculatorTab) =>
  START_SIP_CALCULATORS.find((item) => item.tab === activeTab)?.title ||
  activeTab;

const getHorizon = ({ activeTab, values, result }: StartSipReportContext) =>
  activeTab === "Become A Crorepati Calculator"
    ? Math.max(0, values.retirement_age - values.current_age)
    : values.years || result.years || 0;

const getProjectedOutcome = ({ activeTab, result }: StartSipReportContext) =>
  activeTab === "Become A Crorepati Calculator"
    ? formatCurrency(result.target_amount || result.target_wealth)
    : formatCurrency(
        result.stepup_maturity_amount ||
          result.maturity_amount ||
          result.target_wealth,
      );

const createSharedHighlightCards = (
  context: StartSipReportContext,
): ReportHighlightCard[] => [
  {
    label: "Calculator",
    value: getCalculatorTitle(context.activeTab),
    fill: BRAND_NAVY,
  },
  {
    label: "Time Horizon",
    value: `${getHorizon(context)} years`,
    fill: BRAND_BLUE,
  },
  {
    label: "Projected Outcome",
    value: getProjectedOutcome(context),
    fill: BRAND_GREEN,
  },
];

const startSipDefinitions: Partial<
  Record<CalculatorTab, StartSipReportDefinition>
> = {
  "SIP Calculator": {
    title: ({ activeTab }) => getCalculatorTitle(activeTab),
    inputRows: ({ values }) => [
      ["Monthly SIP Amount", formatCurrency(values.sip_amount)],
      ["Investment Duration", `${values.years} years`],
      ["Expected Return", formatPercent(values.expected_return)],
    ],
    summaryRows: ({ result }) => [
      ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
      ["Total Growth", formatCurrency(result.growth_value)],
      ["Future Value", formatCurrency(result.maturity_amount)],
    ],
    highlightCards: createSharedHighlightCards,
  },
  "SIP with Annual Increase": {
    title: ({ activeTab }) => getCalculatorTitle(activeTab),
    inputRows: ({ values }) => [
      ["Monthly SIP Amount", formatCurrency(values.sip_amount)],
      ["Investment Duration", `${values.years} years`],
      ["Expected Return", formatPercent(values.expected_return)],
      ["Annual Step Up", formatPercent(values.sip_stepup_value)],
    ],
    summaryRows: ({ result }) => [
      [
        "Total SIP Amount Invested",
        formatCurrency(result.stepup_invested_amount || result.invested_amount),
      ],
      [
        "Total Growth",
        formatCurrency(result.stepup_growth_value || result.growth_value),
      ],
      [
        "Future Value",
        formatCurrency(result.stepup_maturity_amount || result.maturity_amount),
      ],
    ],
    highlightCards: createSharedHighlightCards,
  },
  "Target Amount SIP Calculator": {
    title: ({ activeTab }) => getCalculatorTitle(activeTab),
    inputRows: ({ values }) => [
      ["Target Amount", formatCurrency(values.wealth_amount)],
      ["Investment Duration", `${values.years} years`],
      ["Expected Return", formatPercent(values.expected_return)],
      ["Inflation Rate", formatPercent(values.inflation_rate)],
    ],
    summaryRows: ({ values, result }) => [
      ["Target Wealth", formatCurrency(result.target_wealth || values.wealth_amount)],
      ["Required SIP Amount", formatCurrency(result.sip_amount)],
      ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
      ["Total Growth", formatCurrency(result.growth_amount)],
    ],
    highlightCards: createSharedHighlightCards,
  },
  "Become A Crorepati Calculator": {
    title: ({ activeTab }) => getCalculatorTitle(activeTab),
    inputRows: ({ values }) => [
      ["Current Age", `${values.current_age} years`],
      ["Target Age", `${values.retirement_age} years`],
      ["Expected Return", formatPercent(values.expected_return)],
      ["Inflation Rate", formatPercent(values.inflation_rate)],
      ["Current Savings", formatCurrency(values.savings_amount)],
    ],
    summaryRows: ({ result }) => [
      ["Target Corpus", formatCurrency(result.target_amount || result.target_wealth)],
      ["Monthly Savings Required", formatCurrency(result.monthly_savings)],
      ["Total Amount Invested", formatCurrency(result.invested_amount)],
      ["Total Growth", formatCurrency(result.total_earnings)],
    ],
    highlightCards: createSharedHighlightCards,
  },
};

export const getStartSipReportDefinition = (activeTab: CalculatorTab) => {
  const definition = startSipDefinitions[activeTab];

  if (!definition) {
    throw new Error(`No Start SIP report definition found for "${activeTab}"`);
  }

  return definition;
};
