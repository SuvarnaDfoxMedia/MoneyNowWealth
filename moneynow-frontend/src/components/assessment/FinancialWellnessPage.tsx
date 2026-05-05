"use client";

import { useMemo, useState } from "react";
import FinancialWellnessAssessmentModule from "@/components/assessment/FinancialWellnessAssessmentModule";
import JourneyBanner from "@/components/journeys/JourneyBanner";

type AreaKey = "habits" | "protection" | "investing" | "goals" | "debt";

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
      {
        label: "Less than 1 month or I do not have a separate emergency fund",
        score: 0,
      },
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
        label:
          "I have started mutual funds or other investments, but not very organised",
        score: 2,
      },
      {
        label:
          "I invest regularly through SIPs or planned lumpsums with some structure",
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
      {
        label: "A few investments are goal-linked, others are random",
        score: 1,
      },
      {
        label: "Most of my investments are loosely aligned to goals",
        score: 2,
      },
      {
        label: "My investments are clearly mapped to goals and timelines",
        score: 3,
      },
    ],
  },
  {
    id: "goal_clarity",
    area: "goals",
    title: "How clearly have you defined your key financial goals?",
    options: [
      { label: "I have not really thought about it yet", score: 0 },
      { label: "I have some rough ideas in my head", score: 1 },
      {
        label: "I have written goals with rough amounts and timelines",
        score: 2,
      },
      {
        label: "My goals are written, prioritised, and reviewed periodically",
        score: 3,
      },
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
      {
        label:
          "EMIs or card dues feel heavy; I am often worried about repayments",
        score: 0,
      },
      { label: "EMIs are manageable but limit how much I can save", score: 1 },
      {
        label:
          "EMIs are reasonable; I can save and invest comfortably alongside",
        score: 2,
      },
      {
        label: "I have little or no debt, or it is fully under control",
        score: 3,
      },
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

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }

  return hash;
};

const getShuffledOptions = (question: Question) =>
  [...question.options]
    .map((option, index) => ({
      option,
      sortKey: hashString(`${question.id}:${option.label}:${index}`),
    }))
    .sort((left, right) => left.sortKey - right.sortKey)
    .map(({ option }) => option);

export default function FinancialWellnessPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const shuffledQuestions = useMemo(
    () =>
      QUESTIONS.map((question) => ({
        ...question,
        options: getShuffledOptions(question),
      })),
    [],
  );

  const currentQuestion = shuffledQuestions[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  const result = useMemo(() => {
    const pillarResults = (Object.keys(COPY) as AreaKey[]).map((key) => {
      const areaQuestions = shuffledQuestions.filter(
        (question) => question.area === key,
      );
      const scores = areaQuestions.map((question) => answers[question.id] ?? 0);
      const average = scores.length
        ? Math.round(
            scores.reduce((sum, value) => sum + value, 0) / scores.length,
          )
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
      ? pillarResults.reduce((sum, item) => sum + item.score, 0) /
        pillarResults.length
      : 0;
    const score = Math.round((averageScore / 3) * 100);
    const category =
      score <= 39
        ? "Needs attention"
        : score <= 69
          ? "Could be strengthened"
          : "On a reasonable track";

    const question_answers = shuffledQuestions.map((question) => {
      const selectedScore = answers[question.id] ?? 0;
      const selectedOption = question.options.find(
        (option) => option.score === selectedScore,
      );

      return {
        id: question.id,
        pillar: question.area,
        question: question.title,
        answer: selectedOption?.label || "",
        score: selectedScore,
      };
    });

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
      question_answers,
      next_step: "Talk to someone about this",
    };
  }, [answers, shuffledQuestions]);

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
      <JourneyBanner
        title="Your money life, at a glance"
        subtitle="This short check is designed to help you reflect on where you stand today across a few key areas – daily money habits, emergency readiness, investing behaviour, clarity about future goals, and comfort with debt."
      />

      <FinancialWellnessAssessmentModule
        showResult={showResult}
        currentStep={step + 1}
        totalSteps={QUESTIONS.length}
        progress={progress}
        questionTitle={currentQuestion.title}
        options={currentQuestion.options}
        selectedScore={answers[currentQuestion.id]}
        onSelect={handleAnswerSelect}
        onBack={handleBack}
        onNext={handleNext}
        result={result}
        relatedPaths={RELATED_PATHS}
      />
    </div>
  );
}
