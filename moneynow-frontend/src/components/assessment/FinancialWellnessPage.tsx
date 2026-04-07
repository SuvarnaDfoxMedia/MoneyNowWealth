"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import StartSipHero from "@/components/start-sip/charts-sub-components/StartSipHero";
import StartSipPanel from "@/components/start-sip/charts-sub-components/StartSipPanel";
import AssessmentResult from "@/components/assessment/AssessmentResult";

type AreaKey =
  | "habits"
  | "protection"
  | "investing"
  | "goals"
  | "debt";

type Option = { label: string; score: number };
type Question = {
  id: string;
  area: AreaKey;
  title: string;
  options: Option[];
};

const QUESTIONS: Question[] = [
  {
    id: "saving_habit",
    area: "habits",
    title:
      "How regularly do you set aside money for savings or investments every month?",
    options: [
      { label: "I do not manage to save most months", score: 0 },
      { label: "I save some months, but it is irregular", score: 1 },
      { label: "I save a fixed amount most months", score: 2 },
      { label: "I save a fixed amount and increase it over time", score: 3 },
    ],
  },
  {
    id: "emergency_cushion",
    area: "protection",
    title:
      "If your income stopped, how many months of essential expenses could your emergency money cover?",
    options: [
      { label: "Less than 1 month or I do not have a separate emergency fund", score: 0 },
      { label: "Around 1 to 3 months", score: 1 },
      { label: "Around 3 to 6 months", score: 2 },
      { label: "More than 6 months", score: 3 },
    ],
  },
  {
    id: "insurance_cover",
    area: "protection",
    title:
      "Which of these best describes your insurance cover outside of work benefits?",
    options: [
      { label: "I am not sure or I do not have any", score: 0 },
      { label: "Only health insurance", score: 1 },
      { label: "Health plus some life insurance", score: 2 },
      { label: "Health, life, and other cover as needed", score: 3 },
    ],
  },
  {
    id: "expense_comfort",
    area: "habits",
    title: "How do your monthly expenses feel compared to your income?",
    options: [
      { label: "I am often short or using credit to manage", score: 0 },
      { label: "It is tight but manageable most months", score: 1 },
      { label: "Comfortable; I usually have a buffer", score: 2 },
      { label: "Very comfortable; I track and optimise regularly", score: 3 },
    ],
  },
  {
    id: "investing_behaviour",
    area: "investing",
    title: "Which of these best describes your current investing?",
    options: [
      { label: "I have not really started investing yet", score: 0 },
      { label: "I mainly keep money in savings or fixed deposits", score: 1 },
      {
        label: "I have started mutual funds or other investments, but not very organised",
        score: 2,
      },
      {
        label: "I invest regularly through SIPs or planned lumpsums with some structure",
        score: 3,
      },
    ],
  },
  {
    id: "goal_linking",
    area: "investing",
    title:
      "How well are your investments linked to specific goals and timeframes?",
    options: [
      { label: "They are not really linked to any goals yet", score: 0 },
      { label: "A few investments are goal-linked, others are random", score: 1 },
      { label: "Most of my investments are loosely aligned to goals", score: 2 },
      { label: "My investments are clearly mapped to goals and timelines", score: 3 },
    ],
  },
  {
    id: "goal_clarity",
    area: "goals",
    title: "How clearly have you defined your key financial goals?",
    options: [
      { label: "I have not really thought about it yet", score: 0 },
      { label: "I have some rough ideas in my head", score: 1 },
      { label: "I have written goals with rough amounts and timelines", score: 2 },
      { label: "My goals are written, prioritised, and reviewed periodically", score: 3 },
    ],
  },
  {
    id: "goal_confidence",
    area: "goals",
    title:
      "How confident do you feel about being on track for important goals like retirement, a home, or children's education?",
    options: [
      { label: "Not confident at all", score: 0 },
      { label: "Somewhat confident but unsure about the details", score: 1 },
      { label: "Mostly confident, with a few questions", score: 2 },
      { label: "Quite confident and review things regularly", score: 3 },
    ],
  },
  {
    id: "debt_obligations",
    area: "debt",
    title: "How do you feel about your current loans and EMIs?",
    options: [
      { label: "EMIs or card dues feel heavy; I am often worried about repayments", score: 0 },
      { label: "EMIs are manageable but limit how much I can save", score: 1 },
      { label: "EMIs are reasonable; I can save and invest comfortably alongside", score: 2 },
      { label: "I have little or no debt, or it is fully under control", score: 3 },
    ],
  },
];

