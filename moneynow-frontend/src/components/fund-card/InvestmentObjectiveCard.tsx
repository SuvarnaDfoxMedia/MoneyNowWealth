interface InvestmentObjectiveCardProps {
  schemeObjective?: string | null;
}

export default function InvestmentObjectiveCard({
  schemeObjective,
}: InvestmentObjectiveCardProps) {
  if (!schemeObjective) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
      <h2 className="text-base font-bold tracking-tight text-slate-800 mb-4">
        Investment Objective
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
        {schemeObjective}
      </p>
    </div>
  );
}
