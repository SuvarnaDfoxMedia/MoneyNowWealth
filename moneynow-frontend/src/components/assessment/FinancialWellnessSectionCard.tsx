import { ReactNode } from "react";

interface FinancialWellnessSectionCardProps {
  children: ReactNode;
  className?: string;
}

export default function FinancialWellnessSectionCard({
  children,
  className = "",
}: FinancialWellnessSectionCardProps) {
  return (
    <div
      className={`rounded-[8px] bg-white p-5 shadow-[0_16px_36px_rgba(8,40,69,0.1)] md:p-6 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
