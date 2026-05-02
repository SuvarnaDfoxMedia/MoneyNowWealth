"use client";

import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import type { RefObject } from "react";
import type { CalculatorTab } from "@/hooks/useCalculator";
import type { StartSipResult, StartSipValues } from "@/stores/startSipStore";
import { formatCurrency } from "@/lib/reports/formatters";
import { getStartSipReportDefinition } from "@/lib/reports/startSipReportDefinitions";
import {
  addFooterToAllPages,
  BODY_TEXT,
  BORDER,
  BRAND_BLUE,
  BRAND_GREEN,
  BRAND_NAVY,
  CANVAS_FONT_STACK,
  captureChartImage,
  formatGeneratedTimestamp,
  getTextBlockHeight,
  JsPdfWithGState,
  loadImageAsDataUrl,
  PDF_FONT_FAMILY,
  splitText,
  SURFACE,
} from "@/lib/pdf/shared";

const disclaimerLines = [
  "We have gathered all the data, information, statistics from the sources believed to be highly reliable and true. All necessary precautions have been taken to avoid any error, lapse or insufficiency; however, no representations or warranties are made (express or implied) as to the reliability, accuracy or completeness of such information. We cannot be held liable for any loss arising directly or indirectly from the use of, or any action taken in on, any information appearing herein. The user is advised to verify the contents of the report independently. It is not an investment recommendation or personal financial, investment or professional advice and should not be treated as such.",
  "The Risk Level of any of the schemes must always be commensurate with the risk profile, investment objective or financial goals of the investor concerned. Therefore, the Investors should assess their risk profile before making any investment decision and consider the asset allocation accordingly.",
  "Returns less than 1 year are in absolute (%) and greater than 1 year are compounded annualised (CAGR %). SIP returns are shown in XIRR (%).",
  "Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Past performance may or may not be sustained.",
];

const createSipDistributionChart = async ({
  invested,
  growth,
}: {
  invested: number;
  growth: number;
}) => {
  const total = Math.max(invested + growth, 1);
  const size = 520;
  const center = size / 2;
  const outerRadius = 170;
  const innerRadius = 92;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas not available");
  }

  context.clearRect(0, 0, size, size);
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, size, size);

  const slices = [
    { value: invested, color: "#2D6AE3" },
    { value: growth, color: "#5AB85C" },
  ].filter((item) => item.value > 0);

  let startAngle = -Math.PI / 2;
  slices.forEach((slice) => {
    const sliceAngle = (slice.value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, outerRadius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = slice.color;
    context.fill();

    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, innerRadius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = "#FFFFFF";
    context.fill();

    startAngle = endAngle;
  });

  context.beginPath();
  context.arc(center, center, innerRadius - 2, 0, Math.PI * 2);
  context.fillStyle = "#FFFFFF";
  context.fill();

  context.fillStyle = "#6B7280";
  context.font = `600 22px ${CANVAS_FONT_STACK}`;
  context.textAlign = "center";
  context.fillText("Total SIP", center, center - 12);

  context.fillStyle = "#111827";
  context.font = `700 28px ${CANVAS_FONT_STACK}`;
  context.fillText(
    formatCurrency(total).replace("Rs. ", "Rs "),
    center,
    center + 24,
  );

  return canvas.toDataURL("image/png");
};

interface StartSipReportOptions {
  activeTab: CalculatorTab;
  result: StartSipResult;
  values: StartSipValues;
  barChartRef?: RefObject<HTMLDivElement | null>;
  chartType?: "sip" | "goal" | null;
}

