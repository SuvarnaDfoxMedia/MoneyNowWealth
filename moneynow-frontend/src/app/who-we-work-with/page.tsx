import WhoWeWorkWithPage from "@/components/journeys/WhoWeWorkWithPage";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("/who-we-work-with", {
    title: "Who We Work With | MoneyNow",
    description:
      "A MoneyNow journey that helps visitors identify the kind of support and next step that may fit them best.",
  });
}

export default function Page() {
  return <WhoWeWorkWithPage />;
}
