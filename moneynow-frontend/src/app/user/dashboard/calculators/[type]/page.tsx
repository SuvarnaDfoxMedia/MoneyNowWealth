

import PremiumCalculators from "@/components/Dashboard/PremiumCalculators";

interface Props {
  params: Promise<{
    type: string;
  }>;
}

export default async function CalculatorPage({ params }: Props) {
  const { type } = await params;
  return <PremiumCalculators calculator={type} />;
}
