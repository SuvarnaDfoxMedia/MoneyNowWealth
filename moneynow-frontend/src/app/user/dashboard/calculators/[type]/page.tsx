import PremiumCalculators from "@/components/Dashboard/PremiumCalculators";

interface Props {
  params: {
    type: string;
  };
}

export default function CalculatorPage({ params }: Props) {
  return <PremiumCalculators calculator={params.type as any} />;
}