const COPY = {
  habits: {
    title: "Habits & cash flow",
    low: "Your current money routine may need more stability. Building a simple saving habit and giving yourself more breathing room each month could make a meaningful difference.",
    mid: "You appear to have some consistency already, but there is still room to make your monthly money flow more intentional and less reactive.",
    high: "Your answers suggest a reasonably steady approach to spending and saving, which is a strong base for long-term financial decisions.",
  },
  protection: {
    title: "Protection & emergencies",
    low: "Your financial safety net may not be strong enough yet. Emergency reserves and insurance cover may need closer attention so that unexpected events do not disrupt your plans.",
    mid: "You have likely taken a few protective steps already, but your financial backup plan could still be made more dependable.",
    high: "You seem to have put several protection basics in place, which can help you stay calmer and more consistent with your long-term plans.",
  },
  investing: {
    title: "Investing behaviour",
    low: "You may still be at an early stage of investing or your current investments may not yet be organized around long-term outcomes.",
    mid: "You have started investing, but there may still be room to make the approach more consistent and more clearly tied to your goals.",
    high: "Your investing behaviour appears reasonably structured already, which gives you a stronger base for future wealth-building decisions.",
  },
  goals: {
    title: "Goals & clarity",
    low: "Your answers suggest that some of your future goals may still be unclear or not yet translated into a practical financial roadmap.",
    mid: "You seem to have some direction, but your goals may benefit from clearer prioritisation, amounts, and timelines.",
    high: "You appear to have fairly clear goals and a useful sense of direction, which can make financial planning much easier to sustain.",
  },
  debt: {
    title: "Debt & obligations",
    low: "Your current debt or EMI commitments may be creating visible pressure on your monthly flexibility and savings capacity.",
    mid: "Your debt looks manageable in parts, but there may still be opportunities to reduce strain and improve financial flexibility.",
    high: "Your debt obligations appear to be under reasonable control, which gives you more room to focus on future goals.",
  },
} as const;

const heroMetrics = [
  { label: "Time needed", value: "3 minutes" },
  { label: "Questions", value: "9 simple prompts" },
  { label: "What you get", value: "Personal snapshot" },
  { label: "Next step", value: "Score + report" },
];

const COVERAGE_AREAS = [
  "Saving habits",
  "Emergency readiness",
  "Insurance cover",
  "Investing behaviour",
  "Goal clarity",
  "Debt comfort",
];

const REASSURANCE_POINTS = [
  {
    title: "Simple and low-pressure",
    copy: "This is a guided reflection to help you understand your current position, not a technical test.",
  },
  {
    title: "Built around real money habits",
    copy: "The questions focus on cash flow, protection, investing, goals, and debt so the result feels practical.",
  },
  {
    title: "Useful next step",
    copy: "You will get an easy snapshot, a downloadable report, and a clear route to a conversation if needed.",
  },
];

const RELATED_PATHS = [
  {
    title: "See how your SIP can grow towards Rs 1 Crore",
    copy: "If you want to move from reflection into a long-term investment goal, explore the SIP journey next.",
    href: "/one-crore-journey",
    label: "Open SIP journey",
  },
  {
    title: "See who usually works with us",
    copy: "If you want to know whether MoneyNow is the right fit for your stage of life, explore the persona journey.",
    href: "/who-we-work-with",
    label: "Open persona journey",
  },
  {
    title: "Prefer to talk directly?",
    copy: "If you would rather discuss your situation with someone instead of exploring alone, start a conversation here.",
    href: "/contact-us",
    label: "Start a conversation",
  },
];

const getStatus = (score: number) => {
  if (score <= 1) return "Needs attention" as const;
  if (score === 2) return "Could be strengthened" as const;
  return "On a reasonable track" as const;
};

