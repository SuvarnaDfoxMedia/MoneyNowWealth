"use client";

import {
  Download,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type LegacyChartData = {
  savings_score: number;
  investment_score: number;
  protection_score: number;
  distribution_score: number;
};

type LegacyResultData = {
  id: string;
  score: number;
  category: string;
  report: {
    wealth_creation: string;
    wealth_protection: string;
    wealth_restructuring: string;
    wealth_distribution: string;
  };
  chart_data?: LegacyChartData;
  pdf_url?: string | null;
  next_step?: string;
};

type JourneyPillarResult = {
  key: string;
  title: string;
  status: "Needs attention" | "Could be strengthened" | "On a reasonable track";
  score: number;
  copy: string;
};

type JourneyResultData = {
  id: string;
  score: number;
  category: string;
  summary: string;
  pillar_results: JourneyPillarResult[];
  chart_data?: Record<string, number>;
  pdf_url?: string | null;
  next_step?: string;
};

type AssessmentResultData = LegacyResultData | JourneyResultData;

interface AssessmentResultProps {
  result: AssessmentResultData;
}

const legacyPillars = [
  {
    key: "savings_score",
    label: "Savings discipline",
    description: "How well your monthly cash flow supports resilience.",
  },
  {
    key: "investment_score",
    label: "Investment readiness",
    description: "Whether current investing levels match long-term goals.",
  },
  {
    key: "protection_score",
    label: "Protection layer",
    description: "Insurance and downside protection readiness.",
  },
  {
    key: "distribution_score",
    label: "Future planning",
    description: "Retirement and wealth-transfer preparedness.",
  },
] as const;

const legacyScoreBands = [
  { label: "Needs attention", min: 0, max: 39, color: "#E35D2F" },
  { label: "Average", min: 40, max: 54, color: "#F3A61C" },
  { label: "Good", min: 55, max: 69, color: "#78B943" },
  { label: "Strong", min: 70, max: 84, color: "#2FA28E" },
  { label: "Excellent", min: 85, max: 100, color: "#0F4C81" },
] as const;

const journeyScoreBands = [
  { label: "Needs attention", min: 0, max: 39, color: "#E35D2F" },
  { label: "Could be strengthened", min: 40, max: 69, color: "#F3A61C" },
  { label: "On a reasonable track", min: 70, max: 100, color: "#2FA28E" },
] as const;

const scoreTone: Record<string, string> = {
  "Needs Attention": "from-[#C2410C] to-[#FB923C]",
  "Needs attention": "from-[#C2410C] to-[#FB923C]",
  Average: "from-[#B45309] to-[#FACC15]",
  Good: "from-[#0F766E] to-[#2DD4BF]",
  Excellent: "from-[#0F4C81] to-[#43B0F1]",
  "Could be strengthened": "from-[#B45309] to-[#FACC15]",
  "On a reasonable track": "from-[#0F766E] to-[#2DD4BF]",
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

const statusStyle = {
  "Needs attention": "border-[#F1C3C3] bg-[#FFF3F3] text-[#A13D3D]",
  "Could be strengthened": "border-[#EED59D] bg-[#FFF8E8] text-[#8D6000]",
  "On a reasonable track": "border-[#C8E2CD] bg-[#F3FBF4] text-[#25633A]",
};

const isJourneyResult = (
  result: AssessmentResultData,
): result is JourneyResultData => "pillar_results" in result;

export default function AssessmentResult({ result }: AssessmentResultProps) {
  const journeyVariant = isJourneyResult(result);
  const safeScore = Math.max(0, Math.min(100, Number(result.score) || 0));
  const scoreBands = journeyVariant ? journeyScoreBands : legacyScoreBands;
  const tone =
    scoreTone[result.category] ||
    scoreTone[
      journeyVariant ? "On a reasonable track" : "Good"
    ];
  const activeBand =
    scoreBands.find((band) => safeScore >= band.min && safeScore <= band.max) ||
    scoreBands[Math.min(1, scoreBands.length - 1)];
  const snapshotItems = journeyVariant
    ? result.pillar_results.map((pillar) => ({
        key: pillar.key,
        title: pillar.title,
        subtitle: pillar.status,
        value: Math.max(8, Math.min(100, Math.round((pillar.score / 3) * 100))),
      }))
    : legacyPillars.map((pillar) => {
        const value = Number(result.chart_data?.[pillar.key] ?? 0);

        return {
          key: pillar.key,
          title: pillar.label,
          subtitle: pillar.description,
          value: Math.max(8, Math.min(100, Math.round(value))),
        };
      });

  return (
    <section className="font-poppins space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[14px] bg-[#F6FAFD] p-6 shadow-[0_14px_36px_rgba(6,36,68,0.06)] md:p-8">
          <p className="text-[16px] font-semibold uppercase tracking-[0.4em] text-[#0F4C81]">
            Assessment outcome
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="max-w-[320px] text-[34px] font-semibold leading-[1.1] text-[#072A4A] md:text-[56px]">
                {result.category}
              </h2>
              <p className="mt-4 max-w-[420px] text-[15px] leading-8 text-[#667789]">
                {journeyVariant
                  ? result.summary
                  : "Your current money habits show where you are today and what to strengthen next. Use this as a practical starting point, not a label."}
              </p>
            </div>

            <div
              className={`min-w-[180px] rounded-[14px] bg-gradient-to-br ${tone} px-6 py-5 text-white`}
            >
              <p className="text-sm uppercase tracking-[0.24em] text-white/80">
                Wellness score
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[52px] font-semibold leading-none">
                  {safeScore}
                </span>
                <span className="pb-1 text-sm text-white/75">/100</span>
              </div>
              <p className="mt-2 text-[13px] text-white/80">
                Score band: {activeBand.label}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[14px] border border-[#DCE8F1] bg-white px-4 py-5 md:px-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[18px] font-semibold text-[#0B3258]">
                  Your financial well-being score
                </p>
                <p className="text-[16px] leading-7 text-[#667789]">
                  A quick visual view of where your current result sits.
                </p>
              </div>
              <div className="rounded-full bg-[#EAF5FD] px-4 py-2 text-[14px] font-semibold text-[#0F4C81]">
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
                <div className="rounded-full bg-[#072A4A] px-4 py-2 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(7,42,74,0.18)]">
                  Your score: {safeScore}
                </div>
                <div className="mx-auto h-10 w-[2px] bg-[#072A4A]" />
              </div>

              <div
                className={`mt-4 grid gap-3 text-[13px] text-[#5D7387] ${
                  journeyVariant ? "md:grid-cols-3" : "md:grid-cols-5"
                }`}
              >
                {scoreBands.map((band) => (
                  <div
                    key={band.label}
                    className="rounded-[14px] bg-[#F7FBFE] px-3 py-2"
                  >
                    <p className="font-semibold text-[#163955]">{band.label}</p>
                    <p>
                      {band.min}-{band.max}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-0.5 text-[13px] text-[#708394]">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[14px] bg-[#072A4A] p-6 text-white md:p-8">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/65">
            {journeyVariant ? "Five-area snapshot" : "Four-pillar snapshot"}
          </p>
          <h3 className="mt-3 text-[28px] font-semibold leading-tight">
            {journeyVariant
              ? "See where your current money life looks stronger or weaker"
              : "See where your financial foundation is strongest"}
          </h3>

          <div className="mt-8 space-y-5">
            {snapshotItems.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[18px] font-medium">{item.title}</p>
                    <p className="text-[13px] text-white/68">{item.subtitle}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#8FD3FF]">
                    {item.value}
                  </span>
                </div>

                <div className="mt-3 h-2.5 rounded-full bg-white/15">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-[#5ED6FF] to-[#C3F1FF]"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {journeyVariant ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.pillar_results.map((pillar) => (
            <article
              key={pillar.key}
              className="rounded-[14px] border border-[#E3EDF5] bg-[#F8FBFE] p-5"
            >
              <h3 className="text-[18px] font-semibold text-[#111111]">
                {pillar.title}
              </h3>
              <span
                className={`mt-4 inline-flex rounded-full border px-3 py-1.5 text-[12px] font-semibold ${statusStyle[pillar.status]}`}
              >
                {pillar.status}
              </span>
              <p className="mt-4 text-[13px] text-[#5D7387]">
                Snapshot score: {pillar.score} / 3
              </p>
              <p className="mt-4 text-[15px] leading-8 text-[#556477]">
                {pillar.copy}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reportCards.map(({ key, title, icon: Icon }) => (
            <article
              key={key}
              className="rounded-[14px] border border-[#E3EDF5] bg-[#F8FBFE] p-5"
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
      )}

      <div className="text-center">
        <p className="mx-auto max-w-[860px] text-[18px] font-semibold leading-9 text-[#111111]">
          This snapshot is for your personal awareness. It is not a financial
          plan or professional advice, and it does not evaluate or compare any
          mutual fund schemes.
        </p>
      </div>
    </section>
  );
}
