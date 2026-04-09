import FinancialWellnessPage from "@/components/assessment/FinancialWellnessPage";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("/financial-wellness", {
    title: "Financial Wellness Assessment | MoneyNow",
    description:
      "Reflect on your current money habits, protection, investing, goals, and debt through MoneyNow's financial wellness journey.",
  });
}

export default function Page() {
  return <FinancialWellnessPage />;
}
