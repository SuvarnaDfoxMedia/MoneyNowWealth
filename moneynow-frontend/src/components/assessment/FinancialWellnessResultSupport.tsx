import Link from "next/link";
import FinancialWellnessSectionCard from "@/components/assessment/FinancialWellnessSectionCard";

interface RelatedPath {
  title: string;
  copy: string;
  href: string;
  label: string;
}

interface FinancialWellnessResultSupportProps {
  relatedPaths: RelatedPath[];
}

export default function FinancialWellnessResultSupport({
  relatedPaths,
}: FinancialWellnessResultSupportProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.92fr)_minmax(0,1.08fr)]">
      <FinancialWellnessSectionCard className="md:p-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0B4D8C]">
          Important note
        </p>
        <h2 className="mt-3 text-[28px] font-semibold leading-[1.3] text-[#11233A]">
          For awareness, not product advice
        </h2>
        <div className="mt-5 space-y-4 text-[16px] leading-[1.8] text-[#4C5D75]">
          <p>
            This result is designed to help you reflect on your current money
            situation. It is not personal financial advice and it does not
            compare or recommend any mutual fund schemes.
          </p>
          <p>
            If one or two areas look weaker, that does not mean things are
            failing overall. It simply shows where a guided conversation may
            help you prioritise better.
          </p>
        </div>
      </FinancialWellnessSectionCard>

      <FinancialWellnessSectionCard className="md:p-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0B4D8C]">
          Where to go next
        </p>
        <h2 className="mt-3 text-[28px] font-semibold leading-[1.3] text-[#11233A]">
          Continue from the path that feels most useful
        </h2>
        <p className="mt-4 text-[16px] leading-[1.8] text-[#4C5D75]">
          You can move into a goal-based journey, explore fit, or speak with us
          directly.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {relatedPaths.map((card) => (
            <div
              key={card.title}
              className="rounded-[18px] border border-[#D9E4EF] bg-[#F7FAFD] p-5"
            >
              <h3 className="text-[18px] font-semibold leading-[1.45] text-[#11233A]">
                {card.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.7] text-[#4C5D75]">
                {card.copy}
              </p>
              <Link
                href={card.href}
                className="mt-4 inline-flex text-[14px] font-semibold text-[#0B4D8C]"
              >
                {card.label}
              </Link>
            </div>
          ))}
        </div>
      </FinancialWellnessSectionCard>
    </div>
  );
}
