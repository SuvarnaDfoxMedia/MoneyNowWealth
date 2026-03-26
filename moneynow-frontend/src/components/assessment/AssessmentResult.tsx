"use client";

import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowRight,
  Download,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { pillarLabels } from "@/components/assessment/questions";

type ChartData = {
  savings_score: number;
  investment_score: number;
  protection_score: number;
  distribution_score: number;
};

type AssessmentResultData = {
  id: string;
  score: number;
  category: string;
  report: {
    wealth_creation: string;
    wealth_protection: string;
    wealth_restructuring: string;
    wealth_distribution: string;
  };
  chart_data?: ChartData;
  pdf_url?: string | null;
  next_step?: string;
};

interface AssessmentResultProps {
  result: AssessmentResultData;
  pdfHref: string | null;
}

const scoreBands = [
  { label: "Needs attention", min: 0, max: 39, color: "#E35D2F" },
  { label: "Average", min: 40, max: 54, color: "#F3A61C" },
  { label: "Good", min: 55, max: 69, color: "#78B943" },
  { label: "Strong", min: 70, max: 84, color: "#2FA28E" },
  { label: "Excellent", min: 85, max: 100, color: "#0F4C81" },
] as const;

const scoreTone: Record<string, string> = {
  "Needs Attention": "from-[#C2410C] to-[#FB923C]",
  Average: "from-[#B45309] to-[#FACC15]",
  Good: "from-[#0F766E] to-[#2DD4BF]",
  Excellent: "from-[#0F4C81] to-[#43B0F1]",
};

const reportCards = [
  {
    key: "wealth_creation",
    title: "Wealth creation",
    icon: Sparkles,
  },
  {
    key: "wealth_protection",
    title: "Wealth protection",
    icon: ShieldCheck,
  },
  {
    key: "wealth_restructuring",
    title: "Wealth restructuring",
    icon: FileText,
  },
  {
    key: "wealth_distribution",
    title: "Wealth distribution",
    icon: Download,
  },
] as const;

const PDF_BRAND_NAVY = [7, 42, 74] as const;
const PDF_BRAND_BLUE = [15, 76, 129] as const;
const PDF_BRAND_SKY = [94, 214, 255] as const;
const PDF_TEXT = [34, 52, 71] as const;

const formatScoreBand = (score: number) =>
  scoreBands.find((band) => score >= band.min && score <= band.max) ||
  scoreBands[2];

