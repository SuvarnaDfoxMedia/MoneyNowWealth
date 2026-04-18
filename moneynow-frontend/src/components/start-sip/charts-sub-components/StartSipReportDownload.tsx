

"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RefObject } from "react";
import type { CalculatorTab } from "@/hooks/useCalculator";
import { START_SIP_CALCULATORS } from "@/stores/startSipStore";

type StartSipValues = {
  sip_amount: number;
  expected_return: number;
  years: number;
  inflation_rate: number;
  wealth_amount: number;
  current_age: number;
  retirement_age: number;
  savings_amount: number;
  sip_stepup_value: number;
};

type StepUpBreakdownRow = {
  year?: number;
  sip_amount_per_month?: number;
  invested_amount_per_year?: number;
  total_invested_amount?: number;
};

type StartSipResult = Partial<{
  invested_amount: number;
  growth_value: number;
  maturity_amount: number;
  stepup_invested_amount: number;
  stepup_growth_value: number;
  stepup_maturity_amount: number;
  target_wealth: number;
  sip_amount: number;
  growth_amount: number;
  target_amount: number;
  monthly_savings: number;
  total_earnings: number;
  years: number;
  list: StepUpBreakdownRow[];
}>;

type JsPdfWithGState = jsPDF & {
  GState: new (options: { opacity: number }) => unknown;
};

interface StartSipReportDownloadProps {
  activeTab: CalculatorTab | "";
  result: StartSipResult | null;
  values: StartSipValues;
  barChartRef?: RefObject<HTMLDivElement | null>;
  pieChartRef?: RefObject<HTMLDivElement | null>;
  chartType?: "sip" | "goal" | null;
  disabled?: boolean;
  className?: string;
}

const BRAND_NAVY = [6, 28, 68] as const;
const BRAND_BLUE = [11, 75, 138] as const;
const BRAND_GOLD = [234, 177, 74] as const;
const BRAND_GREEN = [52, 168, 83] as const;
const SURFACE = [245, 248, 252] as const;
const BORDER = [220, 226, 236] as const;
const BODY_TEXT = [39, 39, 42] as const;

const formatCurrency = (value?: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatPercent = (value?: number) =>
  `${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}%`;

const disclaimerLines = [
  "We have gathered all the data, information, statistics from the sources believed to be highly reliable and true. All necessary precautions have been taken to avoid any error, lapse or insufficiency; however, no representations or warranties are made (express or implied) as to the reliability, accuracy or completeness of such information. We cannot be held liable for any loss arising directly or indirectly from the use of, or any action taken in on, any information appearing herein. The user is advised to verify the contents of the report independently. It is not an investment recommendation or personal financial, investment or professional advice and should not be treated as such.",
  "The Risk Level of any of the schemes must always be commensurate with the risk profile, investment objective or financial goals of the investor concerned. Therefore, the Investors should assess their risk profile before making any investment decision and consider the asset allocation accordingly.",
  "Returns less than 1 year are in absolute (%) and greater than 1 year are compounded annualised (CAGR %). SIP returns are shown in XIRR (%).",
  "Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Past performance may or may not be sustained.",
];

const getCalculatorTitle = (activeTab: CalculatorTab) =>
  START_SIP_CALCULATORS.find((item) => item.tab === activeTab)?.title ||
  activeTab;

const buildInputRows = (
  activeTab: CalculatorTab,
  values: StartSipValues,
): [string, string][] => {
  switch (activeTab) {
    case "SIP Calculator":
      return [
        ["Monthly SIP Amount", formatCurrency(values.sip_amount)],
        ["Investment Duration", `${values.years} years`],
        ["Expected Return", formatPercent(values.expected_return)],
      ];
    case "SIP with Annual Increase":
      return [
        ["Monthly SIP Amount", formatCurrency(values.sip_amount)],
        ["Investment Duration", `${values.years} years`],
        ["Expected Return", formatPercent(values.expected_return)],
        ["Annual Step Up", formatPercent(values.sip_stepup_value)],
      ];
    case "Target Amount SIP Calculator":
      return [
        ["Target Amount", formatCurrency(values.wealth_amount)],
        ["Investment Duration", `${values.years} years`],
        ["Expected Return", formatPercent(values.expected_return)],
        ["Inflation Rate", formatPercent(values.inflation_rate)],
      ];
    case "Become A Crorepati Calculator":
      return [
        ["Current Age", `${values.current_age} years`],
        ["Target Age", `${values.retirement_age} years`],
        ["Expected Return", formatPercent(values.expected_return)],
        ["Inflation Rate", formatPercent(values.inflation_rate)],
        ["Current Savings", formatCurrency(values.savings_amount)],
      ];
    default:
      return [];
  }
};

const buildSummaryRows = (
  activeTab: CalculatorTab,
  values: StartSipValues,
  result: StartSipResult,
): [string, string][] => {
  switch (activeTab) {
    case "SIP with Annual Increase":
      return [
        [
          "Total SIP Amount Invested",
          formatCurrency(
            result.stepup_invested_amount || result.invested_amount,
          ),
        ],
        [
          "Total Growth",
          formatCurrency(result.stepup_growth_value || result.growth_value),
        ],
        [
          "Future Value",
          formatCurrency(
            result.stepup_maturity_amount || result.maturity_amount,
          ),
        ],
      ];
    case "Target Amount SIP Calculator":
      return [
        [
          "Target Wealth",
          formatCurrency(result.target_wealth || values.wealth_amount),
        ],
        ["Required SIP Amount", formatCurrency(result.sip_amount)],
        ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.growth_amount)],
      ];
    case "Become A Crorepati Calculator":
      return [
        [
          "Target Corpus",
          formatCurrency(result.target_amount || result.target_wealth),
        ],
        ["Monthly Savings Required", formatCurrency(result.monthly_savings)],
        ["Total Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.total_earnings)],
      ];
    default:
      return [
        ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Growth", formatCurrency(result.growth_value)],
        ["Future Value", formatCurrency(result.maturity_amount)],
      ];
  }
};

