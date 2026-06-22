interface InvestmentObjectiveCardProps {
  schemeObjective?: string | null;
}

export default function InvestmentObjectiveCard({
  schemeObjective,
}: InvestmentObjectiveCardProps) {
  if (!schemeObjective) return null;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-blue-100 bg-blue-100/60">
        <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wide">
          Investment Objective
        </h2>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-blue-900 leading-relaxed">
          {schemeObjective}
        </p>
      </div>
    </div>
  );
}
