import OneCroreJourneyPage from "@/components/journeys/OneCroreJourneyPage";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { buildPageMetadata, resolveSeoEntry } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata() {
  return buildPageMetadata("/one-crore-journey", {
    title: "Rs. 1 Crore Journey | MoneyNow",
    description:
      "A MoneyNow SIP journey that helps users work backwards from a long-term wealth milestone like Rs 1 Crore.",
  });
}

export default async function Page() {
  const seo = await resolveSeoEntry("/one-crore-journey");

  return (
    <>
      <SeoJsonLd schema={seo?.page_schema} />
      <OneCroreJourneyPage />
    </>
  );
}
