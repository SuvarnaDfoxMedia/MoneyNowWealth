import FinancialWellnessPage from "@/components/assessment/FinancialWellnessPage";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { buildPageMetadata, resolveSeoEntry } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildPageMetadata("/financial-wellness", {
    title: "Financial Wellness Assessment | MoneyNow",
    description:
      "Reflect on your current money habits, protection, investing, goals, and debt through MoneyNow's financial wellness journey.",
  });
}

export default async function Page() {
  const seo = await resolveSeoEntry("/financial-wellness");

  return (
    <>
      <SeoJsonLd schema={seo?.page_schema} />
      <FinancialWellnessPage />
    </>
  );
}
