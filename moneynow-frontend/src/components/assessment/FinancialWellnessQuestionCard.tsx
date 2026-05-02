"use client";

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
  return (
    <div className="rounded-[24px] bg-[rgba(255,255,255,0.12)] p-4 shadow-[0_20px_40px_rgba(6,27,49,0.18)] backdrop-blur-[8px] md:p-7">
      <div className="rounded-[20px] bg-white p-5 shadow-[0_8px_20px_rgba(8,40,69,0.08)]">
        <div className="flex items-center gap-4">
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

        <div className="mt-4">
          <p className="text-[15px] font-semibold text-[#172B4D]">Progress</p>
          <p className="mt-1 text-[14px] leading-[1.7] text-[#4C5D75]">
            Complete all {totalSteps} questions to see your score and area-wise
            snapshot.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] bg-[rgba(255,255,255,0.14)] p-4 md:p-5">
        <h2 className="text-[28px] font-semibold leading-[1.35] text-white">
          {questionTitle}
        </h2>

        <div className="mt-6 space-y-4">
          {options.map((option) => {
            const selected = selectedScore === option.score;

            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onSelect(option.score)}
                className={`w-full rounded-[12px] border px-4 py-4 text-left text-[16px] leading-[1.6] transition md:px-5 ${
                  selected
                    ? "border-[#0B4D8C] bg-[#EAF3FB] text-[#0B3B6E]"
                    : "border-transparent bg-white text-[#24364D] hover:border-[#8FB9DD]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 1}
          className="min-w-[110px] rounded-[8px] bg-white px-6 py-3 text-[16px] font-medium text-[#0B3B6E] transition hover:bg-[#F4F8FC] disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={selectedScore === undefined}
          className="min-w-[180px] rounded-[8px] bg-[#0B4D8C] px-6 py-3 text-[16px] font-medium text-white transition hover:bg-[#093D70] disabled:opacity-50"
        >
          {currentStep === totalSteps ? "Show result" : "Next question"}
        </button>
      </div>
    </div>
  );
}
