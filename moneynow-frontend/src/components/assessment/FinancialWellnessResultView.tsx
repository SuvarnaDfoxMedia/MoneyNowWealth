"use client";

import { Download } from "lucide-react";

type PillarStatus =
  | "Needs attention"
  | "Could be strengthened"
  | "On a reasonable track";

type PillarResult = {
  key: string;
  title: string;
  status: PillarStatus;
  score: number;
  copy: string;
};

interface FinancialWellnessResultViewProps {
  result: {
    id: string;
    score: number;
    category: string;
    summary: string;
    pillar_results: PillarResult[];
    next_step?: string;
  };
}

const scoreBands = [
  { label: "Needs attention", range: "0-39", color: "#F05A28", width: 39 },
  { label: "Could be strengthened", range: "40-69", color: "#FDB72B", width: 30 },
  { label: "On a reasonable track", range: "70-100", color: "#39B99E", width: 31 },
] as const;

const statusStyles: Record<PillarStatus, string> = {
  "Needs attention": "border-[#F0B8B8] bg-[#FFF6F6] text-[#A64141]",
  "Could be strengthened": "border-[#F0D28D] bg-[#FFF9E9] text-[#805C04]",
  "On a reasonable track": "border-[#3BD169] bg-[#ECFFF3] text-[#0DBA45]",
};

const getScoreCardTone = (score: number) => {
  if (score <= 39) {
    return "from-[#D84A1B] to-[#F47A42] shadow-[0_14px_32px_rgba(216,74,27,0.2)]";
  }

  if (score <= 69) {
    return "from-[#F09A14] to-[#FDB72B] shadow-[0_14px_32px_rgba(240,154,20,0.22)]";
  }

  return "from-[#159E99] to-[#32C5B3] shadow-[0_14px_32px_rgba(22,158,153,0.2)]";
};

