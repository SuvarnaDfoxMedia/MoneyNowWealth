"use client";

import { useEffect, useRef } from "react";

type Option = { label: string; score: number };

interface FinancialWellnessQuestionCardProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
  questionTitle: string;
  options: Option[];
  selectedScore?: number;
  onSelect: (score: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function FinancialWellnessQuestionCard({
  currentStep,
  totalSteps,
  progress,
  questionTitle,
  options,
  selectedScore,
  onSelect,
  onBack,
  onNext,
}: FinancialWellnessQuestionCardProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      const yOffset = -120; 
      const y =
        titleRef.current.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  }, [currentStep]);

  return (
    <div className="rounded-[14px] bg-[rgba(255,255,255,0.12)] p-4 shadow-[0_20px_40px_rgba(6,27,49,0.18)] backdrop-blur-[8px] md:p-7">
      <h2
        ref={titleRef}
        className="mb-4 text-[24px] font-semibold leading-[38px] text-[#ffffff]"
      >
        {questionTitle}
      </h2>

      <div className="mt-5 rounded-[12px] bg-[rgba(255,255,255,0.14)] p-4 md:p-5">
        <div className="space-y-4">
          {options.map((option, index) => {
            const selected = selectedScore === option.score;

            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onSelect(option.score)}
                className={`w-full rounded-[6px] border px-4 py-3 text-left text-[16px] leading-[1.6] transition md:px-5 ${
                  selected
                    ? "border-[#0B4D8C] bg-[#f3a53e] text-[#000000]"
                    : "border-transparent bg-white text-[#000000] hover:border-[#8FB9DD]"
                }`}
              >
                <span className="mr-2 font-semibold">
                  {index + 1}.
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

<div className="mt-6 rounded-[12px] bg-[#ffffff] p-5 shadow-[0_8px_20px_rgba(8,40,69,0.08)]">
  <div className="flex items-center gap-8">
    <p className="whitespace-nowrap text-[16px] font-semibold text-[#000000]">
      Progress
    </p>

    <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[#E6EDF5]">
      <div
        className="h-full rounded-full bg-[#0B4D8C] transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>

    <div className="rounded-[10px] bg-[#F2F7FC] px-3 py-1 text-[14px] font-semibold text-[#0B4D8C]">
      {currentStep}/{totalSteps}
    </div>
  </div>

  {/* Description */}
  <div className="mt-3">
    <p className="text-[16px] leading-[1.7]">
      Complete all {totalSteps} questions to see your score and
      area-wise snapshot.
    </p>
  </div>
</div>

      <div className="mt-5 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 1}
          className="min-w-[110px] rounded-[4px] bg-white px-6 py-3 text-[16px] font-medium text-[#0B3B6E] transition hover:bg-[#F4F8FC] disabled:opacity-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={selectedScore === undefined}
          className="min-w-[180px] rounded-[4px] bg-[#0B4D8C] px-6 py-3 text-[16px] font-medium text-white transition hover:bg-[#093D70] disabled:opacity-50"
        >
          {currentStep === totalSteps ? "Show result" : "Next question"}
        </button>
      </div>
    </div>
  );
}