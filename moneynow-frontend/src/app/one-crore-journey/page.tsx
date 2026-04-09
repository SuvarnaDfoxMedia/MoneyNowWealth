import OneCroreJourneyPage from "@/components/journeys/OneCroreJourneyPage";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("/one-crore-journey", {
    title: "Rs. 1 Crore Journey | MoneyNow",
    description:
      "A MoneyNow SIP journey that helps users work backwards from a long-term wealth milestone like Rs 1 Crore.",
  });
}

export default function Page() {
  return <OneCroreJourneyPage />;
}