export default function FinancialWellnessPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  const result = useMemo(() => {
    const pillarResults = (Object.keys(COPY) as AreaKey[]).map((key) => {
      const areaQuestions = QUESTIONS.filter((question) => question.area === key);
      const scores = areaQuestions.map((question) => answers[question.id] ?? 0);
      const average = scores.length
        ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
        : 0;
      const status = getStatus(average);
      const copy =
        status === "Needs attention"
          ? COPY[key].low
          : status === "Could be strengthened"
            ? COPY[key].mid
            : COPY[key].high;

      return {
        key,
        title: COPY[key].title,
        status,
        score: average,
        copy,
      };
    });

    const averageScore = pillarResults.length
      ? pillarResults.reduce((sum, item) => sum + item.score, 0) / pillarResults.length
      : 0;
    const category =
      averageScore <= 1
        ? "Needs attention"
        : averageScore < 2.5
          ? "Could be strengthened"
          : "On a reasonable track";
    const score = Math.round((averageScore / 3) * 100);

    const summary =
      category === "Needs attention"
        ? "Your current snapshot suggests there are a few important areas that may need attention first. A guided conversation can help you decide what to prioritise now and what can follow later."
        : category === "Could be strengthened"
          ? "Your current snapshot suggests that you already have some healthy foundations in place, with a few areas that could be made stronger through better structure and clearer prioritisation."
          : "Your current snapshot suggests that several important parts of your money life are on a reasonable track today. The next step is usually to maintain that consistency and refine your longer-term planning.";

    return {
      id: "local-financial-wellness",
      score,
      category,
      summary,
      pillar_results: pillarResults,
      next_step: "Talk to someone about this",
    };
  }, [answers]);

  const summaryMetrics = showResult
    ? [
        { label: "Overall score", value: `${result.score}/100` },
        { label: "Current picture", value: result.category },
        { label: "Question set", value: "9 answers" },
        { label: "Next step", value: "Talk to us" },
      ]
    : heroMetrics;

  const handleAnswerSelect = (score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: score,
    }));
  };

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    setShowResult(true);
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
      return;
    }

    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <div className="bg-[#F5F7FB] text-[#111111]">
      <StartSipHero
        title="Your money life, at a glance"
        subtitle="Answer a few simple questions to get a quick snapshot of your current money habits, safety net, investing, goals, and debt position."
        metrics={summaryMetrics}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-10">
        {!showResult ? (
          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <StartSipPanel
              eyebrow="Before you begin"
              title="What this quick check is meant to do"
              subtitle="This is a simple guided reflection to help you understand where things look stronger today and where more attention may be useful."
            >
              <div className="space-y-4 text-[15px] leading-7 text-slate-600">
                <p>
                  The aim is to help you understand where you stand today and
                  where a conversation may be useful. There are no right or
                  wrong answers, and this check does not recommend any product
                  or scheme.
                </p>
                <div className="rounded-[16px] border border-slate-200 bg-[#FAFAFA] p-4">
                  <p className="text-sm font-medium text-[#0B3B6E]">
                    What this will cover
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {COVERAGE_AREAS.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 px-3 py-2 text-[13px] text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {REASSURANCE_POINTS.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[16px] border border-slate-200 bg-white p-4"
                    >
                      <p className="text-[15px] font-semibold text-[#0B3B6E]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-[14px] leading-6 text-slate-600">
                        {item.copy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </StartSipPanel>

            <StartSipPanel
              eyebrow={`Question ${step + 1} of ${QUESTIONS.length}`}
              title={currentQuestion.title}
              subtitle="Choose the option that feels closest to your current situation today."
            >
              <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#0B3B6E] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-[#FAFAFA] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#0B3B6E]">
                    Progress
                  </p>
                  <p className="text-[13px] leading-6 text-slate-600">
                    Complete all 9 questions to see your score and area-wise snapshot.
                  </p>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  {step + 1} / {QUESTIONS.length}
                </div>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const selected = answers[currentQuestion.id] === option.score;

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleAnswerSelect(option.score)}
                      className={`w-full rounded-[16px] border px-5 py-4 text-left text-[15px] leading-7 transition ${
                        selected
                          ? "border-[#0B3B6E] bg-[#EEF5FB] text-[#0B3B6E]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[#0B3B6E]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="rounded-md border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={answers[currentQuestion.id] === undefined}
                  className="rounded-md bg-[#0B3B6E] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  {step === QUESTIONS.length - 1 ? "Show result" : "Next question"}
                </button>
              </div>
            </StartSipPanel>
          </div>
        ) : (
          <div className="space-y-8">
            <AssessmentResult result={result} />

            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <StartSipPanel
                eyebrow="Important note"
                title="For awareness, not product advice"
                subtitle="Use this result as a simple checkpoint, not as a final judgement about your finances."
              >
                <div className="space-y-4 text-[15px] leading-7 text-slate-600">
                  <p>
                    This result is designed to help you reflect on your current
                    money situation. It is not personal financial advice and it
                    does not compare or recommend any mutual fund schemes.
                  </p>
                  <p>
                    If one or two areas look weaker, that does not mean things
                    are failing overall. It simply shows where a guided
                    conversation may help you prioritise better.
                  </p>
                </div>
              </StartSipPanel>

              <StartSipPanel
                eyebrow="Where to go next"
                title="Continue from the path that feels most useful"
                subtitle="You can move into a goal-based journey, explore fit, or speak with us directly."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  {RELATED_PATHS.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-[16px] border border-slate-200 bg-[#FAFAFA] p-5"
                    >
                      <h3 className="text-[18px] font-semibold text-slate-900">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-[14px] leading-7 text-slate-600">
                        {card.copy}
                      </p>
                      <Link
                        href={card.href}
                        className="mt-4 inline-flex text-sm font-medium text-[#0B3B6E]"
                      >
                        {card.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </StartSipPanel>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
