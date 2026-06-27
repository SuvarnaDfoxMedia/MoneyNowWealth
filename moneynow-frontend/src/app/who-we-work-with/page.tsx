import WhoWeWorkWithPage from "@/components/journeys/WhoWeWorkWithPage";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { buildPageMetadata, resolveSeoEntry } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata() {
  return buildPageMetadata("/who-we-work-with", {
    title: "Who We Work With | MoneyNow",
    description:
      "A MoneyNow journey that helps visitors identify the kind of support and next step that may fit them best.",
  });
}

export default async function Page() {
  const seo = await resolveSeoEntry("/who-we-work-with");

  return (
    <>
      <SeoJsonLd schema={seo?.page_schema} />
      <WhoWeWorkWithPage />
    </>
  );
}