export const downloadStartSipReport = async ({
  activeTab,
  result,
  values,
  barChartRef,
  chartType = null,
}: StartSipReportOptions) => {
  const definition = getStartSipReportDefinition(activeTab);
  const context = { activeTab, result, values };
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
  doc.setFont(PDF_FONT_FAMILY, "bold");
  doc.setFontSize(18);
  doc.text("SIP Investment Report", 40, 75);

  doc.setFont(PDF_FONT_FAMILY, "normal");
  doc.setFontSize(10);
  doc.text(formatGeneratedTimestamp(generatedOn), pageWidth - 180, 75);

  const reportTitle = definition.title(context);

  doc.setTextColor(...BODY_TEXT);
  doc.setFont(PDF_FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text(reportTitle, 40, 150);

  doc.setFont(PDF_FONT_FAMILY, "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    splitText(
      doc,
      "A structured summary of your SIP inputs, projected returns, and portfolio growth insights.",
      pageWidth - 80,
    ),
    40,
    168,
  );

  definition.highlightCards(context).forEach((card, index) => {
    const x = 40 + index * 170;
    const y = 190;
    const width = 155;
    const height = 70;

    doc.setFillColor(0, 0, 0);
    doc.setGState(new (doc as JsPdfWithGState).GState({ opacity: 0.08 }));
    doc.roundedRect(x + 4, y + 4, width, height, 10, 10, "F");

    doc.setGState(new (doc as JsPdfWithGState).GState({ opacity: 1 }));
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230);
    doc.roundedRect(x, y, width, height, 10, 10, "FD");

    doc.setTextColor(40, 40, 40);
    doc.setFont(PDF_FONT_FAMILY, "normal");
    doc.setFontSize(10);
    doc.text(card.label.toUpperCase(), x + 12, y + 20);

    doc.setFont(PDF_FONT_FAMILY, "bold");
    doc.setFontSize(index === 0 ? 10 : 13);
    doc.text(splitText(doc, card.value, 130), x + 12, y + 40);
  });

  autoTable(doc, {
    startY: 290,
    head: [["Input Details", "Value"]],
    body: definition.inputRows(context),
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 8, font: PDF_FONT_FAMILY },
    headStyles: { fillColor: [...BRAND_BLUE], textColor: 255, font: PDF_FONT_FAMILY },
    margin: { left: 40, right: 40 },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [["Projected Result", "Amount"]],
    body: definition.summaryRows(context),
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 8, font: PDF_FONT_FAMILY },
    headStyles: {
      fillColor: [...BRAND_GREEN],
      textColor: 255,
      font: PDF_FONT_FAMILY,
    },
    margin: { left: 40, right: 40 },
  });

  let sectionY = (doc as any).lastAutoTable.finalY + 30;

  if (barChartRef?.current) {
    const chartImage = await captureChartImage(barChartRef.current);
    const margin = 40;
    const width = pageWidth - margin * 2;
    const height = width * (chartImage.height / chartImage.width);

    if (sectionY + height + 50 > pageHeight) {
      doc.addPage();
      sectionY = 50;
    }

    doc.setFont(PDF_FONT_FAMILY, "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BODY_TEXT);
    doc.text(
      chartType === "goal" ? "Target Projection" : "Growth Projection",
      pageWidth / 2,
      sectionY,
      { align: "center" },
    );
    doc.addImage(chartImage.image, "PNG", margin, sectionY + 15, width, height);
    sectionY += height + 50;
  }

  if (chartType === "sip") {
    const invested = Number(
      result.invested_amount || result.stepup_invested_amount || 0,
    );
    const growth = Number(
      result.growth_amount ||
        result.growth_value ||
        result.stepup_growth_value ||
        result.total_earnings ||
        0,
    );
    const total = invested + growth;

    if (total) {
      const chartImage = await createSipDistributionChart({ invested, growth });
      const chartWidth = 210;
      const chartHeight = 210;
      const chartX = 52;
      const contentX = 286;
      const contentWidth = pageWidth - contentX - 52;
      const introLines = splitText(
        doc,
        "A compact distribution view showing how much of the projected corpus comes from contributions versus growth.",
        pageWidth - 80,
      );
      const introHeight = getTextBlockHeight(introLines, 12);

      const infoItems = [
        {
          label: "Invested Amount",
          value: formatCurrency(invested),
          description:
            "Shows the total contribution built up across the selected time period.",
          color: "#2D6AE3",
        },
        {
          label: "Growth",
          value: formatCurrency(growth),
          description:
            "Shows the returns earned on top of the invested SIP amount.",
          color: "#5AB85C",
        },
        {
          label: "Total SIP Value",
          value: formatCurrency(total),
          description:
            "Shows the combined future value of invested amount plus growth.",
          color: "#FB923C",
        },
      ].map((item) => {
        const descriptionLines = splitText(doc, item.description, contentWidth - 56);
        const descriptionHeight = getTextBlockHeight(descriptionLines, 11);
        const boxHeight = Math.max(58, 18 + 16 + descriptionHeight + 16);

        return { ...item, descriptionLines, boxHeight };
      });

      const infoContentHeight =
        infoItems.reduce((sum, item) => sum + item.boxHeight, 0) +
        (infoItems.length - 1) * 12;
      const contentHeight = Math.max(chartHeight, infoContentHeight);
      const sectionHeight = 34 + Math.max(18 + introHeight, 30) + contentHeight + 24;

      if (sectionY + sectionHeight + 30 > pageHeight) {
        doc.addPage();
        sectionY = 50;
      }

      doc.setFont(PDF_FONT_FAMILY, "bold");
      doc.setFontSize(13);
      doc.setTextColor(...BODY_TEXT);
      doc.text("Invested Amount vs Growth", 40, sectionY);

      doc.setFont(PDF_FONT_FAMILY, "normal");
      doc.setFontSize(10);
      doc.setTextColor(95, 99, 104);
      doc.text(introLines, 40, sectionY + 18);

      const cardY = sectionY + 34;
      doc.setFillColor(...SURFACE);
      doc.setDrawColor(...BORDER);
      doc.roundedRect(40, cardY, pageWidth - 80, sectionHeight, 12, 12, "FD");

      const contentTop = cardY + 20;
      doc.addImage(chartImage, "PNG", chartX, contentTop + 10, chartWidth, chartHeight);

      let itemY = contentTop;
      infoItems.forEach((item) => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...BORDER);
        doc.roundedRect(contentX, itemY, contentWidth, item.boxHeight, 10, 10, "FD");

        doc.setFillColor(
          parseInt(item.color.slice(1, 3), 16),
          parseInt(item.color.slice(3, 5), 16),
          parseInt(item.color.slice(5, 7), 16),
        );
        doc.circle(contentX + 14, itemY + 16, 5, "F");

        doc.setFont(PDF_FONT_FAMILY, "bold");
        doc.setFontSize(11);
        doc.setTextColor(...BODY_TEXT);
        doc.text(item.label, contentX + 28, itemY + 19);

        doc.setFont(PDF_FONT_FAMILY, "bold");
        doc.setFontSize(12);
        doc.text(item.value, contentX + 28, itemY + 37);

        doc.setFont(PDF_FONT_FAMILY, "normal");
        doc.setFontSize(9);
        doc.setTextColor(95, 99, 104);
        doc.text(item.descriptionLines, contentX + 28, itemY + 54);

        itemY += item.boxHeight + 12;
      });

      sectionY += sectionHeight + 54;
    }
  }

  doc.addPage();
  doc.setFillColor(...BRAND_NAVY);
  doc.rect(0, 0, pageWidth, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(PDF_FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Disclaimer", 40, 50);

  const startDisclaimerBody = (title = "Disclaimer (cont.)") => {
    if (title !== "Disclaimer") {
      doc.setFillColor(...BRAND_NAVY);
      doc.rect(0, 0, pageWidth, 80, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont(PDF_FONT_FAMILY, "bold");
      doc.setFontSize(16);
      doc.text(title, 40, 50);
    }

    doc.setFillColor(...SURFACE);
    doc.roundedRect(40, 110, pageWidth - 80, pageHeight - 170, 12, 12, "F");
    doc.setTextColor(...BODY_TEXT);
    doc.setFont(PDF_FONT_FAMILY, "normal");
    doc.setFontSize(11);
    return 140;
  };

  let bodyY = startDisclaimerBody("Disclaimer");

  disclaimerLines.forEach((line) => {
    const split = splitText(doc, line, pageWidth - 120);
    const blockHeight = getTextBlockHeight(split, 16) + 10;

    if (bodyY + blockHeight > pageHeight - 70) {
      doc.addPage();
      bodyY = startDisclaimerBody();
    }

    doc.text(split, 60, bodyY);
    bodyY += blockHeight;
  });

  addFooterToAllPages(doc, pageWidth, pageHeight);
  doc.save(`${reportTitle.replace(/\s+/g, "_")}_Report.pdf`);
};