const buildHighlightCards = (
  activeTab: CalculatorTab,
  values: StartSipValues,
  result: StartSipResult,
) => {
  const horizon =
    activeTab === "Become A Crorepati Calculator"
      ? Math.max(0, values.retirement_age - values.current_age)
      : values.years;

  return [
    {
      label: "Calculator",
      value: getCalculatorTitle(activeTab),
      fill: BRAND_NAVY,
    },
    {
      label: "Time Horizon",
      value: `${horizon || result.years || 0} years`,
      fill: BRAND_BLUE,
    },
    {
      label: "Projected Outcome",
      value:
        activeTab === "Become A Crorepati Calculator"
          ? formatCurrency(result.target_amount || result.target_wealth)
          : formatCurrency(
              result.stepup_maturity_amount ||
                result.maturity_amount ||
                result.target_wealth,
            ),
      fill: BRAND_GREEN,
    },
  ];
};

const sanitizeClone = (clonedDoc: Document) => {
  clonedDoc.querySelectorAll("*").forEach((node) => {
    const element = node as HTMLElement;
    const style = clonedDoc.defaultView?.getComputedStyle(element);
    if (!style) return;

    const normalizeColor = (value: string, fallback: string) =>
      value.includes("oklch") || value.includes("lab") ? fallback : value;

    element.style.color = normalizeColor(style.color, "#000000");
    element.style.backgroundColor = normalizeColor(
      style.backgroundColor,
      "#ffffff",
    );
    element.style.borderColor = normalizeColor(style.borderColor, "#d1d5db");

    ["fill", "stroke"].forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (current && (current.includes("oklch") || current.includes("lab"))) {
        element.setAttribute(attribute, "#000000");
      }
    });
  });
};

const loadImageAsDataUrl = (src: string) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Canvas not available"));
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });

export default function StartSipReportDownload({
  activeTab,
  result,
  values,
  barChartRef,
  pieChartRef,
  chartType = null,
  disabled = false,
  className = "",
}: StartSipReportDownloadProps) {

// // Description
  // doc.setFont("helvetica", "normal");
  // doc.setFontSize(11);
  // doc.text(
  //   doc.splitTextToSize(
  //     "This report summarises your SIP calculator inputs, projected outputs, and visual breakdown for quick review and sharing.",
  //     pageWidth - 80,
  //   ),
  //   40,
  //   178,
  // );

//   doc.text(
  //     doc.splitTextToSize(card.value, 126),
  //     x + 14,
  //     249
  //   );
  // });

const handleDownload = async () => {
    if (!activeTab || !result) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const generatedOn = new Date();

    doc.setFillColor(...BRAND_NAVY);
    doc.rect(0, 0, pageWidth, 110, "F");

    try {
      const logo = await loadImageAsDataUrl("/images/money-now-logo-2.png");
      doc.addImage(logo, "PNG", 40, 25, 120, 30);
    } catch {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("MoneyNow Wealth", 40, 50);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SIP Investment Report", 40, 75);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `${generatedOn.toLocaleDateString("en-GB")} • ${generatedOn.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      )}`,
      pageWidth - 180,
      75,
    );

    const reportTitle = getCalculatorTitle(activeTab);

    doc.setTextColor(...BODY_TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(reportTitle, 40, 150);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      doc.splitTextToSize(
        "A structured summary of your SIP inputs, projected returns, and portfolio growth insights.",
        pageWidth - 80,
      ),
      40,
      168,
    );

    const cards = buildHighlightCards(activeTab, values, result);

    cards.forEach((card, index) => {
      const x = 40 + index * 170;
      const y = 190;
      const width = 155;
      const height = 70;

      /* ===============================
     SHADOW (FAKE - OFFSET RECT)
  =============================== */
      doc.setFillColor(0, 0, 0); // black shadow
      doc.setGState(
        new (doc as JsPdfWithGState).GState({ opacity: 0.08 }),
      ); // light opacity

      doc.roundedRect(x + 4, y + 4, width, height, 10, 10, "F");

      /* ===============================
     MAIN CARD (WHITE)
  =============================== */
      doc.setGState(new (doc as JsPdfWithGState).GState({ opacity: 1 })); // reset opacity
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(230); // light border

      doc.roundedRect(x, y, width, height, 10, 10, "FD");

      /* ===============================
     TEXT
  =============================== */
      doc.setTextColor(40, 40, 40);

      // Label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(card.label.toUpperCase(), x + 12, y + 20);

      // Value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(index === 0 ? 10 : 13);
      doc.text(doc.splitTextToSize(card.value, 130), x + 12, y + 40);
    });

    const inputRows = buildInputRows(activeTab, values);
    const summaryRows = buildSummaryRows(activeTab, values, result);

    autoTable(doc, {
      startY: 290,
      head: [["Input Details", "Value"]],
      body: inputRows,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 8 },
      headStyles: { fillColor: [...BRAND_BLUE], textColor: 255 },
      margin: { left: 40, right: 40 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Projected Result", "Amount"]],
      body: summaryRows,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 8 },
      headStyles: { fillColor: [...BRAND_GREEN], textColor: 255 },
      margin: { left: 40, right: 40 },
    });

    let sectionY = (doc as any).lastAutoTable.finalY + 30;

    const addChart = async (
      title: string,
      ref?: RefObject<HTMLDivElement | null>,
    ) => {
      if (!ref?.current) return;

      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: sanitizeClone,
      });

      const img = canvas.toDataURL("image/png");
      const ratio = canvas.height / canvas.width;

      const margin = 40;

      // ✅ FULL WIDTH (clean layout)
      const width = pageWidth - margin * 2;
      const height = width * ratio;

      const x = margin;

      // Page break
      if (sectionY + height + 50 > pageHeight) {
        doc.addPage();
        sectionY = 50;
      }

      /* ===============================
     TITLE (CENTERED)
  =============================== */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...BODY_TEXT);
      doc.text(title, pageWidth / 2, sectionY, { align: "center" });

      /* ===============================
     IMAGE (NO BORDER / CLEAN)
  =============================== */
      doc.addImage(img, "PNG", x, sectionY + 15, width, height);

      sectionY += height + 50;
    };

    await addChart(
      chartType === "goal" ? "Target Projection" : "Growth Projection",
      barChartRef,
    );

    if (chartType === "sip") {
      await addChart("Corpus Distribution", pieChartRef);
    }

    doc.addPage();

    doc.setFillColor(...BRAND_NAVY);
    doc.rect(0, 0, pageWidth, 80, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Disclaimer", 40, 50);

    doc.setFillColor(245, 248, 252);
    doc.roundedRect(40, 110, pageWidth - 80, 240, 12, 12, "F");

    doc.setTextColor(...BODY_TEXT);
    doc.setFontSize(11);

    let y = 140;
    disclaimerLines.forEach((line) => {
      const split = doc.splitTextToSize(line, pageWidth - 120);
      doc.text(split, 60, y);
      y += split.length * 16 + 10;
    });

    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setDrawColor(220);
      doc.line(40, pageHeight - 40, pageWidth - 40, pageHeight - 40);

      doc.setFontSize(9);
      doc.setTextColor(120);

      doc.text("MoneyNow Wealth", 40, pageHeight - 25);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 100, pageHeight - 25);
    }

    doc.save(`${reportTitle.replace(/\s+/g, "_")}_Report.pdf`);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || !activeTab || !result}
      className={`${className} cursor-pointer text-white disabled:cursor-not-allowed disabled:bg-slate-400`}
    >
      Download Report
    </button>
  );
}