export default function AssessmentResult({
  result,
  pdfHref,
}: AssessmentResultProps) {
  const tone = scoreTone[result.category] || scoreTone.Good;
  const safeScore = Math.max(0, Math.min(100, Number(result.score) || 0));
  const activeBand =
    scoreBands.find((band) => safeScore >= band.min && safeScore <= band.max) ||
    scoreBands[2];

  const handleRichPdfDownload = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const generatedOn = new Date();

    const pillarRows = pillarLabels.map((pillar) => ({
      label: pillar.label,
      description: pillar.description,
      value: Math.max(
        0,
        Math.min(100, Number(result.chart_data?.[pillar.key] ?? 0)),
      ),
    }));

    doc.setFillColor(...PDF_BRAND_NAVY);
    doc.rect(0, 0, pageWidth, 104, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MoneyNow Financial Wellness Report", margin, 46);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      `Generated on ${generatedOn.toLocaleDateString("en-GB")} at ${generatedOn.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      )}`,
      margin,
      68,
    );
    doc.text(`Report ID: ${result.id}`, margin, 86);

    doc.setTextColor(...PDF_TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(result.category, margin, 142);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      doc.splitTextToSize(
        "This personalized report summarizes your current financial wellness score, your pillar-wise financial readiness, and the immediate recommendations generated from your assessment.",
        pageWidth - margin * 2,
      ),
      margin,
      162,
    );

    doc.setFillColor(246, 250, 253);
    doc.roundedRect(margin, 200, pageWidth - margin * 2, 92, 16, 16, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Score summary", margin + 18, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Overall score: ${safeScore}/100`, margin + 18, 246);
    doc.text(
      `Score band: ${formatScoreBand(safeScore).label}`,
      margin + 18,
      264,
    );
    doc.text(`Category: ${result.category}`, margin + 18, 282);

    const barX = margin + 220;
    const barY = 232;
    const barWidth = pageWidth - barX - margin - 18;
    const barHeight = 18;

    let currentX = barX;
    scoreBands.forEach((band) => {
      const width = (barWidth * (band.max - band.min + 1)) / 101;
      const [r, g, b] = [
        parseInt(band.color.slice(1, 3), 16),
        parseInt(band.color.slice(3, 5), 16),
        parseInt(band.color.slice(5, 7), 16),
      ];
      doc.setFillColor(r, g, b);
      doc.roundedRect(currentX, barY, width, barHeight, 8, 8, "F");
      currentX += width;
    });

    const markerX = barX + (barWidth * safeScore) / 100;
    doc.setDrawColor(...PDF_BRAND_NAVY);
    doc.setLineWidth(1.5);
    doc.line(markerX, barY - 24, markerX, barY + barHeight + 20);
    doc.setFillColor(...PDF_BRAND_NAVY);
    doc.roundedRect(markerX - 32, barY - 42, 64, 18, 9, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`${safeScore}`, markerX, barY - 29, { align: "center" });

    doc.setTextColor(110, 127, 145);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("0", barX, barY + 34);
    doc.text("25", barX + barWidth * 0.25, barY + 34, { align: "center" });
    doc.text("50", barX + barWidth * 0.5, barY + 34, { align: "center" });
    doc.text("75", barX + barWidth * 0.75, barY + 34, { align: "center" });
    doc.text("100", barX + barWidth, barY + 34, { align: "right" });

    autoTable(doc, {
      startY: 322,
      head: [["Recommendation area", "Guidance"]],
      body: reportCards.map(({ key, title }) => [title, result.report[key]]),
      theme: "grid",
      headStyles: { fillColor: [...PDF_BRAND_BLUE], textColor: 255 },
      styles: {
        fontSize: 10,
        cellPadding: 8,
        textColor: [...PDF_TEXT],
        valign: "top",
      },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: "bold" },
        1: { cellWidth: pageWidth - margin * 2 - 120 },
      },
      margin: { left: margin, right: margin },
    });

    let chartY = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY
      ? (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!
          .finalY + 28
      : 520;

    if (chartY > pageHeight - 210) {
      doc.addPage();
      chartY = 60;
    }

    doc.setTextColor(...PDF_TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Pillar-wise readiness chart", margin, chartY);

    const chartX = margin;
    const chartWidth = pageWidth - margin * 2;
    const trackWidth = chartWidth - 160;
    let rowY = chartY + 28;

    pillarRows.forEach((row) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(row.label, chartX, rowY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(96, 117, 136);
      doc.text(doc.splitTextToSize(row.description, 140), chartX, rowY + 14);

      const trackX = chartX + 150;
      const trackY = rowY - 8;
      doc.setFillColor(232, 239, 245);
      doc.roundedRect(trackX, trackY, trackWidth, 16, 8, 8, "F");

      doc.setFillColor(...PDF_BRAND_SKY);
      doc.roundedRect(
        trackX,
        trackY,
        Math.max((trackWidth * row.value) / 100, 10),
        16,
        8,
        8,
        "F",
      );

      doc.setTextColor(...PDF_BRAND_NAVY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        `${Math.round(row.value)}/100`,
        trackX + trackWidth + 8,
        rowY + 2,
      );

      rowY += 52;
    });

    if (rowY > pageHeight - 120) {
      doc.addPage();
      rowY = 60;
    }

    doc.setTextColor(...PDF_TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Next step", margin, rowY + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      doc.splitTextToSize(
        `Use this report as a starting point for discussion. ${result.next_step || "Book Discovery Call"} if you want help converting these insights into an action plan.`,
        pageWidth - margin * 2,
      ),
      margin,
      rowY + 28,
    );

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(222, 230, 238);
      doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);
      doc.setFontSize(9);
      doc.setTextColor(117, 132, 148);
      doc.text("MoneyNow Wealth", margin, pageHeight - 20);
      doc.text(
        `Page ${page} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 20,
        {
          align: "right",
        },
      );
    }

    doc.save(`Financial_Wellness_Report_${result.id}.pdf`);
  };

  return (
    <section className="font-poppins rounded-[28px] border border-[#D9E8F4] bg-white p-6 shadow-[0_18px_60px_rgba(6,36,68,0.08)] md:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[24px] bg-[#F6FAFD] p-6">
            <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-[#0F4C81]">
              Assessment outcome
            </p>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[32px] font-semibold leading-tight text-[#072A4A] md:text-[42px]">
                  {result.category}
                </h2>
                <p className="mt-2 max-w-[520px] text-[15px] leading-7 text-[#516275]">
                  Your current money habits show where you are today and what to
                  strengthen next. Use this as a practical starting point, not a
                  label.
                </p>
              </div>

              <div
                className={`min-w-[180px] rounded-[24px] bg-gradient-to-br ${tone} px-6 py-5 text-white`}
              >
                <p className="text-sm uppercase tracking-[0.24em] text-white/80">
                  Wellness score
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-[46px] font-semibold leading-none">
                    {safeScore}
                  </span>
                  <span className="pb-1 text-sm text-white/75">/100</span>
                </div>
                <p className="mt-2 text-[13px] text-white/80">
                  Score band: {activeBand.label}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[22px] border border-[#DCE8F1] bg-white px-4 py-5 md:px-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-[#0B3258]">
                    Your financial well-being score
                  </p>
                  <p className="text-[13px] leading-6 text-[#617487]">
                    A quick visual view of where your current result sits.
                  </p>
                </div>
                <div className="rounded-full bg-[#EAF5FD] px-4 py-2 text-[13px] font-semibold text-[#0F4C81]">
                  Category: {result.category}
                </div>
              </div>

              <div className="relative mt-8 px-1 pb-10 pt-12">
                <div className="flex h-[22px] overflow-hidden rounded-full shadow-inner">
                  {scoreBands.map((band) => (
                    <div
                      key={band.label}
                      className="h-full"
                      style={{
                        width: `${band.max - band.min + 1}%`,
                        backgroundColor: band.color,
                      }}
                    />
                  ))}
                </div>

                <div
                  className="absolute top-0 -translate-x-1/2"
                  style={{ left: `${safeScore}%` }}
                >
                  <div className="rounded-full bg-[#072A4A] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(7,42,74,0.18)]">
                    Your score: {safeScore}
                  </div>
                  <div className="mx-auto h-10 w-[2px] bg-[#072A4A]" />
                </div>

                <div className="mt-4 grid gap-3 text-[12px] text-[#5D7387] md:grid-cols-5">
                  {scoreBands.map((band) => (
                    <div
                      key={band.label}
                      className="rounded-[14px] bg-[#F7FBFE] px-3 py-2"
                    >
                      <p className="font-semibold text-[#163955]">
                        {band.label}
                      </p>
                      <p>
                        {band.min}-{band.max}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-0.5 text-[12px] text-[#708394]">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {reportCards.map(({ key, title, icon: Icon }) => (
              <article
                key={key}
                className="rounded-[20px] border border-[#E3EDF5] bg-[#FCFEFF] p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#E8F3FB] p-2 text-[#0F4C81]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-[18px] font-semibold text-[#0B3258]">
                    {title}
                  </h3>
                </div>
                <p className="mt-4 text-[15px] leading-7 text-[#556477]">
                  {result.report[key]}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] bg-[#072A4A] p-6 text-white">
            <p className="text-[13px] uppercase tracking-[0.24em] text-white/65">
              Four-pillar snapshot
            </p>
            <h3 className="mt-2 text-[24px] font-semibold leading-tight">
              See where your financial foundation is strongest
            </h3>

            <div className="mt-6 space-y-4">
              {pillarLabels.map((pillar) => {
                const value = Number(result.chart_data?.[pillar.key] ?? 0);
                const width = Math.max(8, Math.min(100, Math.round(value)));

                return (
                  <div key={pillar.key}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[15px] font-medium">
                          {pillar.label}
                        </p>
                        <p className="text-[13px] text-white/68">
                          {pillar.description}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#8FD3FF]">
                        {Math.round(value)}
                      </span>
                    </div>

                    <div className="mt-3 h-2.5 rounded-full bg-white/15">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-[#5ED6FF] to-[#C3F1FF]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#DCE8F1] bg-[#F7FBFE] p-6">
            <h3 className="text-[22px] font-semibold text-[#0B3258]">
              What to do next
            </h3>
            <p className="mt-3 text-[15px] leading-7 text-[#556477]">
              Review your report, save the PDF, and speak with an advisor if you
              want help turning these insights into an action plan.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {/* {pdfHref ? (
                <a
                  href={pdfHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#0F4C81] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0B3258]"
                >
                  <Download className="h-4 w-4" />
                  Open report PDF
                </a>
              ) : null} */}

              <button
                type="button"
                onClick={handleRichPdfDownload}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#0F4C81] bg-white px-5 py-3 text-[15px] font-semibold text-[#0F4C81] transition hover:bg-[#EAF5FD]"
              >
                <Download className="h-4 w-4" />
                Download report
              </button>

              <Link
                href="/contact-us"
                className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#0F4C81] px-5 py-3 text-[15px] font-semibold text-[#0F4C81] transition hover:bg-[#EAF5FD]"
              >
                {result.next_step || "Book Discovery Call"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
