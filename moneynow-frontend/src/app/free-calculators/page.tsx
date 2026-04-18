import FreeCalculators from "@/components/Dashboard/FreeCalculators";
import React from "react";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { buildPageMetadata, resolveSeoEntry } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildPageMetadata("/free-calculators", {
    title: "Free Calculators | MoneyNow",
    description:
      "Use our free financial calculators for SIP, Lumpsum, Retirement Planning, Loan EMI, and more.",
  });
}

const FreeCalculatorsPage = async () => {
  const seo = await resolveSeoEntry("/free-calculators");

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <SeoJsonLd schema={seo?.page_schema} />
      <FreeCalculators />
    </div>
  );
};

export default FreeCalculatorsPage;
