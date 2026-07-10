import React from "react";

export interface StepItem {
  number: number;
  title: string;
  body: string;
}

interface ConnectedStepsProps {
  heading: string;
  steps: StepItem[];
}

export const ConnectedSteps: React.FC<ConnectedStepsProps> = ({
  heading,
  steps,
}) => {
  return (
    <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
      <h3 className="text-[20px] font-semibold text-[#18181B] mb-6">
        {heading}
      </h3>
      <div className="flex flex-col">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <div key={step.number} className="relative flex gap-4">
              {/* Connector Line */}
              {!isLast && (
                <div className="absolute left-[10px] top-[22px] bottom-[-8px] w-[2px] bg-[#E4E4E7]" />
              )}
              
              {/* Step Number Badge */}
              <div className="relative z-10 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-[#0E4A89] text-white text-[11px] font-medium">
                {step.number}
              </div>
              
              {/* Step Content */}
              <div className={`flex flex-col pb-6 ${isLast ? "pb-0" : ""}`}>
                <span className="text-[16px] font-semibold text-[#18181B] leading-tight mt-0.5">
                  {step.title}
                </span>
                <span className="mt-2 text-[14px] text-[#52525B] leading-relaxed">
                  {step.body}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