export default function FinancialWellnessResultView({
  result,
}: FinancialWellnessResultViewProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(result.score || 0)));
  const scoreCardTone = getScoreCardTone(safeScore);

  const handleDownload = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 44;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 54;

    doc.setFillColor(5, 47, 86);
    doc.rect(0, 0, pageWidth, 116, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MoneyNow Financial Wellness Result", margin, y);
    y += 30;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Score: ${safeScore}/100`, margin, y);
    doc.text(`Category: ${result.category}`, margin + 130, y);

    y = 154;
    doc.setTextColor(10, 23, 48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(result.category, margin, y);

    y += 26;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(78, 91, 112);
    doc.text(doc.splitTextToSize(result.summary, pageWidth - margin * 2), margin, y);
    y += 74;

    result.pillar_results.forEach((pillar) => {
      if (y > 700) {
        doc.addPage();
        y = 54;
      }

      doc.setTextColor(10, 23, 48);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(pillar.title, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(78, 91, 112);
      doc.text(`${pillar.status} | Snapshot score: ${pillar.score} / 3`, margin, y + 17);
      doc.text(
        doc.splitTextToSize(pillar.copy, pageWidth - margin * 2),
        margin,
        y + 36,
      );
      y += 92;
    });

    doc.setTextColor(10, 23, 48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(
      doc.splitTextToSize(
        "This snapshot is for personal awareness. It is not a financial plan or professional advice, and it does not evaluate or compare any mutual fund schemes.",
        pageWidth - margin * 2,
      ),
      margin,
      y + 10,
    );

    doc.save(`Financial_Wellness_Result_${result.id}.pdf`);
  };

  return (
    <section className="font-poppins text-[#0A1730]">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(330px,0.94fr)]">
        <div className="rounded-[8px] bg-[#FBFEFF] p-6 shadow-[0_16px_38px_rgba(8,40,69,0.04)] md:p-6">
          <p className="text-[15px] font-bold uppercase tracking-[0.14em] text-[#235CA3]">
            Assessment outcome
          </p>

          <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_170px] md:items-center">
            <div>
              <h2 className="max-w-[330px] text-[26px] font-semibold leading-[1.08] text-[#092C60] md:text-[28px]">
                {result.category}
              </h2>
              <p className="mt-5 max-w-[430px] text-[14px] leading-7 text-[#65718C]">
                {result.summary}
              </p>
            </div>

            <div
              className={`rounded-[18px] bg-gradient-to-br p-5 text-white ${scoreCardTone}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/85">
                Wellness score
              </p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-[46px] font-semibold leading-none">
                  {safeScore}
                </span>
                <span className="pb-1 text-[13px] text-white/85">/100</span>
              </div>
              <p className="mt-2 text-[12px] font-medium leading-5 text-white/85">
                Score band: {result.category}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[8px] border border-[#D7E4EF] bg-white px-5 py-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-[18px] font-semibold text-[#114E92]">
                  Your financial well-being score
                </h3>
                <p className="mt-1 max-w-[330px] text-[16px] leading-7 text-[#677592]">
                  A quick visual view of where your current result sits.
                </p>
              </div>
              <span className="inline-flex rounded-full bg-[#EAF5FF] px-4 py-2 text-[14px] font-semibold text-[#235CA3]">
                Category: {result.category}
              </span>
            </div>

            <div className="relative mt-8 pb-12 pt-12">
              <div className="flex h-[18px] overflow-hidden rounded-full">
                {scoreBands.map((band) => (
                  <div
                    key={band.label}
                    style={{
                      backgroundColor: band.color,
                      width: `${band.width}%`,
                    }}
                  />
                ))}
              </div>

              <div
                className="absolute top-0 -translate-x-1/2"
                style={{ left: `${safeScore}%` }}
              >
                <div className="rounded-full bg-[#062B55] px-4 py-3 text-center text-[13px] font-semibold leading-5 text-white shadow-[0_12px_24px_rgba(6,43,85,0.22)]">
                  Your
                  <br />
                  score:
                  <br />
                  {safeScore}
                </div>
                <div className="mx-auto h-12 w-[2px] bg-[#062B55]" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {scoreBands.map((band) => (
                  <div
                    key={band.label}
                    className="rounded-[6px] bg-[#F4F9FE] px-3 py-3"
                  >
                    <p className="text-[13px] font-semibold leading-5 text-[#173B66]">
                      {band.label}
                    </p>
                    <p className="mt-1 text-[12px] text-[#73829D]">
                      {band.range}
                    </p>
                  </div>
                ))}
              </div>

              <div className="absolute inset-x-0 bottom-0 flex justify-between text-[12px] text-[#7E8DA7]">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[18px] bg-[#052F56] p-6 text-white shadow-[0_16px_36px_rgba(5,47,86,0.16)] md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#74D6FF]">
            Five-area snapshot
          </p>
          <h3 className="mt-3 max-w-[420px] text-[27px] font-semibold leading-[1.08]">
            See where your current money life looks stronger or weaker
          </h3>

          <div className="mt-8 space-y-5">
            {result.pillar_results.map((pillar) => {
              const value = Math.max(
                8,
                Math.min(100, Math.round((pillar.score / 3) * 100)),
              );

              return (
                <div key={pillar.key}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[14px] font-semibold leading-5">
                        {pillar.title}
                      </p>
                      <p className="text-[12px] leading-5 text-white/75">
                        {pillar.status}
                      </p>
                    </div>
                    <span className="text-[13px] font-semibold text-white">
                      {value}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#D9F6FF]">
                    <div
                      className="h-2 rounded-full bg-[#7EE5FF]"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {result.pillar_results.map((pillar, index) => (
          <article
            key={pillar.key}
            className={`rounded-[8px] border border-[#C9DCEB] bg-[#F6FBFF] p-5 ${
              index > 2 ? "xl:translate-x-1/2" : ""
            }`}
          >
            <h3 className="text-[18px] font-semibold text-[#101827]">
              {pillar.title}
            </h3>
            <span
              className={`mt-4 inline-flex rounded-full border px-3 py-1.5 text-[14px] font-medium ${statusStyles[pillar.status]}`}
            >
              {pillar.status}
            </span>
            <p className="mt-4 text-[13px] leading-6 text-[#53617A]">
              Snapshot score: {pillar.score} / 3
            </p>
            <p className="mt-4 text-[15px] leading-8 text-[#424D62]">
              {pillar.copy}
            </p>
          </article>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-[900px] text-center text-[16px] font-semibold leading-8 text-black">
        This snapshot is for your personal awareness. It is not a financial plan
        or professional advice, and it does not evaluate or compare any mutual
        fund schemes.
      </p>

      <div className="mt-10 rounded-[8px] border border-[#C9DCEB] bg-[#F7FBFF] p-5 md:p-8">
        <div className="mx-auto max-w-[930px] rounded-[8px] bg-[#053D73] p-6 text-white shadow-[0_14px_28px_rgba(5,47,86,0.26)] md:p-8">
          <h3 className="text-[24px] font-semibold">
            Want this plan in your inbox?
          </h3>
          <p className="mt-3 text-[14px] leading-6 text-white/90">
            We&apos;ll send you a simple summary of your SIP journey and an
            option to talk to a Moneynow executive.
          </p>

          <form className="mt-6 grid gap-5 md:grid-cols-3">
            <label className="text-[12px] font-medium">
              Full name <span className="text-[#FF5B5B]">*</span>
              <input className="mt-2 h-12 w-full rounded-[3px] border-0 bg-white px-3 text-[#111827] outline-none" />
            </label>
            <label className="text-[12px] font-medium">
              Email <span className="text-[#FF5B5B]">*</span>
              <input
                type="email"
                className="mt-2 h-12 w-full rounded-[3px] border-0 bg-white px-3 text-[#111827] outline-none"
              />
            </label>
            <label className="text-[12px] font-medium">
              Mobile number <span className="text-[#FF5B5B]">*</span>
              <div className="mt-2 flex h-12 items-center rounded-[3px] bg-white px-3 text-[#111827]">
                <span className="mr-2 text-[14px]">IN +91</span>
                <input className="min-w-0 flex-1 border-0 outline-none" />
              </div>
            </label>

            <label className="flex items-center justify-center gap-3 text-center text-[13px] text-white/90 md:col-span-3">
              <input type="checkbox" className="h-4 w-4 accent-[#0F4C81]" />
              I&apos;d like a Moneynow advisor to walk me through this on a
              quick call.
            </label>

            <div className="md:col-span-3 flex justify-center">
              <button
                type="button"
                className="min-w-[270px] rounded-[4px] bg-white px-6 py-4 text-[14px] font-semibold text-[#07427B] transition hover:bg-[#EAF5FD]"
              >
                Talk to someone about this
              </button>
            </div>
          </form>
        </div>

        <p className="mx-auto mt-8 max-w-[790px] text-center text-[12px] leading-6 text-[#59677C]">
          Share a few details and we&apos;ll schedule a short, no-obligation
          conversation to talk through your snapshot and possible next steps.
        </p>
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex min-w-[200px] items-center justify-center gap-3 rounded-[4px] border border-[#0F4C81] bg-white px-5 py-3 text-[13px] font-medium text-[#0F4C81] transition hover:bg-[#EAF5FD]"
          >
            Download Result
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
