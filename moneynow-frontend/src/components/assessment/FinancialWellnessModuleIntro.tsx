interface FinancialWellnessModuleIntroProps {
  showResult: boolean;
}

export default function FinancialWellnessModuleIntro({
  showResult,
}: FinancialWellnessModuleIntroProps) {
  return (
    <div className="mx-auto max-w-[980px] text-center text-white">
      <p className="text-[20px] font-semibold leading-[1.5] md:text-[28px]">
        Most questions are multiple-choice. Approximations are fine; there are
        no right or wrong answers.
      </p>
      <p className="mt-5 text-[16px] leading-[1.8] text-white/88 md:text-[18px]">
        {showResult
          ? "Use your result as a practical snapshot of where things stand today. It is designed to help with reflection and prioritisation, not to replace personal advice."
          : "It does not replace a detailed financial plan and is not investment, tax, or legal advice, and it does not evaluate or compare any specific mutual fund schemes."}
      </p>
    </div>
  );
}
