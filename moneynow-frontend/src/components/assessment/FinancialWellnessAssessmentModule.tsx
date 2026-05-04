import { ComponentProps } from "react";
import Image from "next/image";
import AssessmentResult from "@/components/assessment/AssessmentResult";
import FinancialWellnessModuleIntro from "@/components/assessment/FinancialWellnessModuleIntro";
import FinancialWellnessQuestionCard from "@/components/assessment/FinancialWellnessQuestionCard";
import FinancialWellnessResultView from "@/components/assessment/FinancialWellnessResultView";
import FinancialWellnessResultSupport from "@/components/assessment/FinancialWellnessResultSupport";
import FinancialWellnessSectionCard from "@/components/assessment/FinancialWellnessSectionCard";

type Option = { label: string; score: number };

interface RelatedPath {
  title: string;
  copy: string;
  href: string;
  label: string;
}

interface FinancialWellnessAssessmentModuleProps {
  showResult: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number;
  questionTitle: string;
  options: Option[];
  selectedScore?: number;
  onSelect: (score: number) => void;
  onBack: () => void;
  onNext: () => void;
  result: ComponentProps<typeof AssessmentResult>["result"];
  relatedPaths: RelatedPath[];
}

export default function FinancialWellnessAssessmentModule({
  showResult,
  currentStep,
  totalSteps,
  progress,
  questionTitle,
  options,
  selectedScore,
  onSelect,
  onBack,
  onNext,
  result,
  relatedPaths,
}: FinancialWellnessAssessmentModuleProps) {
  const sectionStyle = showResult
    ? { background: "#043F7926" }
    : {
        background:
          "linear-gradient(130.52deg, #0A3E71 25.75%, #377B5E 73.04%)",
      };

  return (
    <section className="w-full">
      <div
        className="w-full px-4 py-8 shadow-[0_20px_50px_rgba(6,27,49,0.16)] sm:px-5 md:py-10 lg:px-8"
        style={sectionStyle}
      >
        <div className="mx-auto max-w-7xl">
          {!showResult ? (
            <FinancialWellnessModuleIntro showResult={showResult} />
          ) : null}

          {!showResult ? (
            <div className="mt-10 grid items-center gap-6 lg:mt-12 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
              <FinancialWellnessSectionCard className="overflow-hidden rounded-[8px] p-0">
                <Image
                  src="/images/financial-wellness-pointer.png"
                  alt="Financial wellness illustration"
                  width={640}
                  height={660}
                  className="block h-full w-full object-cover"
                />
              </FinancialWellnessSectionCard>
              <FinancialWellnessQuestionCard
                currentStep={currentStep}
                totalSteps={totalSteps}
                progress={progress}
                questionTitle={questionTitle}
                options={options}
                selectedScore={selectedScore}
                onSelect={onSelect}
                onBack={onBack}
                onNext={onNext}
              />
            </div>
          ) : "pillar_results" in result ? (
            <div className="rounded-[8px] bg-white p-4 shadow-[0_18px_50px_rgba(6,36,68,0.08)] md:p-6 lg:p-10">
              <FinancialWellnessResultView result={result} />
            </div>
          ) : (
            <div className="mt-10 rounded-[8px] bg-white p-4 shadow-[0_18px_50px_rgba(6,36,68,0.08)] md:p-6 lg:mt-12 lg:p-8">
              <AssessmentResult result={result} />
              <FinancialWellnessResultSupport relatedPaths={relatedPaths} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
